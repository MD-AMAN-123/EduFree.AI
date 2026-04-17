
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  CONCEPT_COACH = 'CONCEPT_COACH',
  EXAM_ARENA = 'EXAM_ARENA',
  CREATOR_STUDIO = 'CREATOR_STUDIO',
  ECO_TRACKER = 'ECO_TRACKER',
  LEARNING_PATH = 'LEARNING_PATH',
  TEACHER_DASHBOARD = 'TEACHER_DASHBOARD',
  CUSTOMER_SUPPORT = 'CUSTOMER_SUPPORT',
  DOUBT_SOLVER = 'DOUBT_SOLVER',
  SMART_ANALYTICS = 'SMART_ANALYTICS',
  LEADERBOARD = 'LEADERBOARD',
}

export enum CoachMode {
  LEARNING = 'LEARNING',
  ANSWER = 'ANSWER',
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  audioData?: string; // base64
  imageData?: string; // base64 for generated images
  isAudio?: boolean;
  timestamp: number;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number; // For internal checking, though AI will validate
  explanation?: string;
}

export interface StudyBot {
  id: string;
  name: string;
  subject: string;
  personality: string;
  icon: string;
}

export enum Language {
  ENGLISH = 'English',
  HINDI = 'Hindi',
  HINGLISH = 'Hinglish',
  TAMIL = 'Tamil',
  TELUGU = 'Telugu',
  URDU = 'Urdu',
}

export interface LearningNode {
  id: string;
  title: string;
  description: string;
  status: 'LOCKED' | 'UNLOCKED' | 'IN_PROGRESS' | 'MASTERED';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  rationale: string; // Why this node was assigned (Explainable AI)
}

export interface TeacherInsight {
  topic: string;
  avgScore: number;
  difficultyLevel: string;
  recommendation: string;
}

export interface Student {
  id: string;
  name: string;
  grade: string;
  attendance: string;
  status: 'At Risk' | 'Stable' | 'Excelling';
}

export interface AIInsight {
  title: string;
  description: string;
  type: 'success' | 'warning' | 'info';
}

// --- Dashboard Analytics Types ---

export interface WeeklyMetric {
  day: string;
  hours: number;
}

export interface SyllabusMetric {
  name: string;
  value: number;
  color: string;
}

export interface DailyGoal {
  id: string;
  title: string;
  completed: boolean;
  xp: number;
}

export interface DashboardStats {
  topicsMastered: number;
  studyHours: number;
  avgScore: number;
  weakAreas: number;
  streak: number;
  xp: number;
  dailyGoals: DailyGoal[];
  weeklyActivity: WeeklyMetric[];
  syllabusProgress: SyllabusMetric[];
  aiInsights?: AIInsight[];
}

// --- Advanced Feature Types ---

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type ActivityType =
  | 'quiz_complete'
  | 'concept_session'
  | 'doubt_solved'
  | 'streak_bonus'
  | 'node_complete';

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar?: string;
  xp: number;
  streak: number;
  rank: number;
}

export interface RankInfo {
  rank: number;
  xpToNext: number;
  percentile: number;
}

export interface QuizSession {
  id: string;
  topic: string;
  difficulty: DifficultyLevel;
  questions: QuizQuestion[];
  answers: (number | null)[];
  startTime: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  timeTaken: number;
  xpEarned: number;
  weakAreas: string[];
  newDifficulty: DifficultyLevel;
}

export interface XPResult {
  xpAwarded: number;
  newTotal: number;
  milestones: MilestoneResult[];
}

export interface MilestoneResult {
  type: 'xp_milestone' | 'streak_badge';
  title: string;
  description: string;
  xpBonus: number;
}

export interface SyncOperation {
  id: string;
  type: 'upsert' | 'insert';
  table: string;
  data: object;
  timestamp: number;
}

export interface BroadcastMessage {
  id: string;
  teacherName: string;
  message: string;
  timestamp: number;
}

export interface ClassroomEvent {
  type: 'student_joined' | 'student_left' | 'broadcast';
  studentId?: string;
  data?: object;
}

export interface DifficultyUpdate {
  newDifficulty: DifficultyLevel;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  weakAreaFlagged?: string;
}

export interface StudentActivity {
  studentId: string;
  name: string;
  avatar?: string;
  currentTopic?: string;
  status: 'At Risk' | 'Stable' | 'Excelling';
  avgScore: number;
  lastActive: string;
  isOnline: boolean;
}

export interface ClassAnalytics {
  avgScorePerTopic: { topic: string; avgScore: number }[];
  mostCommonWeakAreas: string[];
  engagementRate: number;
  totalActiveStudents: number;
}
