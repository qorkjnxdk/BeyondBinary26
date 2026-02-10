import db from './db';
import { getOnlineUsers, getUserById, updateLastActive, type User } from './auth';
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
    // Same location
    if (userA.location === userB.location) {
      score += 25;
    } else {
      // Check if same region (Central, North, East, West, North-East)
      const getRegion = (location: string): string | null => {
        if (location.includes('Central') || location.includes('Orchard') || location.includes('Marina') || location.includes('Chinatown') || location.includes('Little India') || location.includes('Clarke')) {
          return 'Central';
        }
        if (location.includes('North') || location.includes('Woodlands') || location.includes('Yishun') || location.includes('Sembawang') || location.includes('Ang Mo Kio') || location.includes('Bishan')) {
          return 'North';
        }
        if (location.includes('East') || location.includes('Tampines') || location.includes('Pasir Ris') || location.includes('Bedok') || location.includes('Changi') || location.includes('Simei')) {
          return 'East';
        }
        if (location.includes('West') || location.includes('Jurong') || location.includes('Clementi') || location.includes('Boon Lay') || location.includes('Pioneer') || location.includes('Tuas')) {
          return 'West';
        }
        if (location.includes('North-East') || location.includes('Punggol') || location.includes('Sengkang') || location.includes('Hougang') || location.includes('Serangoon') || location.includes('Kovan')) {
          return 'North-East';
        }
        return null;
      };
      
      const regionA = getRegion(userA.location);
      const regionB = getRegion(userB.location);
      if (regionA && regionB && regionA === regionB) {
        score += 15;
      } else if (regionA && regionB) {
        score += 5; // Different regions but still in Singapore
      }
    }
  }

  return score / 100; // Normalize to 0-1
}

// Get recent prompts for a user (from current_prompt, invites, and chat sessions)
// Only returns the most recent ACTIVE prompt
// Priority: current_prompt > pending invite > active chat session
export function getRecentPrompts(userId: string, limit: number = 5): string[] {
  // First, check the user's current_prompt field (set when they submit "Find Matches")
  // This shows what they're currently looking for, even before sending invites
  const user = db.prepare('SELECT current_prompt FROM users WHERE user_id = ?').get(userId) as { current_prompt: string | null } | undefined;
  
  if (user?.current_prompt && user.current_prompt.trim() !== '') {
    return [user.current_prompt];
  }

  // Second, try to get the most recent PENDING invite prompt
  const pendingInvite = db.prepare(`
    SELECT prompt_text FROM invites
    WHERE (sender_id = ? OR receiver_id = ?) 
      AND status = 'pending' 
      AND prompt_text IS NOT NULL 
      AND prompt_text != ''
      AND expires_at > ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(userId, userId, Date.now()) as { prompt_text: string | null } | undefined;

  // If we have a pending invite, return that prompt
  if (pendingInvite?.prompt_text) {
    return [pendingInvite.prompt_text];
  }

  // Third, get the most recent prompt from an ACTIVE chat session only
  const activeChatPrompt = db.prepare(`
    SELECT prompt_text FROM chat_sessions
    WHERE (user_a_id = ? OR user_b_id = ?) 
      AND prompt_text IS NOT NULL 
      AND prompt_text != ''
      AND is_active = 1
    ORDER BY started_at DESC
    LIMIT 1
  `).get(userId, userId) as { prompt_text: string | null } | undefined;

  if (activeChatPrompt?.prompt_text) {
    return [activeChatPrompt.prompt_text];
  }

  // No active prompt - return empty array
  return [];
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

  if (session) {
    console.log(`[MATCHING] Users ${userAId.substring(0, 8)}... and ${userBId.substring(0, 8)}... were matched recently (within 24 hours)`);
  }
  return !!session;
}

// Check if user is blocked
function isBlocked(blockerId: string, blockedId: string): boolean {
  const block = db.prepare(`
    SELECT block_id FROM blocks
    WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)
    LIMIT 1
  `).get(blockerId, blockedId, blockedId, blockerId);
  if (block) {
    console.log(`[MATCHING] Block found between ${blockerId.substring(0, 8)}... and ${blockedId.substring(0, 8)}...`);
  }
  return !!block;
}

// Main matching function
export function findMatches(userId: string, prompt: string): MatchResult[] {
  try {
    const user = getUserById(userId);
    if (!user) {
      console.error('User not found:', userId);
      return [];
    }

    // Update user's last active to mark them as online
    updateLastActive(userId);

    // Get eligible candidates
    let onlineUsers = getOnlineUsers(userId);
    console.log('[MATCHING] Online users found:', onlineUsers.length);
    console.log('[MATCHING] Online user IDs:', onlineUsers.map(u => u.user_id));
    
    // For testing: if no online users, also check users who have logged in recently (last 1 hour)
    if (onlineUsers.length === 0) {
      console.log('[MATCHING] No online users, checking recently active users...');
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const recentUsers = db.prepare(`
        SELECT u.* FROM users u
        WHERE u.last_active > ? AND u.account_status = 'active' AND u.user_id != ?
      `).all(oneHourAgo, userId) as any[];
      
      console.log('[MATCHING] Recently active users (raw):', recentUsers.length);
      onlineUsers = recentUsers.map(user => ({
        ...user,
        hobbies: user.hobbies ? JSON.parse(user.hobbies) : [],
        privacy_settings: user.privacy_settings ? JSON.parse(user.privacy_settings) : {},
      }));
      console.log('[MATCHING] Recently active users found:', onlineUsers.length);
      console.log('[MATCHING] Recently active user IDs:', onlineUsers.map(u => u.user_id));
    }
    
    // Log total users in database for debugging
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE account_status = ?').get('active') as { count: number };
    console.log('[MATCHING] Total active users in database:', totalUsers.count);
    
    // Filter candidates with detailed logging
    const candidates = onlineUsers.filter(candidate => {
      console.log(`[MATCHING] Checking candidate: ${candidate.user_id}`);
      
      // Exclude if blocked
      const isBlockedCheck = isBlocked(userId, candidate.user_id) || isBlocked(candidate.user_id, userId);
      if (isBlockedCheck) {
        console.log(`[MATCHING] Candidate ${candidate.user_id} filtered: BLOCKED`);
        return false;
      }

      // Exclude if matched recently (unless friends) - DISABLED FOR TESTING
      // const wasMatchedRecently = wereMatchedRecently(userId, candidate.user_id);
      // if (wasMatchedRecently) {
      //   // Check if they're friends
      //   const friendship = db.prepare(`
      //     SELECT friendship_id FROM friendships
      //     WHERE (user_a_id = ? AND user_b_id = ?) OR (user_a_id = ? AND user_b_id = ?)
      //     LIMIT 1
      //   `).get(userId, candidate.user_id, candidate.user_id, userId);
      //   if (!friendship) {
      //     console.log(`[MATCHING] Candidate ${candidate.user_id} filtered: MATCHED RECENTLY (not friends)`);
      //     return false;
      //   }
      //   console.log(`[MATCHING] Candidate ${candidate.user_id} passed: MATCHED RECENTLY but are friends`);
      // }

      // Exclude if penalized
      if (candidate.penalty_end_date && Date.now() < candidate.penalty_end_date) {
        console.log(`[MATCHING] Candidate ${candidate.user_id} filtered: PENALIZED`);
        return false;
      }

      console.log(`[MATCHING] Candidate ${candidate.user_id} PASSED all filters`);
      return true;
    });

  console.log('[MATCHING] Filtered candidates:', candidates.length);
  console.log('[MATCHING] Filtered candidate IDs:', candidates.map(c => c.user_id));

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
      similarityScore: Math.max(0, Math.min(100, Math.round(score * 100))), // 0-100% based on actual score
      randomName: generateRandomName(),
    }));
  } catch (error) {
    console.error('Error in findMatches:', error);
    return [];
  }
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

