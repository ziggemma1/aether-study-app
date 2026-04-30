export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  streak: number;
  curriculum: string;
  language: string;
  plan: 'free' | 'pro';
}

export interface Material {
  id: string;
  title: string;
  type: 'pdf' | 'youtube' | 'article' | 'audio' | 'unified';
  uploadDate: string;
  summary: string;
  keyTopics: string[];
  progress: number;
  content?: string;
}

export interface ReadingPlan {
  id: string;
  materialId: string;
  startDate: string;
  endDate: string;
  sessions: ReadingSession[];
}

export interface ReadingSession {
  id: string;
  date: string;
  topic: string;
  completed: boolean;
}

export interface PlanSession {
  id: string;
  day: number;
  date: string;
  topic: string;
  duration: string;
  completed: boolean;
  isEditing?: boolean;
  dailySummary?: string;
  detailedNotes?: string;
}

export interface SavedPlan {
  id: string;
  title: string;
  date: string;
  progress: number;
  sessions: PlanSession[];
}


export interface Quiz {
  id: string;
  materialId: string;
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface QuizResult {
  id: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  answers: number[]; // Index of selected option
  date: string;
}
