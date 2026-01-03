
export enum Quadrant {
  DO_FIRST = 'DO_FIRST',           // Urgent & Important
  SCHEDULE = 'SCHEDULE',           // Not Urgent & Important
  DELEGATE = 'DELEGATE',           // Urgent & Not Important
  ELIMINATE = 'ELIMINATE'          // Not Urgent & Not Important
}

export interface TaskAnalysis {
  title: string;
  quadrant: Quadrant;
  urgencyScore: number; // 1-10
  importanceScore: number; // 1-10
  reasoning: string;
  estimatedTime: string;
}

export interface FocusPlan {
  tasks: TaskAnalysis[];
  executiveSummary: string;
  topPriority: string;
}
