import { exec, ChildProcess, ExecException } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { BackgroundProcess } from '../types';
import { t } from '../i18n';

/**
 * BackgroundProcessManager - Manages background bash processes
 * This integrates with Claude Code's /bashes concept for managing long-running processes
 */
export class BackgroundProcessManager {
  private processes: Map<string, BackgroundProcess> = new Map();
  private childProcesses: Map<string, ChildProcess> = new Map();

  /**
   * Start a background process
   */
  async startProcess(command: string, taskId?: string): Promise<BackgroundProcess> {
    const processId = uuidv4();
    const now = new Date();

    const bgProcess: BackgroundProcess = {
      id: processId,
      taskId: taskId || uuidv4(),
      processId: 0, // Will be set when process starts
      command,
      status: 'running',
      startedAt: now
    };

    return new Promise((resolve, reject) => {
      const childProc = exec(command, (error: ExecException | null, stdout: string, stderr: string) => {
        if (error) {
          bgProcess.status = 'failed';
          bgProcess.exitCode = error.code || 1;
          bgProcess.output = stderr || error.message;
        } else {
          bgProcess.status = 'completed';
          bgProcess.exitCode = 0;
          bgProcess.output = stdout;
        }
        
        this.childProcesses.delete(processId);
        this.processes.set(processId, bgProcess);
      });

      if (childProc.pid) {
        bgProcess.processId = childProc.pid;
        this.processes.set(processId, bgProcess);
        this.childProcesses.set(processId, childProc);
        resolve(bgProcess);
      } else {
        reject(new Error('Failed to start process'));
      }
    });
  }

  /**
   * List all background processes (similar to /bashes command)
   */
  listProcesses(filter?: { status?: 'running' | 'completed' | 'failed' }): BackgroundProcess[] {
    let processes = Array.from(this.processes.values());

    if (filter?.status) {
      processes = processes.filter(proc => proc.status === filter.status);
    }

    return processes.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  /**
   * Get a specific background process
   */
  getProcess(id: string): BackgroundProcess | undefined {
    return this.processes.get(id);
  }

  /**
   * Kill a background process
   */
  async killProcess(id: string): Promise<boolean> {
    const childProc = this.childProcesses.get(id);
    const bgProcess = this.processes.get(id);

    if (!bgProcess) {
      throw new Error(t('tasks.notFound'));
    }

    if (childProc && !childProc.killed) {
      childProc.kill('SIGTERM');
      
      // Wait a bit, then force kill if still running
      setTimeout(() => {
        if (childProc && !childProc.killed) {
          childProc.kill('SIGKILL');
        }
      }, 5000);

      bgProcess.status = 'failed';
      bgProcess.exitCode = -1;
      this.childProcesses.delete(id);
      this.processes.set(id, bgProcess);
      
      return true;
    }

    return false;
  }

  /**
   * Kill all background processes
   */
  async killAllProcesses(): Promise<number> {
    const runningProcesses = this.listProcesses({ status: 'running' });
    let killed = 0;

    for (const proc of runningProcesses) {
      try {
        if (await this.killProcess(proc.id)) {
          killed++;
        }
      } catch (error) {
        console.error(`Failed to kill process ${proc.id}:`, error);
      }
    }

    return killed;
  }

  /**
   * Get process output/logs
   */
  getProcessOutput(id: string): string | undefined {
    const process = this.processes.get(id);
    return process?.output;
  }

  /**
   * Check if a process is still running
   */
  isProcessRunning(id: string): boolean {
    const childProc = this.childProcesses.get(id);
    return childProc !== undefined && !childProc.killed;
  }

  /**
   * Get process history
   */
  getProcessHistory(limit: number = 10): BackgroundProcess[] {
    const completed = this.listProcesses({ status: 'completed' })
      .concat(this.listProcesses({ status: 'failed' }));
    
    return completed
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Clean up completed/failed processes from memory
   */
  cleanupProcesses(): number {
    let cleaned = 0;
    
    for (const [id, process] of this.processes.entries()) {
      if (process.status !== 'running') {
        this.processes.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get summary statistics
   */
  getStatistics(): {
    running: number;
    completed: number;
    failed: number;
    total: number;
  } {
    const processes = Array.from(this.processes.values());
    
    return {
      running: processes.filter(p => p.status === 'running').length,
      completed: processes.filter(p => p.status === 'completed').length,
      failed: processes.filter(p => p.status === 'failed').length,
      total: processes.length
    };
  }
}
