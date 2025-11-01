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
  BACKGROUND_PROCESS = 'background_process',  // Background bash process
  BUILD = 'build',        // Build task
  SERVE = 'serve',        // Server/service task
  WATCH = 'watch',        // Watch/monitoring task
  TEST = 'test',          // Test task
  CUSTOM = 'custom'       // Custom task type
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
  // Enhanced fields for intelligent task management
  cwd?: string;              // Working directory
  project?: string;          // Project name
  conflicts?: string[];      // IDs of conflicting tasks
  dependencies?: string[];   // IDs of dependency tasks
  logFile?: string;         // Path to log file
}

export interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  tags?: string[];
  sessionId?: string;
  project?: string;
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
