# Harbour - Women's Anonymous Chat & Friendship Platform

A safe, supportive platform for women in Singapore — especially postpartum mothers — to connect through anonymous, topic-based conversations and transition into lasting friendships.

## Features

- **Anonymous Chat & Matching** — Describe what you'd like to talk about and get paired with a compatible partner. Chats are anonymous with graduated privacy controls, a 10-minute minimum duration to encourage depth, and the option to send friend requests afterward.
- **Interactive Presence Map** — Real-time map of Singapore showing user locations. Friends display initials; non-friends appear as anonymous "?" markers.
- **Journalling with AI Support** — Private journal with AI-generated supportive responses (Google Gemini). Entries are scored for sentiment and trends are visualised over time.
- **Habit Tracking** — Gentle daily check-ins for 6 physical habits with social encouragement (see how many others completed the same habit today). No streaks or punishments.
- **Baby Journey** — Tracks developmental stages from newborn to toddler based on birth date, with milestones, challenges, and stage-specific journal prompts.
- **Safety & Verification** — Singpass-verified women-only access (simulated), graduated privacy controls, report/block functionality, and account suspension support.

## Tech Stack

- **Frontend/Backend:** Next.js 14 with TypeScript
- **Database:** SQLite with better-sqlite3
- **Authentication:** JWT tokens
- **AI:** Google Gemini 2.5 Flash
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

3. Create a `.env.local` file:
```
GEMINI_API_KEY=your-gemini-api-key-here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

6. **Testing Anonymous Chat:** To test the anonymous chat matching, open two different browsers and log in with a different account in each. Use the two accounts below or sign up for new ones to experience the entire sign-up process!

7. If Signing Up fails for whatever reason, feel free to play around with these two profiles:
- Username: sr@gmail.com / Password: Password123
- Username: sr10@gmail.com / Password: Password123

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

## Development Notes

- Singpass integration is simulated — integrate with the real Singpass API for production.
- The matching algorithm uses text similarity scoring; consider more advanced NLP for production.
- AI journal responses are not persisted to protect user privacy.

## License

MIT
