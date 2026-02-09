# Beyond Binary - Women's Anonymous Chat & Friendship Platform

A web-based platform enabling women in Singapore to engage in anonymous, topic-based conversations with other verified women, with the option to transition from anonymous chats to lasting friendships.

## Features

- ✅ Verified women-only safe space (Singpass integration)
- ✅ Anonymous, topic-driven matching
- ✅ Graduated privacy controls
- ✅ Structured chat sessions with accountability (10-minute minimum)
- ✅ Path from anonymity to friendship
- ✅ Real-time messaging
- ✅ Friend system
- ✅ Safety features (reporting and blocking)

## Tech Stack

- **Frontend/Backend:** Next.js 14 with TypeScript
- **Database:** SQLite with better-sqlite3
- **Authentication:** JWT tokens
- **Real-time:** Polling-based (WebSocket can be added)
- **Styling:** Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file:
```
JWT_SECRET=your-secret-key-here
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/app
  /api          - API routes
  /auth         - Authentication pages
  /dashboard    - Main application
/components    - React components
/lib           - Business logic and utilities
/database      - SQLite database files
```

## Key Features Implementation

### Authentication
- Signup with Singpass verification (simulated)
- Email/password login
- JWT token-based authentication

### Matching
- Topic-based matching with NLP similarity
- Profile compatibility scoring
- Anti-gaming measures (24-hour cooldown, blocked users excluded)

### Chat System
- 10-minute minimum chat duration
- Early exit with approval system
- Penalty system for unapproved early exits
- Real-time message polling

### Friend System
- Mutual friend requests after chat
- Friend list with online/offline status
- Persistent friend chat history

### Safety
- Report functionality
- Block functionality
- Account suspension/banning support

## Database Schema

The application uses SQLite with the following main tables:
- `users` - User accounts and profiles
- `chat_sessions` - Chat session records
- `messages` - Chat messages
- `friendships` - Friend relationships
- `invites` - Chat invitations
- `blocks` - User blocks
- `reports` - User reports

## Development Notes

- Singpass integration is currently simulated. In production, integrate with Singpass NDI API.
- Real-time messaging uses polling. For better performance, implement WebSocket.
- The matching algorithm uses simple text similarity. Consider using more advanced NLP for production.

## License

MIT

