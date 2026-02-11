# Harbour - Women's Anonymous Chat & Friendship Platform

A web-based platform enabling women in Singapore to engage in anonymous, topic-based conversations with other verified women, with the option to transition from anonymous chats to lasting friendships. Built with a focus on postpartum mothers, Harbour provides a safe, supportive space for women to connect, reflect, and grow.

## Features

### Anonymous Chat & Matching
Users describe what they'd like to talk about, and the system pairs them with compatible conversation partners using topic similarity scoring. Chats are fully anonymous — users see only what the other person has chosen to share through graduated privacy controls. A 10-minute minimum chat duration encourages meaningful conversation, with an early exit approval system and penalty mechanism to prevent ghosting. After the minimum time, users can send friend requests to transition from anonymity to a named friendship.

### Interactive Presence Map
A draggable, zoomable map of Singapore shows where other users are located in real time. Users can toggle between viewing friends or everyone, and filter by online status. Friend pins display initials with coloured gradients, while non-friends appear as anonymous "?" markers. Clicking a pin reveals a popup with the user's location and online status — real names are only visible for friends.

### Journalling with AI Support
A private journalling space where users can write about their day and receive a supportive AI-generated response powered by Google Gemini. Each entry is scored for sentiment (0–99), and responses are tailored accordingly — validating difficult feelings, normalising mixed emotions, or celebrating positive moments. Sentiment trends are visualised over 7 days or 1 month, helping users track their emotional wellbeing over time. AI responses are shown temporarily and not stored.

### Habit Tracking
A gentle, pressure-free daily check-in system for 6 physical habits: drink water, sleep, go outside, eat a meal, move, and rest. Each habit shows how many other mothers completed the same action today, providing social encouragement without competition. A 7-day history view shows completion patterns, and personalised insights appear based on completion rates. There are no streaks or punishments — just supportive nudges.

### Baby Journey
Tracks a baby's developmental progression through 6 stages from newborn to toddler, auto-calculated from the baby's birth date. Each stage includes expected milestones, common challenges, and things to look forward to. Users can optionally track individual milestone achievements and receive stage-specific journal prompts.

### Safety & Verification
- Verified women-only access via Singpass integration (simulated)
- Graduated privacy controls with per-field visibility settings
- Report and block functionality
- Account suspension and banning support

## Tech Stack

- **Frontend/Backend:** Next.js 14 with TypeScript
- **Database:** SQLite with better-sqlite3
- **Authentication:** JWT tokens
- **AI:** Google Gemini 2.5 Flash (journal sentiment analysis)
- **Real-time:** Socket.IO with polling fallback
- **Styling:** Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/qorkjnxdk/BeyondBinary26.git
cd BeyondBinary26
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file:
```
GEMINI_API_KEY=your-gemini-api-key-here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/app
  /api          - API routes
  /auth         - Authentication pages
  /dashboard    - Main application
/components     - React components
/lib            - Business logic and utilities
/database       - SQLite database files
/scripts        - Seed and migration scripts
```

## Database Schema

The application uses SQLite with the following main tables:
- `users` - User accounts and profiles
- `chat_sessions` - Chat session records
- `messages` - Chat messages
- `friendships` - Friend relationships
- `friend_requests` - Pending friend requests
- `invites` - Chat invitations
- `blocks` - User blocks
- `reports` - User reports
- `journal_entries` - Private journal entries with sentiment scores
- `habit_logs` - Daily habit tracking data
- `stage_content` - Baby journey stage information
- `baby_milestones` - User milestone tracking
- `online_users` - Real-time presence tracking

## Development Notes

- Singpass integration is currently simulated. In production, integrate with Singpass API.
- Real-time messaging uses Socket.IO with polling fallback.
- The matching algorithm uses text similarity scoring. Consider using more advanced NLP for production.
- AI journal responses use Google Gemini and are not persisted to protect user privacy.

## License

MIT
