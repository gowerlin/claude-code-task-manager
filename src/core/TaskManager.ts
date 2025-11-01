import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskStatus, TaskPriority, TaskFilter, TaskManagerConfig } from '../types';
import { t } from '../i18n';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const exists = promisify(fs.exists);

export class TaskManager {
  private tasks: Map<string, Task> = new Map();
  private dataDir: string;
  private dataFile: string;
  private autoSave: boolean;
  private sessionId: string;

  constructor(config: TaskManagerConfig = {}) {
    this.dataDir = config.dataDir || path.join(process.env.HOME || process.env.USERPROFILE || '.', '.claude-task-manager');
    this.dataFile = path.join(this.dataDir, 'tasks.json');
    this.autoSave = config.autoSave !== undefined ? config.autoSave : true;
    this.sessionId = uuidv4();
  }

  async init(): Promise<void> {
    await this.ensureDataDir();
    await this.loadTasks();
  }

  private async ensureDataDir(): Promise<void> {
    if (!fs.existsSync(this.dataDir)) {
      await mkdir(this.dataDir, { recursive: true });
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
    tags?: string[]
  ): Promise<Task> {
    const now = new Date();
    const task: Task = {
      id: uuidv4(),
      title,
      description,
      status: TaskStatus.PENDING,
      priority,
      tags,
      createdAt: now,
      updatedAt: now,
      sessionId: this.sessionId
    };

    this.tasks.set(task.id, task);
    
    if (this.autoSave) {
      await this.saveTasks();
    }

    return task;
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
      if (filter.tags && filter.tags.length > 0) {
        tasks = tasks.filter(task =>
          task.tags && filter.tags!.some(tag => task.tags!.includes(tag))
        );
      }
      if (filter.sessionId) {
        tasks = tasks.filter(task => task.sessionId === filter.sessionId);
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
}
