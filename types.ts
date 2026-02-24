
export enum Category {
  HEALTH = 'الصحة',
  FINANCE = 'المالية',
  SPIRITUAL = 'الروحانيات',
  CAREER = 'العمل',
  SOCIAL = 'العلاقات',
  LEARNING = 'التعلم',
  PERSONAL = 'تطوير الذات'
}

export interface Habit {
  id: string;
  name: string;
  category: Category;
  frequency: 'daily' | 'weekly';
  completedDates: string[]; // ISO Strings
  streak: number;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: Category;
  deadline: string;
  progress: number; // 0 to 100
  tasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
}

export interface DailyLog {
  date: string;
  mood: number; // 1-5
  notes: string;
  completedHabits: string[];
}

export enum PrayerName {
  FAJR = 'الفجر',
  DHUHR = 'الظهر',
  ASR = 'العصر',
  MAGHRIB = 'المغرب',
  ISHA = 'العشاء'
}

export interface PrayerLog {
  date: string;
  completed: PrayerName[];
}

export enum WorkoutType {
  GYM = 'جيم',
  RUNNING = 'جري',
  HOME = 'منزل'
}

export enum Intensity {
  LOW = 'منخفض',
  MEDIUM = 'متوسط',
  HIGH = 'عالي'
}

export interface WorkoutLog {
  date: string;
  type: WorkoutType;
  duration: number; // minutes
  intensity: Intensity;
}

// Hashish Tracker Types
export enum AttackResult {
  RESISTED = 'قاومت',
  FELL = 'سقطت'
}

export interface HashishAttack {
  id: string;
  time: string; // HH:mm
  activity: string; // أثناء ماذا؟
  reason: string; // السبب
  result: AttackResult;
}

export interface HashishDayLog {
  date: string; // yyyy-MM-dd
  count: number; // عدد المرات
  attacks: HashishAttack[];
  smokedDuringWork: boolean; // تدخين أثناء العمل
}

export interface HashishState {
  startDate: string; // تاريخ بداية البرنامج
  cleanStartDate: string | null; // تاريخ بداية النظافة الحالية
  longestStreak: number; // أطول سلسلة نظيفة
  currentGoal: number; // الهدف الحالي بالأيام
  dayLogs: HashishDayLog[];
}

export interface SleepLog {
  date: string;       // yyyy-MM-dd (the date you woke up)
  sleepTime: string;  // HH:mm — when you went to sleep
  wakeTime: string;   // HH:mm — when you woke up
  duration: number;   // calculated hours (float)
}

// Quran Tracker Types
export interface QuranLog {
  id: string;
  date: string;       // yyyy-MM-dd
  pagesRead: number;
}

export interface QuranState {
  khatmaStartDate: string; // yyyy-MM-dd
  khatmaGoalDays: number;  // Default e.g. 300
  streak: number;
  logs: QuranLog[];
}

// Projects Tracker Types
export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  completed: boolean;
  isTopTask: boolean;
}

export interface Project {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'paused' | string;
  progress: number;
  lastActivity: string; // ISO date string
  targetGoal?: string;
  currentStage?: string;
  tasks: ProjectTask[];
}

// Recovery Tracker Types
export interface RecoveryLog {
  id: string;
  date: string;
  pressureLevel: 'low' | 'medium' | 'high';
  isClean: boolean;
}

export interface RecoveryUrge {
  id: string;
  date: string;
  time: string;
  reason: 'work' | 'failure' | 'discussion' | 'fatigue' | string;
  intensity: number;
  alternativeUsed?: 'walk' | 'breath' | 'shower' | 'quran' | 'sports' | string;
}

export interface RecoveryState {
  startDate: string;
  cleanStartDate: string | null;
  longestStreak: number;
  currentGoal: number;
  logs: RecoveryLog[];
  urges: RecoveryUrge[];
}

export interface AthkarLog {
  date: string; // yyyy-MM-dd
  morningCompleted: boolean;
  eveningCompleted: boolean;
  counts: Record<string, number>; // thker id -> count
}

export interface UserState {
  habits: Habit[];
  goals: Goal[];
  logs: DailyLog[];
  prayerLogs: PrayerLog[];
  workoutLogs: WorkoutLog[];
  hashishState: HashishState;
  sleepLogs: SleepLog[];
  quranState: QuranState;
  projects: Project[];
  recoveryState: RecoveryState;
  athkarLogs: AthkarLog[];
}

