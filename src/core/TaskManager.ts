import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { spawn, exec, ChildProcess } from 'child_process';
import { Task, TaskStatus, TaskPriority, TaskFilter, TaskManagerConfig, TaskType } from '../types';
import { t } from '../i18n';
import { BackgroundProcessManager } from './BackgroundProcessManager';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const execAsync = promisify(exec);

// Constants
const CONFLICT_STOP_DELAY_MS = 1000;
const FORCE_KILL_DELAY_MS = 5000;

export class TaskManager {
  private tasks: Map<string, Task> = new Map();
  private dataDir: string;
  private dataFile: string;
  private logsDir: string;
  private autoSave: boolean;
  private sessionId: string;
  private backgroundProcessManager: BackgroundProcessManager;
  private runningProcesses: Map<string, ChildProcess> = new Map();
  private killTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: TaskManagerConfig = {}) {
    this.dataDir = config.dataDir || path.join(os.homedir(), '.claude-task-manager');
    this.dataFile = path.join(this.dataDir, 'tasks.json');
    this.logsDir = path.join(this.dataDir, 'logs');
    this.autoSave = config.autoSave !== undefined ? config.autoSave : true;
    this.sessionId = uuidv4();
    this.backgroundProcessManager = new BackgroundProcessManager();
  }

  async init(): Promise<void> {
    await this.ensureDataDir();
    await this.ensureLogsDir();
    await this.loadTasks();
  }

  private async ensureDataDir(): Promise<void> {
    if (!fs.existsSync(this.dataDir)) {
      await mkdir(this.dataDir, { recursive: true });
    }
  }

  private async ensureLogsDir(): Promise<void> {
    if (!fs.existsSync(this.logsDir)) {
      await mkdir(this.logsDir, { recursive: true });
    }
  }

  private async loadTasks(): Promise<void> {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = await readFile(this.dataFile, 'utf-8');
        const tasksArray: Task[] = JSON.parse(data);
        this.tasks = new Map(tasksArray.map(task => [task.id, {
          ...task,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined
        }]));
      }
    } catch (error) {
      console.error(t('errors.storageError'), error);
      this.tasks = new Map();
    }
  }

  private async saveTasks(): Promise<void> {
    try {
      const tasksArray = Array.from(this.tasks.values());
      await writeFile(this.dataFile, JSON.stringify(tasksArray, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(t('errors.storageError'));
    }
  }

  async createTask(
    title: string,
    description?: string,
    priority: TaskPriority = TaskPriority.MEDIUM,
    tags?: string[],
    type: TaskType = TaskType.TASK,
    options?: {
      command?: string;
      cwd?: string;
      project?: string;
      conflicts?: string[];
      dependencies?: string[];
    }
  ): Promise<Task> {
    const now = new Date();
    const task: Task = {
      id: uuidv4(),
      title,
      description,
      status: TaskStatus.PENDING,
      priority,
      type,
      tags,
      createdAt: now,
      updatedAt: now,
      sessionId: this.sessionId,
      command: options?.command,
      cwd: options?.cwd,
      project: options?.project,
      conflicts: options?.conflicts,
      dependencies: options?.dependencies
    };

    this.tasks.set(task.id, task);
    
    if (this.autoSave) {
      await this.saveTasks();
    }

    return task;
  }

  /**
   * Create a background process task and start the process
   * This integrates with /bashes concept from Claude Code
   */
  async createBackgroundTask(
    title: string,
    command: string,
    description?: string,
    priority: TaskPriority = TaskPriority.MEDIUM,
    tags?: string[]
  ): Promise<Task> {
    const task = await this.createTask(title, description, priority, tags, TaskType.BACKGROUND_PROCESS);
    
    try {
      const bgProcess = await this.backgroundProcessManager.startProcess(command, task.id);
      
      task.status = TaskStatus.RUNNING;
      task.command = command;
      task.processId = bgProcess.processId;
      task.metadata = {
        ...task.metadata,
        backgroundProcessId: bgProcess.id
      };

      this.tasks.set(task.id, task);
      
      if (this.autoSave) {
        await this.saveTasks();
      }
    } catch (error) {
      task.status = TaskStatus.FAILED;
      this.tasks.set(task.id, task);
      throw error;
    }

    return task;
  }

  /**
   * List all background processes (similar to /bashes command)
   */
  listBackgroundProcesses(): Task[] {
    return this.listTasks({ type: TaskType.BACKGROUND_PROCESS });
  }

  /**
   * Kill a background process
   */
  async killBackgroundProcess(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task || task.type !== TaskType.BACKGROUND_PROCESS) {
      throw new Error(t('tasks.notFound'));
    }

    const bgProcessId = task.metadata?.backgroundProcessId;
    if (bgProcessId) {
      await this.backgroundProcessManager.killProcess(bgProcessId);
      task.status = TaskStatus.CANCELLED;
      task.updatedAt = new Date();
      this.tasks.set(taskId, task);
      
      if (this.autoSave) {
        await this.saveTasks();
      }
    }
  }

  /**
   * Get background process manager for advanced operations
   */
  getBackgroundProcessManager(): BackgroundProcessManager {
    return this.backgroundProcessManager;
  }


  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const task = this.tasks.get(id);
    if (!task) {
      throw new Error(t('tasks.notFound'));
    }

    const updatedTask: Task = {
      ...task,
      ...updates,
      id: task.id, // Ensure ID cannot be changed
      createdAt: task.createdAt, // Ensure createdAt cannot be changed
      updatedAt: new Date()
    };

    this.tasks.set(id, updatedTask);

    if (this.autoSave) {
      await this.saveTasks();
    }

    return updatedTask;
  }

  async deleteTask(id: string): Promise<void> {
    if (!this.tasks.has(id)) {
      throw new Error(t('tasks.notFound'));
    }

    this.tasks.delete(id);

    if (this.autoSave) {
      await this.saveTasks();
    }
  }

  async completeTask(id: string): Promise<Task> {
    const task = this.tasks.get(id);
    if (!task) {
      throw new Error(t('tasks.notFound'));
    }

    return this.updateTask(id, {
      status: TaskStatus.COMPLETED,
      completedAt: new Date()
    });
  }

  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  listTasks(filter?: TaskFilter): Task[] {
    let tasks = Array.from(this.tasks.values());

    if (filter) {
      if (filter.status) {
        tasks = tasks.filter(task => task.status === filter.status);
      }
      if (filter.priority) {
        tasks = tasks.filter(task => task.priority === filter.priority);
      }
      if (filter.type) {
        tasks = tasks.filter(task => task.type === filter.type);
      }
      if (filter.tags && filter.tags.length > 0) {
        tasks = tasks.filter(task =>
          task.tags && filter.tags!.some(tag => task.tags!.includes(tag))
        );
      }
      if (filter.sessionId) {
        tasks = tasks.filter(task => task.sessionId === filter.sessionId);
      }
      if (filter.project) {
        tasks = tasks.filter(task => task.project === filter.project);
      }
    }

    return tasks.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  getSessionId(): string {
    return this.sessionId;
  }

  async exportTasks(filePath: string): Promise<void> {
    const tasksArray = Array.from(this.tasks.values());
    await writeFile(filePath, JSON.stringify(tasksArray, null, 2), 'utf-8');
  }

  async importTasks(filePath: string): Promise<number> {
    try {
      const data = await readFile(filePath, 'utf-8');
      const tasksArray: Task[] = JSON.parse(data);
      
      let imported = 0;
      for (const task of tasksArray) {
        if (!this.tasks.has(task.id)) {
          this.tasks.set(task.id, {
            ...task,
            createdAt: new Date(task.createdAt),
            updatedAt: new Date(task.updatedAt),
            completedAt: task.completedAt ? new Date(task.completedAt) : undefined
          });
          imported++;
        }
      }

      if (this.autoSave && imported > 0) {
        await this.saveTasks();
      }

      return imported;
    } catch (error) {
      throw new Error(t('errors.storageError'));
    }
  }

  // ========== Enhanced Task Management Methods ==========

  /**
   * Start a task - launches the command if specified
   * Handles conflicts and dependencies automatically
   */
  async startTask(id: string): Promise<Task> {
    const task = this.tasks.get(id);
    if (!task) {
      throw new Error(t('tasks.notFound'));
    }

    // Check and stop conflicting tasks
    if (task.conflicts && task.conflicts.length > 0) {
      for (const conflictId of task.conflicts) {
        const conflictTask = this.tasks.get(conflictId);
        if (conflictTask && (conflictTask.status === TaskStatus.RUNNING || conflictTask.status === TaskStatus.IN_PROGRESS)) {
          await this.stopTask(conflictId);
          // Wait a bit for the process to stop
          await new Promise(resolve => setTimeout(resolve, CONFLICT_STOP_DELAY_MS));
        }
      }
    }

    // Start dependency tasks
    if (task.dependencies && task.dependencies.length > 0) {
      for (const depId of task.dependencies) {
        const depTask = this.tasks.get(depId);
        if (depTask && depTask.status !== TaskStatus.RUNNING && depTask.status !== TaskStatus.IN_PROGRESS) {
          await this.startTask(depId);
        }
      }
    }

    // If task has a command, start it as a process
    if (task.command) {
      const cwd = task.cwd || process.cwd();
      const logFile = task.logFile || path.join(this.logsDir, `${id}.log`);
      
      // Create log file stream and wait for it to be ready
      const logStream = fs.createWriteStream(logFile, { flags: 'a' });
      await new Promise<void>((resolve, reject) => {
        logStream.once('open', () => resolve());
        logStream.once('error', (err) => reject(err));
        // Timeout after 5 seconds
        setTimeout(() => reject(new Error('Log stream timeout')), 5000);
      });
      
      // Spawn the process in detached mode
      const childProcess = spawn(task.command, [], {
        cwd,
        shell: true,
        detached: true,
        stdio: ['ignore', logStream, logStream]
      });

      if (childProcess.pid) {
        task.processId = childProcess.pid;
        task.status = TaskStatus.RUNNING;
        task.logFile = logFile;
        task.updatedAt = new Date();

        // Store the process reference
        this.runningProcesses.set(id, childProcess);

        // Handle process exit
        childProcess.on('exit', (code) => {
          const t = this.tasks.get(id);
          if (t) {
            t.status = code === 0 ? TaskStatus.COMPLETED : TaskStatus.FAILED;
            t.exitCode = code || 0;
            t.updatedAt = new Date();
            if (t.status === TaskStatus.COMPLETED) {
              t.completedAt = new Date();
            }
            this.tasks.set(id, t);
            this.runningProcesses.delete(id);
            
            // Clear any pending kill timeout
            const killTimeout = this.killTimeouts.get(id);
            if (killTimeout) {
              clearTimeout(killTimeout);
              this.killTimeouts.delete(id);
            }
            
            if (this.autoSave) {
              this.saveTasks().catch(console.error);
            }
          }
          logStream.end();
        });

        // Unref so the parent can exit
        childProcess.unref();

        this.tasks.set(id, task);
        if (this.autoSave) {
          await this.saveTasks();
        }
      } else {
        task.status = TaskStatus.FAILED;
        task.updatedAt = new Date();
        this.tasks.set(id, task);
        if (this.autoSave) {
          await this.saveTasks();
        }
        throw new Error('Failed to start process');
      }
    } else {
      // No command, just mark as in progress
      task.status = TaskStatus.IN_PROGRESS;
      task.updatedAt = new Date();
      this.tasks.set(id, task);
      if (this.autoSave) {
        await this.saveTasks();
      }
    }

    return task;
  }

  /**
   * Stop a running task
   */
  async stopTask(id: string): Promise<Task> {
    const task = this.tasks.get(id);
    if (!task) {
      throw new Error(t('tasks.notFound'));
    }

    const childProcess = this.runningProcesses.get(id);
    if (childProcess && task.processId) {
      try {
        // Try graceful kill first
        process.kill(task.processId, 'SIGTERM');
        
        // Wait a bit, then force kill if necessary
        const forceKillTimeout = setTimeout(() => {
          try {
            if (this.runningProcesses.has(id)) {
              process.kill(task.processId!, 'SIGKILL');
            }
          } catch (err) {
            // Process already killed
          }
          this.killTimeouts.delete(id);
        }, FORCE_KILL_DELAY_MS);
        
        this.killTimeouts.set(id, forceKillTimeout);
      } catch (error) {
        // Process may already be stopped
      }
      this.runningProcesses.delete(id);
    }

    // Clear any pending kill timeout
    const killTimeout = this.killTimeouts.get(id);
    if (killTimeout) {
      clearTimeout(killTimeout);
      this.killTimeouts.delete(id);
    }

    task.status = TaskStatus.CANCELLED;
    task.updatedAt = new Date();
    this.tasks.set(id, task);

    if (this.autoSave) {
      await this.saveTasks();
    }

    return task;
  }

  /**
   * Restart a task
   */
  async restartTask(id: string): Promise<Task> {
    await this.stopTask(id);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return await this.startTask(id);
  }

  /**
   * Stop all tasks with optional filtering
   */
  async stopAllTasks(filter?: { project?: string; type?: TaskType }): Promise<number> {
    let tasks = Array.from(this.tasks.values()).filter(
      task => task.status === TaskStatus.RUNNING || task.status === TaskStatus.IN_PROGRESS
    );

    if (filter) {
      if (filter.project) {
        tasks = tasks.filter(task => task.project === filter.project);
      }
      if (filter.type) {
        tasks = tasks.filter(task => task.type === filter.type);
      }
    }

    let stopped = 0;
    for (const task of tasks) {
      try {
        await this.stopTask(task.id);
        stopped++;
      } catch (error) {
        console.error(`Failed to stop task ${task.id}:`, error);
      }
    }

    return stopped;
  }

  /**
   * Cleanup completed and failed tasks
   */
  async cleanupTasks(): Promise<number> {
    let cleaned = 0;
    const tasksToRemove: string[] = [];

    for (const [id, task] of this.tasks.entries()) {
      if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.FAILED || task.status === TaskStatus.CANCELLED) {
        tasksToRemove.push(id);
      }
    }

    for (const id of tasksToRemove) {
      this.tasks.delete(id);
      cleaned++;
    }

    if (this.autoSave && cleaned > 0) {
      await this.saveTasks();
    }

    return cleaned;
  }

  /**
   * Find task by PID
   */
  findTaskByPid(pid: number): Task | undefined {
    for (const task of this.tasks.values()) {
      if (task.processId === pid) {
        return task;
      }
    }
    return undefined;
  }

  /**
   * Find tasks by command pattern (supports regex)
   */
  findTasksByCommand(pattern: string): Task[] {
    const regex = new RegExp(pattern, 'i');
    return Array.from(this.tasks.values()).filter(
      task => task.command && regex.test(task.command)
    );
  }

  /**
   * Batch operations
   */
  async batchStart(ids: string[]): Promise<{ succeeded: string[]; failed: string[] }> {
    const succeeded: string[] = [];
    const failed: string[] = [];

    for (const id of ids) {
      try {
        await this.startTask(id);
        succeeded.push(id);
      } catch (error) {
        failed.push(id);
      }
    }

    return { succeeded, failed };
  }

  async batchStop(ids: string[]): Promise<{ succeeded: string[]; failed: string[] }> {
    const succeeded: string[] = [];
    const failed: string[] = [];

    for (const id of ids) {
      try {
        await this.stopTask(id);
        succeeded.push(id);
      } catch (error) {
        failed.push(id);
      }
    }

    return { succeeded, failed };
  }

  async batchRestart(ids: string[]): Promise<{ succeeded: string[]; failed: string[] }> {
    const succeeded: string[] = [];
    const failed: string[] = [];

    for (const id of ids) {
      try {
        await this.restartTask(id);
        succeeded.push(id);
      } catch (error) {
        failed.push(id);
      }
    }

    return { succeeded, failed };
  }

  async batchRemove(ids: string[]): Promise<{ succeeded: string[]; failed: string[] }> {
    const succeeded: string[] = [];
    const failed: string[] = [];

    for (const id of ids) {
      try {
        await this.deleteTask(id);
        succeeded.push(id);
      } catch (error) {
        failed.push(id);
      }
    }

    return { succeeded, failed };
  }

  /**
   * Get task logs
   * Security: Uses safe file reading to avoid command injection
   */
  async getTaskLogs(id: string, lines: number = 50): Promise<string> {
    const task = this.tasks.get(id);
    if (!task) {
      throw new Error(t('tasks.notFound'));
    }

    const logFile = task.logFile || path.join(this.logsDir, `${id}.log`);
    
    if (!fs.existsSync(logFile)) {
      return 'No logs available';
    }

    try {
      // Read the entire file and return last N lines
      // This is safe from command injection as we're not using shell commands
      const content = await readFile(logFile, 'utf-8');
      const allLines = content.split('\n');
      return allLines.slice(-lines).join('\n');
    } catch (err) {
      return 'Error reading log file';
    }
  }

  /**
   * Provide intelligent suggestions
   */
  async suggestActions(command?: string): Promise<string[]> {
    const suggestions: string[] = [];

    // Check for running processes that might conflict
    if (command) {
      const runningTasks = this.listTasks({ status: TaskStatus.RUNNING });
      
      // Check for build commands
      if (command.includes('build') || command.includes('compile')) {
        const serveTasks = runningTasks.filter(t => t.type === TaskType.SERVE);
        if (serveTasks.length > 0) {
          suggestions.push(`Suggestion: Stop running servers before build: ${serveTasks.map(t => t.id).join(', ')}`);
        }
      }

      // Check for serve commands
      if (command.includes('serve') || command.includes('dev') || command.includes('start')) {
        const buildTasks = runningTasks.filter(t => t.type === TaskType.BUILD);
        if (buildTasks.length > 0) {
          suggestions.push(`Warning: Build tasks are running: ${buildTasks.map(t => t.id).join(', ')}`);
        }
      }
    }

    return suggestions;
  }

  /**
   * Session management
   */
  startSession(): string {
    this.sessionId = uuidv4();
    return this.sessionId;
  }

  endSession(): void {
    // Could add cleanup logic here if needed
  }
}
