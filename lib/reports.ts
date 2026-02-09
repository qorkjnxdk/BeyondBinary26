import db from './db';
import { v4 as uuidv4 } from 'uuid';

export type ReportReason = 'Harassment' | 'Inappropriate Content' | 'Spam' | 'Impersonation' | 'Other';
export type ReportStatus = 'pending' | 'reviewed' | 'actioned';
export type ActionTaken = 'none' | 'warning' | 'suspension' | 'ban';

export interface Report {
  report_id: string;
  reporter_id: string;
  reported_id: string;
  session_id?: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  created_at: number;
  reviewed_at?: number;
  moderator_notes?: string;
  action_taken?: ActionTaken;
}

// Create a report
export function createReport(
  reporterId: string,
  reportedId: string,
  reason: ReportReason,
  description?: string,
  sessionId?: string
): Report {
  const reportId = uuidv4();
  const now = Date.now();

  db.prepare(`
    INSERT INTO reports (
      report_id, reporter_id, reported_id, session_id, reason, description,
      status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(reportId, reporterId, reportedId, sessionId || null, reason, description || null, now);

  return {
    report_id: reportId,
    reporter_id: reporterId,
    reported_id: reportedId,
    session_id: sessionId,
    reason,
    description,
    status: 'pending',
    created_at: now,
  };
}

// Get reports for a user (as reporter)
export function getReportsByReporter(userId: string): Report[] {
  return db.prepare(`
    SELECT * FROM reports
    WHERE reporter_id = ?
    ORDER BY created_at DESC
  `).all(userId) as Report[];
}

