/**
 * TypeScript Types for Research Portal
 */

export interface ResearchMetadata {
  title?: string;
  category?: string;
  tags?: string[];
  [key: string]: any;
}

export interface ResearchProgress {
  percentage: number;
  currentTask?: string;
  currentTaskDescription?: string;
  completedTasks?: string[];
  startedAt?: string;
  estimatedCompletion?: string;
  updatedAt?: string;
}

export interface ResearchFile {
  name: string;
  path: string;
  isMarkdown: boolean;
}

export interface ResearchProject {
  id: string;
  researchId?: string; // The database UUID for the chat interface
  name: string;
  path: string;
  files: string[];
  metadata: ResearchMetadata;
  progress: ResearchProgress | null;
  createdAt: Date;
  modifiedAt: Date;
}

export interface ProjectsResponse {
  projects: Record<string, ResearchProject>;
  count: number;
  timestamp: string;
}

export interface FileContentResponse {
  fileName: string;
  projectId: string;
  content: string;
  html: string;
  timestamp: string;
}

export interface ProgressResponse {
  projectId: string;
  progress: ResearchProgress | null;
  timestamp: string;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  projectCount: number;
  researchDir: string;
  connectedClients: number;
  timestamp: string;
}

export interface WebSocketMessage {
  type: 'initial_data' | 'projects_updated' | 'progress_updated';
  projects?: Record<string, ResearchProject>;
  projectId?: string;
  progress?: ResearchProgress;
  timestamp: string;
}

export interface UIState {
  projects: Record<string, ResearchProject>;
  currentProject: string | null;
  currentFile: string | null;
  expandedProjects: Set<string>;
  favorites: string[];
  recent: Array<{ projectId: string; fileName: string; timestamp: number }>;
  wsConnected: boolean;
}
