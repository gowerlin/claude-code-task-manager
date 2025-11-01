export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RUNNING = 'running',  // For background processes
  FAILED = 'failed'     // For failed processes
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum TaskType {
  TASK = 'task',          // Regular task
  BACKGROUND_PROCESS = 'background_process'  // Background bash process
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  sessionId?: string;
  metadata?: Record<string, any>;
  // Background process specific fields
  processId?: number;
  command?: string;
  exitCode?: number;
}

export interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  tags?: string[];
  sessionId?: string;
}

export interface TaskManagerConfig {
  dataDir?: string;
  autoSave?: boolean;
  language?: string;
}

export interface BackgroundProcess {
  id: string;
  taskId: string;
  processId: number;
  command: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: Date;
  exitCode?: number;
  output?: string;
}
