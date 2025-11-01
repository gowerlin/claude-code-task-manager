export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  tags?: string[];
  sessionId?: string;
}

export interface TaskManagerConfig {
  dataDir?: string;
  autoSave?: boolean;
  language?: string;
}
