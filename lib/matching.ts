import db from './db';
import { getOnlineUsers, getUserById, type User } from './auth';
import { v4 as uuidv4 } from 'uuid';

export interface MatchResult {
  user: User;
  similarityScore: number;
  randomName: string;
}

// Generate random username for matching
export function generateRandomName(): string {
  const colors = ['Blue', 'Green', 'Purple', 'Pink', 'Red', 'Orange', 'Yellow', 'Teal', 'Indigo', 'Violet'];
  const nouns = ['Butterfly', 'Ocean', 'Cloud', 'Star', 'Moon', 'Sun', 'River', 'Mountain', 'Forest', 'Flower'];
  const number = Math.floor(Math.random() * 100);
  const color = colors[Math.floor(Math.random() * colors.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${color}${noun}${number}`;
}

// Calculate topic similarity (simplified - in production, use NLP)
function calculateTopicSimilarity(prompt: string, candidatePrompts: string[]): number {
  if (candidatePrompts.length === 0) return 0.5; // Default score

  const promptWords = prompt.toLowerCase().split(/\s+/);
  let maxSimilarity = 0;

  for (const candidatePrompt of candidatePrompts) {
    const candidateWords = candidatePrompt.toLowerCase().split(/\s+/);
    const commonWords = promptWords.filter(w => candidateWords.includes(w));
    const similarity = commonWords.length / Math.max(promptWords.length, candidateWords.length);
    maxSimilarity = Math.max(maxSimilarity, similarity);
  }

  return Math.min(maxSimilarity * 2, 1); // Scale to 0-1
}

// Calculate profile compatibility
function calculateProfileCompatibility(userA: User, userB: User): number {
  let score = 0;

  // Age proximity (max 20 points)
  if (userA.age && userB.age) {
    const ageDiff = Math.abs(userA.age - userB.age);
    if (ageDiff <= 5) {
      score += 20 - (ageDiff * 2);
    }
  }

  // Shared hobbies (max 30 points)
  if (userA.hobbies && userB.hobbies) {
    const shared = userA.hobbies.filter(h => userB.hobbies!.includes(h)).length;
    score += Math.min(shared * 10, 30);
  }

  // Life stage similarity (max 25 points)
  if (userA.marital_status && userB.marital_status) {
    if (userA.marital_status === userB.marital_status) {
      score += 15;
    }
  }
  if (userA.has_baby && userB.has_baby) {
    if (userA.has_baby === userB.has_baby) {
      score += 10;
    }
  }

  // Geographic proximity (max 25 points)
  if (userA.location && userB.location) {
    const districtA = parseInt(userA.location);
    const districtB = parseInt(userB.location);
    if (!isNaN(districtA) && !isNaN(districtB)) {
      const distance = Math.abs(districtA - districtB);
      if (distance === 0) {
        score += 25;
      } else if (distance === 1) {
        score += 15;
      } else if (distance <= 3) {
        score += 5;
      }
    }
  }

  return score / 100; // Normalize to 0-1
}

// Get recent prompts for a user (from recent chat sessions)
function getRecentPrompts(userId: string, limit: number = 5): string[] {
  const sessions = db.prepare(`
    SELECT prompt_text FROM chat_sessions
    WHERE (user_a_id = ? OR user_b_id = ?) AND prompt_text IS NOT NULL
    ORDER BY started_at DESC
    LIMIT ?
  `).all(userId, userId, limit) as Array<{ prompt_text: string | null }>;

  return sessions.map(s => s.prompt_text).filter((p): p is string => p !== null);
}

// Check if users were matched recently (within 24 hours)
function wereMatchedRecently(userAId: string, userBId: string): boolean {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const session = db.prepare(`
    SELECT session_id FROM chat_sessions
    WHERE ((user_a_id = ? AND user_b_id = ?) OR (user_a_id = ? AND user_b_id = ?))
    AND started_at > ?
    LIMIT 1
  `).get(userAId, userBId, userBId, userAId, oneDayAgo);

  return !!session;
}

// Check if user is blocked
function isBlocked(blockerId: string, blockedId: string): boolean {
  const block = db.prepare(`
    SELECT block_id FROM blocks
    WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)
    LIMIT 1
  `).get(blockerId, blockedId, blockedId, blockerId);
  return !!block;
}

// Main matching function
export function findMatches(userId: string, prompt: string): MatchResult[] {
  const user = getUserById(userId);
  if (!user) return [];

  // Get eligible candidates
  const onlineUsers = getOnlineUsers(userId);
  
  // Filter candidates
  const candidates = onlineUsers.filter(candidate => {
    // Exclude if blocked
    if (isBlocked(userId, candidate.user_id) || isBlocked(candidate.user_id, userId)) {
      return false;
    }

    // Exclude if matched recently (unless friends)
    if (wereMatchedRecently(userId, candidate.user_id)) {
      // Check if they're friends
      const friendship = db.prepare(`
        SELECT friendship_id FROM friendships
        WHERE (user_a_id = ? AND user_b_id = ?) OR (user_a_id = ? AND user_b_id = ?)
        LIMIT 1
      `).get(userId, candidate.user_id, candidate.user_id, userId);
      if (!friendship) return false;
    }

    // Exclude if penalized
    if (candidate.penalty_end_date && Date.now() < candidate.penalty_end_date) {
      return false;
    }

    return true;
  });

  // Calculate scores
  const scoredCandidates: Array<{ user: User; score: number }> = [];

  for (const candidate of candidates) {
    const candidatePrompts = getRecentPrompts(candidate.user_id);
    const topicScore = calculateTopicSimilarity(prompt, candidatePrompts);
    const profileScore = calculateProfileCompatibility(user, candidate);
    
    // Weighted combination: 60% topic, 40% profile
    const totalScore = (topicScore * 0.6) + (profileScore * 0.4);
    
    scoredCandidates.push({ user: candidate, score: totalScore });
  }

  // Sort by score and take top 5
  scoredCandidates.sort((a, b) => b.score - a.score);
  const topCandidates = scoredCandidates.slice(0, 5);

  // Convert to MatchResult with random names
  return topCandidates.map(({ user, score }) => ({
    user,
    similarityScore: Math.max(50, Math.min(99, Math.round(score * 100))), // 50-99%
    randomName: generateRandomName(),
  }));
}

// Get visible profile data based on privacy settings
export function getVisibleProfileData(viewerId: string, targetId: string, relationship: 'anonymous' | 'friend'): Record<string, any> {
  const target = getUserById(targetId);
  if (!target) return {};

  const visibleFields: Record<string, any> = {};
  const privacySettings = target.privacy_settings || {};

  // Check if they're friends
  const areFriends = relationship === 'friend' || !!db.prepare(`
    SELECT friendship_id FROM friendships
    WHERE (user_a_id = ? AND user_b_id = ?) OR (user_a_id = ? AND user_b_id = ?)
    LIMIT 1
  `).get(viewerId, targetId, targetId, viewerId);

  const fields = ['age', 'marital_status', 'employment', 'hobbies', 'location', 'has_baby', 'career_field'];
  
  for (const field of fields) {
    const privacy = privacySettings[field] || 'no_one_can_see';
    
    if (privacy === 'anonymous_can_see') {
      visibleFields[field] = (target as any)[field];
    } else if (privacy === 'match_can_see' && areFriends) {
      visibleFields[field] = (target as any)[field];
    }
    // 'no_one_can_see' is never added
  }

  return visibleFields;
}

