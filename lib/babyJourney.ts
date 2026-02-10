import db from './db';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface StageContent {
  stage: number;
  title: string;
  tagline: string;
  age_range: string;
  milestones: string[];
  challenges: string[];
  look_forward: string[];
  journal_prompts: string[];
  updated_at: number;
}

export interface BabyMilestone {
  milestone_id: string;
  user_id: string;
  stage: number;
  milestone_key: string;
  milestone_name: string;
  achieved: boolean;
  achieved_at: number | null;
  notes: string | null;
  created_at: number;
}

export interface BabyJourneyData {
  baby_name: string | null;
  baby_birth_date: string | null;
  baby_age_days: number | null;
  baby_age_display: string | null;
  current_stage: number;
  current_stage_content: StageContent | null;
  next_stage: number | null;
  next_stage_date: string | null;
  progress_in_stage: number;
  notifications_enabled: boolean;
  milestone_tracking_enabled: boolean;
}

export interface BabyJourneySettings {
  baby_birth_date?: string;
  baby_name?: string;
  notifications_enabled?: boolean;
  milestone_tracking_enabled?: boolean;
}

// Calculate baby age in days from birth date
export function calculateBabyAgeDays(birthDateStr: string): number {
  const birthDate = new Date(birthDateStr);
  const now = new Date();
  const diffTime = now.getTime() - birthDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Format age display (e.g., "3 weeks", "2 months 5 days", "1 year 2 months")
export function formatBabyAge(days: number): string {
  if (days < 0) return "Not born yet";
  if (days === 0) return "Today!";

  if (days < 7) {
    return `${days} day${days !== 1 ? 's' : ''} old`;
  }

  if (days < 30) {
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    if (remainingDays === 0) {
      return `${weeks} week${weeks !== 1 ? 's' : ''} old`;
    }
    return `${weeks} week${weeks !== 1 ? 's' : ''}, ${remainingDays} day${remainingDays !== 1 ? 's' : ''} old`;
  }

  if (days < 365) {
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    if (remainingDays < 7) {
      return `${months} month${months !== 1 ? 's' : ''} old`;
    }
    const weeks = Math.floor(remainingDays / 7);
    return `${months} month${months !== 1 ? 's' : ''}, ${weeks} week${weeks !== 1 ? 's' : ''} old`;
  }

  const years = Math.floor(days / 365);
  const remainingDays = days % 365;
  const months = Math.floor(remainingDays / 30);
  if (months === 0) {
    return `${years} year${years !== 1 ? 's' : ''} old`;
  }
  return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''} old`;
}

// Calculate stage number based on baby age in days
export function calculateStage(days: number): number {
  if (days < 0) return -1; // Not born yet
  if (days <= 30) return 0;        // 0-1 month
  if (days <= 90) return 1;        // 1-3 months
  if (days <= 180) return 2;       // 4-6 months
  if (days <= 270) return 3;       // 7-9 months
  if (days <= 365) return 4;       // 10-12 months
  return 5;                        // 12+ months
}

// Calculate progress within current stage (0-100)
export function calculateStageProgress(days: number, stage: number): number {
  const stageBoundaries = [
    { min: 0, max: 30 },      // Stage 0
    { min: 31, max: 90 },     // Stage 1
    { min: 91, max: 180 },    // Stage 2
    { min: 181, max: 270 },   // Stage 3
    { min: 271, max: 365 },   // Stage 4
    { min: 366, max: 10000 }  // Stage 5 (no upper limit)
  ];

  if (stage < 0 || stage >= stageBoundaries.length) return 0;

  const boundary = stageBoundaries[stage];
  const stageDuration = boundary.max - boundary.min;
  const daysIntoStage = days - boundary.min;

  if (stage === 5) return 100; // Stage 5 is always 100% (no end date)

  const progress = Math.min(100, Math.max(0, (daysIntoStage / stageDuration) * 100));
  return Math.round(progress);
}

// Get stage content from database
export function getStageContent(stage: number): StageContent | null {
  const row = db.prepare(
    `SELECT * FROM stage_content WHERE stage = ?`
  ).get(stage) as any;

  if (!row) return null;

  return {
    stage: row.stage,
    title: row.title,
    tagline: row.tagline,
    age_range: row.age_range,
    milestones: JSON.parse(row.milestones),
    challenges: JSON.parse(row.challenges),
    look_forward: JSON.parse(row.look_forward),
    journal_prompts: JSON.parse(row.journal_prompts),
    updated_at: row.updated_at,
  };
}

// Get all stage content (for timeline visualization)
export function getAllStageContent(): StageContent[] {
  const rows = db.prepare(
    `SELECT * FROM stage_content ORDER BY stage ASC`
  ).all() as any[];

  return rows.map(row => ({
    stage: row.stage,
    title: row.title,
    tagline: row.tagline,
    age_range: row.age_range,
    milestones: JSON.parse(row.milestones),
    challenges: JSON.parse(row.challenges),
    look_forward: JSON.parse(row.look_forward),
    journal_prompts: JSON.parse(row.journal_prompts),
    updated_at: row.updated_at,
  }));
}

// Get complete baby journey data for a user
export function getBabyJourneyData(userId: string): BabyJourneyData {
  const user = db.prepare(
    `SELECT baby_name, baby_birth_date,
            baby_journey_notifications_enabled,
            baby_journey_milestone_tracking_enabled
     FROM users WHERE user_id = ?`
  ).get(userId) as any;

  if (!user) {
    throw new Error('User not found');
  }

  let babyAgeDays: number | null = null;
  let currentStage = -1;
  let stageProgress = 0;
  let nextStage: number | null = null;
  let nextStageDate: string | null = null;

  if (user.baby_birth_date) {
    babyAgeDays = calculateBabyAgeDays(user.baby_birth_date);
    currentStage = calculateStage(babyAgeDays);
    stageProgress = calculateStageProgress(babyAgeDays, currentStage);

    // Calculate next stage date
    if (currentStage >= 0 && currentStage < 5) {
      nextStage = currentStage + 1;
      const stageBoundaries = [31, 91, 181, 271, 366]; // Start days of next stages
      const nextStageDays = stageBoundaries[currentStage];
      const birthDate = new Date(user.baby_birth_date);
      const nextStageDate_calc = new Date(birthDate);
      nextStageDate_calc.setDate(birthDate.getDate() + nextStageDays);
      nextStageDate = nextStageDate_calc.toISOString().split('T')[0];
    }
  }

  const currentStageContent = currentStage >= 0 ? getStageContent(currentStage) : null;

  return {
    baby_name: user.baby_name || null,
    baby_birth_date: user.baby_birth_date || null,
    baby_age_days: babyAgeDays,
    baby_age_display: babyAgeDays !== null ? formatBabyAge(babyAgeDays) : null,
    current_stage: currentStage,
    current_stage_content: currentStageContent,
    next_stage: nextStage,
    next_stage_date: nextStageDate,
    progress_in_stage: stageProgress,
    notifications_enabled: Boolean(user.baby_journey_notifications_enabled),
    milestone_tracking_enabled: Boolean(user.baby_journey_milestone_tracking_enabled),
  };
}

// Update baby journey settings
export function updateBabyJourneySettings(userId: string, settings: BabyJourneySettings): boolean {
  const updates: string[] = [];
  const values: any[] = [];

  if (settings.baby_birth_date !== undefined) {
    updates.push('baby_birth_date = ?');
    values.push(settings.baby_birth_date);
  }

  if (settings.baby_name !== undefined) {
    updates.push('baby_name = ?');
    values.push(settings.baby_name);
  }

  if (settings.notifications_enabled !== undefined) {
    updates.push('baby_journey_notifications_enabled = ?');
    values.push(settings.notifications_enabled ? 1 : 0);
  }

  if (settings.milestone_tracking_enabled !== undefined) {
    updates.push('baby_journey_milestone_tracking_enabled = ?');
    values.push(settings.milestone_tracking_enabled ? 1 : 0);
  }

  if (updates.length === 0) return false;

  values.push(userId);

  const result = db.prepare(
    `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`
  ).run(...values);

  return result.changes > 0;
}

// Milestone functions
export function createMilestone(
  userId: string,
  stage: number,
  milestoneKey: string,
  milestoneName: string
): BabyMilestone {
  const milestoneId = uuidv4();
  const now = Date.now();

  db.prepare(
    `INSERT INTO baby_milestones
     (milestone_id, user_id, stage, milestone_key, milestone_name, achieved, achieved_at, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(milestoneId, userId, stage, milestoneKey, milestoneName, 0, null, null, now);

  return {
    milestone_id: milestoneId,
    user_id: userId,
    stage,
    milestone_key: milestoneKey,
    milestone_name: milestoneName,
    achieved: false,
    achieved_at: null,
    notes: null,
    created_at: now,
  };
}

export function getUserMilestones(userId: string, stage?: number): BabyMilestone[] {
  let query = `SELECT * FROM baby_milestones WHERE user_id = ?`;
  const params: any[] = [userId];

  if (stage !== undefined) {
    query += ` AND stage = ?`;
    params.push(stage);
  }

  query += ` ORDER BY stage ASC, created_at ASC`;

  const rows = db.prepare(query).all(...params) as any[];

  return rows.map(row => ({
    milestone_id: row.milestone_id,
    user_id: row.user_id,
    stage: row.stage,
    milestone_key: row.milestone_key,
    milestone_name: row.milestone_name,
    achieved: Boolean(row.achieved),
    achieved_at: row.achieved_at,
    notes: row.notes,
    created_at: row.created_at,
  }));
}

export function updateMilestone(
  milestoneId: string,
  userId: string,
  achieved: boolean,
  notes?: string
): boolean {
  const achievedAt = achieved ? Date.now() : null;

  const result = db.prepare(
    `UPDATE baby_milestones
     SET achieved = ?, achieved_at = ?, notes = ?
     WHERE milestone_id = ? AND user_id = ?`
  ).run(achieved ? 1 : 0, achievedAt, notes || null, milestoneId, userId);

  return result.changes > 0;
}

export function deleteMilestone(milestoneId: string, userId: string): boolean {
  const result = db.prepare(
    `DELETE FROM baby_milestones WHERE milestone_id = ? AND user_id = ?`
  ).run(milestoneId, userId);

  return result.changes > 0;
}
