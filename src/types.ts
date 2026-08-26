export interface GoalStep {
  id: string;
  text: string;
  completed: boolean;
  order: number;
}

export interface Goal {
  id: string;
  title: string;
  color: string;
  glowColor: string;
  steps: GoalStep[];
  month: string;
}

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  category?: string;
  color: string;
  order: number;
}

export interface DayTasks {
  id: string; // usually a date key like '2026-08-26'
  dayName: string;
  dateStr: string;
  dayIndex: number;
  tasks: TaskItem[];
}

export interface HabitItem {
  id: string;
  title: string;
  checks: boolean[]; // 30 days corresponding to the 30-day window
  target: number;
  category?: string;
}

export interface HabitMonthData {
  month: string;
  lastCalendarDate?: string; // YYYY-MM-DD to track rolling 30 days
  habits: HabitItem[];
  sleepHours: number[]; // 30 days
  sleepQuality: number[]; // 30 days (scale 1-10)
}

export type ActiveTab = 'goals' | 'habits' | 'tasks';
