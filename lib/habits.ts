import db from './db';
import { v4 as uuidv4 } from 'uuid';

export type HabitType =
  | 'drink_water'
  | 'sleep'
  | 'go_outside'
  | 'eat_meal'
  | 'move'
  | 'rest';

export interface HabitLog {
  log_id: string;
  user_id: string;
  habit_type: HabitType;
  value: number;
  created_at: number;
}

export const DEFAULT_HABITS: { id: HabitType; label: string }[] = [
  { id: 'drink_water', label: 'Drink water' },
  { id: 'sleep', label: 'Sleep (roughly okay)' },
  { id: 'go_outside', label: 'Go outside' },
  { id: 'eat_meal', label: 'Eat a meal' },
  { id: 'move', label: 'Stretch / move' },
  { id: 'rest', label: 'Rest' },
];

export function logHabit(userId: string, habitType: HabitType, value: number = 1): HabitLog {
  const logId = uuidv4();
  const now = Date.now();

  db.prepare(
    `INSERT INTO habit_logs (log_id, user_id, habit_type, value, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(logId, userId, habitType, value, now);

  return { log_id: logId, user_id: userId, habit_type: habitType, value, created_at: now };
}

export function getTodayHabits(userId: string): HabitLog[] {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const start = startOfDay.getTime();

  const rows = db.prepare(
    `SELECT * FROM habit_logs
     WHERE user_id = ? AND created_at >= ?
     ORDER BY created_at DESC`
  ).all(userId, start) as any[];

  return rows.map(row => ({
    log_id: row.log_id,
    user_id: row.user_id,
    habit_type: row.habit_type as HabitType,
    value: row.value,
    created_at: row.created_at,
  }));
}
