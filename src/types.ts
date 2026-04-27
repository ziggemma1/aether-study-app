export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  streak: number;
  curriculum: string;
  language: string;
  country: string;
  plan: 'free' | 'pro';
  bio?: string;
  location?: string;
  handle?: string;
  avgQuizScore?: number;
  highestQuizScore?: number;
  lowestQuizScore?: number;
  quizTrend?: number;
  totalStudyTime?: number;
  timeTrend?: number;
  globalRank?: number;
  rankTrend?: number;
  streakTrend?: number;
  longestStreak?: number;
  weeklyTimeData?: { day: string; hours: number }[];
  points: number;
  followers?: string[];
  followersCount: number;
  friendsCount: number;
  following?: string[];
  achievements: Achievement[];
  aetherPoints?: number;
  freezeTokens?: number;
  themeUnlocked?: string[];
  lastActiveDate?: string;
  lastStreakResetDate?: string;
  optedInLeaderboard?: boolean;
}

export interface FriendRequest {
  id: string;
  senderId: any; // Can be string or User depending on populate
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}


export interface NoteSection {
  heading: string;
  content: string;
  imagePrompt: string;
  imageUrl?: string;
}

export interface Material {
  id: string;
  title: string;
  type: 'pdf' | 'youtube' | 'article' | 'audio' | 'unified' | 'image' | 'video' | 'note' | 'voicenote';
  uploadDate: string;
  summary: string;
  keyTopics: string[];
  realLifeApplications?: string[];
  suggestedQuizQuestions?: Question[];
  detailedNotes?: string;
  noteSections?: NoteSection[];
  visualAidUrl?: string;
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

export interface Message {
  id: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  senderName?: string;
  senderAvatar?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  members: string[];
  admin: any;
  createdAt: string;
}

export interface StudySession {
  id: string;
  userId: string;
  title: string;
  startTime: string;
  durationMinutes: number;
  type: 'study' | 'break' | 'review';
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'usage' | 'social' | 'academic';
  target: number;
  currentProgress: number;
  isUnlocked: boolean;
  unlockedAt?: string;
}
