# SPEC v3 — Postpartum Mothers Connection & Wellbeing Platform

## 1. Executive Summary

A safe, Singpass-verified space for women (with a focus on postpartum mothers) in Singapore to:

- Engage in **anonymous, topic-based 1:1 conversations** with other verified women.
- See a **live sense of social presence** (“other mums are here right now”).
- **Privately journal** feelings with soft, non-clinical reflection.
- Keep up with **gentle physical habits** that support mood.
- Transition from **anonymous chats → anonymous contacts → real-name friendships**.

This document merges:

- The original **Women’s Anonymous Chat & Friendship Platform** spec.
- The **Postpartum Mothers Connection & Wellbeing Platform (v2)** spec.
- All major **implemented changes in the current Next.js + SQLite app**.

---

## 2. User Model & States

### 2.1 User States

1. **Unregistered** – Marketing pages only.  
2. **Verified Active** – Full access to all features.  
3. **Suspended** – Can log in only to view suspension notice and end date.  
4. **Banned** – No access.

### 2.2 Roles

- Single end-user role; **no in-app admin UI**.  
- Moderation, report review, and bans are handled via **separate tooling**.

### 2.3 Verification

- **Singpass NDI OAuth** (female-only).
- Required claims: name, sex, NRIC.
- App stores:
  - `real_name`, `singpass_nric` (encrypted), `gender`.

---

## 3. Registration & Profile

### 3.1 Signup Flow (Current MVP)

1. User clicks **Sign Up**.
2. Redirect to Singpass; app receives `name`, `nric`, `gender`.
3. System validates `gender === "Female"`.
4. User completes profile:
   - Age (18–100).
   - Marital status.
   - Employment.
   - Hobbies (tags + free text, max 10, ≤ 30 chars each).
   - Location (Singapore locations or postal districts).
   - Has baby (Yes / No / Expecting).
   - Career field (predefined list + “Other” with text).
5. For each field, user sets **privacy level**:
   - `anonymous_can_see` – visible in match cards and anonymous chats.
   - `match_can_see` – only visible after becoming friends.
   - `no_one_can_see` – never shown.
6. User sets login credentials (email + password) or Singpass-only auth (future).

### 3.2 Subsequent Logins

- Email + password.
- “Remember me” (30-day JWT).
- Password reset via email (to be integrated).

### 3.3 Profile Management

- `/profile/edit` allows editing:
  - Age, marital status, employment, hobbies, location, has baby, career field.
  - Field-level privacy settings.
- Cannot change:
  - Name (from Singpass), gender, NRIC.

---

## 4. Core Feature Pillars (Merged)

1. **Anonymous Chat & Friendship System**  
2. **Live Social Presence Map**  
3. **Private Journalling**  
4. **Gentle Habit Tracker**

Tabs for these four features are **persistent** across dashboard, journal, and habits pages.

---

## 5. Feature 1 — Anonymous Chat & Friendship

### 5.1 Prompt Submission & Matching

- User enters a short prompt (≤ 280 chars) describing what they want to talk about.
- Clicks **“Find Matches”**.
- `/api/matches`:
  - Validates prompt.
  - Checks if user is penalized (24h ban logic).
  - Calls `findMatches(userId, prompt)` in `lib/matching.ts`.

**Matching Logic (current implementation, aligned with spec):**

- **Eligibility filter:**
  - Prefer users currently online (`online_users` table, 30-min window).
  - Fallback: users active in last hour.
  - Exclude blocked / penalized users.
  - (For testing, “matched recently” filter may be disabled.)

- **Scoring:**
  - **Topic similarity** (stubbed; ready for NLP upgrade).
  - **Profile compatibility**:
    - Age proximity (±5 years).
    - Shared hobbies.
    - Life stage (marital status, has baby).
    - Location proximity (district distance).
  - Weighted: topic (60%) + profile (40%).  
  - Normalized to 0–100% similarity.

- **Result set:**
  - Up to 5 matches, each with:
    - Session pseudonym (e.g. `BlueSun28`).
    - Similarity percentage.
    - Visible profile data based on `anonymous_can_see`.
    - Other user’s most recent **active prompt** (“Their prompt”).

### 5.2 Invites & Session Start

- User can send multiple invites (1–5) from match cards.
- Each invite:
  - Stored in `invites` table with `status` and `expires_at`.
  - Expires after 2 minutes.

- `/api/invites`:
  - `POST` – send invite.
  - `PATCH` – accept or decline invite.
  - On accept:
    - Cancels all other pending invites for both users.
    - Creates a new `chat_session` with type `'anonymous'`.
    - Notifies sender via Socket.io and redirects both into Chat.

- When a user submits a **new prompt**, previous pending invites are cancelled and the user’s `current_prompt` field is updated so their latest intent shows up in match cards.

### 5.3 Anonymous Chat Room Experience

- **Characteristics:**
  - Text-only messaging; no media.
  - Random pseudonyms per session (different from match preview).
  - Real-time updates via WebSocket (Socket.io).
  - Typing indicators (“X is typing…”).

- **Duration & Early Exit (original spec vs. implementation):**
  - **Spec:** 10-minute minimum; early exit requires other user’s approval; denial triggers 24h penalty.
  - **Current:** 30 seconds minimum (for testing) using the same mechanics:
    - Before minimum time:
      - “Leave Early” triggers approval flow and possible penalty.
    - After minimum time:
      - Prompt with three options:
        1. Continue Talking.
        2. Add as Friend and End Convo.
        3. End Convo.

- **Mutual continuation:**
  - If both select **Continue**, chat continues with no time limit.
  - An “Add as Friend” button appears in the chat footer anytime after minimum time is met.

### 5.4 Friendship Path

**Data Model:**

- `friend_requests` – sender, receiver, session, status.
- `friendships` – pair IDs, origin session, created_at.

**Flow:**

1. From anonymous chat:
   - At end-of-chat prompt or via “Add as Friend”:
     - `/api/friend-requests` `POST` creates a pending request.
2. Receiving user:
   - Sees request in:
     - Friend sidebar “Friend Requests” section.
     - Notification badge + notifications panel.
   - Can **Accept** or **Decline**.
3. On Accept:
   - `/api/friend-requests` `PATCH`:
     - Marks request `accepted`.
     - Creates `friendship` row if not already friends.
     - Marks original `chat_session` as `became_friends = 1`, `session_type = 'friend'`.
     - Ensures messages are **not deleted** for this session.
4. Friend Chat:
   - Friend list (`/api/friends` + `FriendList` component) shows all friends with online/offline state.
   - Clicking a friend:
     - `/api/chat?friendId=...` returns an active friend chat, creating one if necessary.
   - **No time limits, no penalties**, history persists until unfriending.
   - Real names and additional “match_can_see” profile fields are visible.

---

## 6. Feature 2 — Live Social Presence Map

### 6.1 Purpose

Reduce isolation by showing that **other mums are online right now** in different parts of Singapore, without exposing exact locations.

### 6.2 Behavior

- Uses `/api/debug/users` to fetch:
  - All active users with status: `online`, `recently_active`, `offline`.
  - Location (district-level or named areas).
- Aggregates **online** users by `location`.

### 6.3 UI (Snap Map–inspired)

- Component: `components/PresenceMap.tsx`.
- Map card:
  - Gradient background (sky → indigo → emerald).
  - Total online count in top-right circular badge.
  - Stylized “heatmap” using radial gradient overlays.

- Pins:
  - Top N locations (e.g. 6) rendered as **floating pins**:
    - Count inside a small gradient circle.
    - Location label chip below (“Hougang”, “Tampines”, etc.).
    - Pin grows slightly on hover; click toggles “selected” state.

- Legend:
  - Compact chips below map: `Location · count`.
  - Clicking a chip also selects/highlights the location (+ pin).

### 6.4 Integration

- On `/dashboard`:
  - `PresenceMap` appears above the match interface.
  - Tabs include **Presence Map** for quick focus.

---

## 7. Feature 3 — Private Journalling

### 7.1 Data Model

- `journal_entries`:
  - `entry_id` (UUID PK).
  - `user_id` (FK → users).
  - `content` (text).
  - `sentiment` (integer, optional; simple heuristic).
  - `created_at` (timestamp).

### 7.2 Logic

- `lib/journal.ts`:
  - `createJournalEntry(userId, content)`:
    - Generates ID, timestamp.
    - Computes a **simple sentiment score** via keyword matches:
      - Positive words (+1 each), negative words (−1 each).
    - Stores entry with sentiment.
  - `getJournalEntries(userId, limit)`:
    - Returns recent entries sorted by `created_at` desc.

### 7.3 API

- `/api/journal`:
  - `GET`:
    - Auth required.
    - Returns `{ entries: JournalEntry[] }`.
  - `POST`:
    - Auth required.
    - Body: `{ content: string }` (non-empty).
    - Returns `{ entry }` for immediate UI update.

### 7.4 UI

- Route: `/journal`.
- Layout:
  - Shared `FeatureTabs` at top (consistent with dashboard & habits).
  - “Private Journal” card:
    - Textarea for new entry.
    - “Save Entry” button.
    - Copy emphasizing **privacy** and that entries are not used for matching.
  - Entries list:
    - Each entry shows timestamp, soft sentiment label, and content.
    - No editing/sharing; read-only history.

---

## 8. Feature 4 — Habit Tracker

### 8.1 Data Model

- `habit_logs`:
  - `log_id` (UUID PK).
  - `user_id` (FK → users).
  - `habit_type` (enum string).
  - `value` (integer; default 1).
  - `created_at` (timestamp).

### 8.2 Logic

- `lib/habits.ts`:
  - `DEFAULT_HABITS`:
    - drink_water, sleep, go_outside, eat_meal, move, rest.
  - `logHabit(userId, habitType)`:
    - Inserts a row for the current timestamp.
  - `getTodayHabits(userId)`:
    - Returns today’s logs so the UI can mark which habits are completed.

### 8.3 API

- `/api/habits`:
  - `GET`:
    - Auth required.
    - Returns `{ habits: HabitSummary[], logs }` for current day.
  - `POST`:
    - Auth required.
    - Body: `{ habitType }`.
    - Logs one check-in.

### 8.4 UI

- Route: `/habits`.
- Layout:
  - `FeatureTabs` at top.
  - “Gentle Habit Check-in” card:
    - Copy explicitly stating **no streaks, no penalties**.
    - Grid of rounded habit buttons:
      - Completed: green background with “✓”.
      - Incomplete: white/gray with “+”.
    - Tapping a habit logs it and refreshes the summary.

---

## 9. Notifications & Friend Activity

### 9.1 Friend Requests

- `/api/friend-requests?type=received`:
  - Used by:
    - `FriendRequestButton` in header (yellow).
    - `Notifications` panel.
    - `FriendList` requests section.

### 9.2 Friend Messages

- `/api/notifications/messages`:
  - Finds active friend chat sessions for the user.
  - Grabs last message per session; if last message is from friend, returns as a notification with:
    - Sender’s real name.
    - Message preview.
    - Session ID.

### 9.3 Notifications UI

- `components/Notifications.tsx`:
  - Slide-out panel listing:
    - Friend request notifications.
    - Friend message notifications.
  - Clicking a notification:
    - Opens the relevant **friend chat** (via `/api/chat?sessionId=` or `friendId`).

- Header in `/dashboard`:
  - `NotificationButton` (blue):
    - Shows badge with **#friend requests + #unread friend messages**.
  - `FriendRequestButton` (yellow):
    - Shows just the #pending friend requests.

---

## 10. Main UI Shell & Navigation

### 10.1 Feature Tabs (Global)

- Shared component `FeatureTabs`:
  - Tabs:
    - Anonymous Chat → `/dashboard#chat-section`
    - Presence Map → `/dashboard#presence-section`
    - Journal → `/journal`
    - Habits → `/habits`
  - Uses `usePathname` to highlight current feature.
  - Sticky at top with slight blur and border to feel “native”.

- Included at top of:
  - Dashboard page.
  - Journal page.
  - Habits page.

### 10.2 Dashboard Layout

- Left: Friend list sidebar (collapsible on mobile).
- Right: Main column:
  - Header with app name, user avatar, notifications + friends buttons.
  - `FeatureTabs`.
  - `PresenceMap` (live map).
  - `MatchInterface` (prompt + match cards + invites).

---

## 11. Data Model Summary (Actual DB)

Key tables now include:

- `users`
- `chat_sessions`
- `messages`
- `friend_requests`
- `friendships`
- `invites`
- `blocks`
- `reports`
- `online_users`
- `journal_entries`
- `habit_logs`

Each table maps closely to the original spec’s data model, with `journal_entries` and `habit_logs` added from v2 and implemented in `lib/db.ts`.

---

## 12. Open Questions & Future Work (Flags)

1. **Penalties for early exit:**
   - Kept from original spec, but v2 wellbeing framing suggests de-emphasizing or removing.
2. **Postpartum-specific onboarding:**
   - v2 adds postpartum stage and map emphasis; current implementation is generic women-only, with optional “has baby”.
3. **NLP sophistication:**
   - Matching & journalling sentiment currently simple; can be upgraded with lightweight ML models.
4. **Notification settings & quiet hours:**
   - Not yet implemented; spec calls for toggle per type + quiet hours window.

This merged SPEC v3 can now be used as the single source of truth for further development, testing, and pitching. It reflects both original and v2 design intentions, plus the system as it actually exists in your codebase. 

