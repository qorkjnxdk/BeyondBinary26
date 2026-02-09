# Setup Instructions

## Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
Create a `.env.local` file in the root directory:
```
JWT_SECRET=your-secret-key-change-in-production-min-32-chars
```

3. **Run the development server:**
```bash
npm run dev
```

4. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

## Database

The SQLite database will be automatically created in the `database/` directory on first run. The schema is initialized automatically when the app starts.

## Testing the Application

### Sign Up Flow:
1. Go to `/auth/signup`
2. Enter test Singpass data (simulated):
   - NRIC: Any value (e.g., "S1234567A")
   - Name: Your name
   - Gender: Must be "F" (Female)
3. Complete profile setup
4. Set privacy preferences
5. Create account with email/password

### Finding Matches:
1. Log in to the dashboard
2. Enter a prompt (e.g., "Need advice on work-life balance")
3. Click "Find Matches"
4. Send invites to matches
5. Accept an invite to start chatting

### Chat Features:
- 10-minute minimum chat duration
- Timer countdown visible
- Early exit requires approval
- After 10 minutes, both users decide to continue or end
- Option to become friends after chat ends

## Notes

- Singpass integration is currently simulated. In production, integrate with Singpass NDI API.
- Real-time messaging uses polling (1-second intervals). For production, implement WebSocket.
- The matching algorithm uses simple text similarity. Consider advanced NLP for better matching.

## Troubleshooting

If you encounter errors:
1. Make sure all dependencies are installed: `npm install`
2. Check that `.env.local` exists with `JWT_SECRET` set
3. Ensure the `database/` directory is writable
4. Check the console for specific error messages

