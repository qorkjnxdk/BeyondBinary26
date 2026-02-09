import db from './db';
import { v4 as uuidv4 } from 'uuid';

export interface Block {
  block_id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: number;
}

// Create a block
export function createBlock(blockerId: string, blockedId: string): Block {
  const blockId = uuidv4();
  const now = Date.now();

  // Check if already blocked
  const existing = db.prepare(`
    SELECT block_id FROM blocks
    WHERE blocker_id = ? AND blocked_id = ?
    LIMIT 1
  `).get(blockerId, blockedId);

  if (existing) {
    return existing as Block;
  }

  db.prepare(`
    INSERT INTO blocks (block_id, blocker_id, blocked_id, created_at)
    VALUES (?, ?, ?, ?)
  `).run(blockId, blockerId, blockedId, now);

  return {
    block_id: blockId,
    blocker_id: blockerId,
    blocked_id: blockedId,
    created_at: now,
  };
}

// Check if user is blocked
export function isBlocked(blockerId: string, blockedId: string): boolean {
  const block = db.prepare(`
    SELECT block_id FROM blocks
    WHERE blocker_id = ? AND blocked_id = ?
    LIMIT 1
  `).get(blockerId, blockedId);
  return !!block;
}

// Get all blocks for a user
export function getBlocks(userId: string): Block[] {
  return db.prepare(`
    SELECT * FROM blocks
    WHERE blocker_id = ?
    ORDER BY created_at DESC
  `).all(userId) as Block[];
}

// Remove a block
export function removeBlock(blockerId: string, blockedId: string): void {
  db.prepare('DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?').run(blockerId, blockedId);
}

