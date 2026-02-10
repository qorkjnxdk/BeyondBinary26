# Sentiment Tracking & Visualization Implementation

## Overview
This feature extends the existing journaling functionality with AI-powered sentiment analysis (0-99 scale) and trend visualization to help postpartum mothers understand their emotional journey over time.

## ✅ What Was Implemented

### 1. Enhanced Gemini API Integration
**File:** `lib/gemini.ts`

- **Unified Prompt:** Single prompt analyzes journal entries and returns JSON with:
  - `sentiment_score` (0-99): AI-analyzed emotional score
  - `message`: Supportive, warm response
  - `suggestions`: Actionable tips (only for negative sentiment)

- **Sentiment Scoring Scale:**
  - 0-29: Heavy/negative emotions → "Sounds heavy today"
  - 30-69: Neutral/mixed emotions → "Neutral tone"
  - 70-99: Positive emotions → "Gentle positive tone"

- **Response Guidelines:**
  - Validates feelings warmly
  - Includes "other mothers" normalization
  - Provides gentle, non-prescriptive suggestions for low scores
  - NO clinical language or "you should" statements
  - Under 150 words, human-like tone

- **Error Handling:**
  - 10-second timeout on API calls
  - JSON parsing with fallback
  - Default neutral score (50) on failure

### 2. Database Updates
**Files:** `lib/db.ts`, `lib/journal.ts`, `scripts/migrate-sentiment-scores.js`

- **Migration:** Converted existing sentiment scores to 0-99 range
- **New Functions:**
  - `updateEntrySentiment()`: Updates sentiment score after AI generation
  - Modified `createJournalEntry()`: Creates entry with null sentiment initially
  - Modified `updateJournalEntry()`: Resets sentiment to null on edit

- **Flow:**
  1. Entry saved to DB (sentiment = null)
  2. AI analyzes and returns score
  3. Score saved to DB via `/api/journal/update-sentiment`
  4. Message/suggestions displayed temporarily (not stored)

### 3. API Endpoints

#### `/api/journal/generate-response` (Modified)
- Returns: `{ sentiment_score, message, suggestions }`
- Used for temporary AI responses

#### `/api/journal/update-sentiment` (New)
- Saves AI-generated sentiment score to database
- Request: `{ entry_id, sentiment_score }`
- Validates score is 0-99

#### `/api/journal/trends` (New)
- Returns trend data for visualization
- Query params: `period=7days|1month`
- Response:
  ```json
  {
    "period": "7days",
    "data": [{ "date": "2024-02-10", "sentiment": 45, "entry_id": "..." }],
    "average": 52,
    "trend": "improving" | "declining" | "stable"
  }
  ```
- **Trend Detection:** Compares first half vs second half average
  - Improving: +10 point increase
  - Declining: -10 point decrease

### 4. Sentiment Trends Visualization
**File:** `components/SentimentTrends.tsx`

**Features:**
- **Period Toggle:** 7 days or 1 month view
- **Line Chart:** Using recharts library
  - X-axis: Dates (formatted as MM/DD)
  - Y-axis: Sentiment scores (0-99)
  - Reference lines at 30 and 70 (zone boundaries)
  - Average line with label
- **Color Scheme:**
  - Chart line: Purple (#6366F1)
  - Average line: Blue (#3B82F6)
  - Dots: Purple with white stroke
- **Insight Card:**
  - Title based on trend and average
  - Supportive message (not analytical)
  - Support prompt for concerning trends (avg < 30 and declining)
- **Legend:**
  - Heavy days (0-29): Red indicator
  - Mixed days (30-69): Gray indicator
  - Good days (70-99): Green indicator
- **Empty State:** Encouraging message when < 2 entries

**Supportive Messaging Examples:**
- Improving: "Things are shifting upward. Whatever you're doing... that matters."
- Declining: "These patterns are real. Reaching out is a sign of strength."
- Stable/Good: "Hold onto these feelings - they're just as real as the hard days."

### 5. Frontend Integration
**File:** `components/tabs/JournalTab.tsx`

**Updated Flow:**
1. User saves entry
2. Entry saved to DB
3. AI generates sentiment + response
4. Sentiment saved to DB via new endpoint
5. Response displayed temporarily
6. Trends component updates automatically

**Changes:**
- Added `SentimentTrends` component at top of journal page
- Updated `AIResponse` interface to include `sentiment_score`
- Modified `handleSave()` to call update-sentiment endpoint
- Modified `handleUpdate()` to regenerate and save sentiment
- Updated `sentimentLabel()` for 0-99 scale

### 6. Dependencies
**Installed:** `recharts` (v2.x) for data visualization

## 🎨 Design Philosophy

### Privacy & Ethics
✅ **DO:**
- Normalize experiences ("This is common")
- Offer hope ("Support is available")
- Frame as "your journey" not "your scores"
- Validate all feelings

❌ **DON'T:**
- Diagnose ("You are depressed")
- Prescribe ("You must see a doctor")
- Judge or compare
- Use clinical language

### Visual Design
- **Calming colors:** Soft blues, purples, warm accents
- **Gentle curves:** Smooth line charts
- **Clear but not overwhelming:** Light grids, adequate spacing
- **Accessible:** High contrast text, clear labels

## 📊 Performance Considerations

1. **Caching:** Trends data can be cached client-side (5 min)
2. **Timeout:** Gemini API calls timeout at 10 seconds
3. **Error Handling:** Graceful fallbacks at every step
4. **Database Indexes:** Existing index on (user_id, created_at)

## 🧪 Testing Scenarios

### Test Entries:
```javascript
[
  { content: "Worst day ever. Can't do this.", expected: 10-20 },
  { content: "Baby smiled! I feel happy.", expected: 80-90 },
  { content: "Today was fine. Nothing special.", expected: 45-55 },
  { content: "Tired but okay.", expected: 50-60 },
  { content: "I feel like a failure.", expected: 5-15 }
]
```

### Verification:
- ✅ Scores are in correct ranges (0-29, 30-69, 70-99)
- ✅ Database stores scores correctly
- ✅ Chart displays with proper date formatting
- ✅ Insights are supportive and non-clinical
- ✅ Trends help identify patterns without judgment

## 🚀 Usage

1. **Write & Save Entry:**
   - User writes in journal
   - Clicks "Save Entry"
   - AI analyzes and returns sentiment + response
   - Score saved to DB, response shown temporarily

2. **View Trends:**
   - Trends component at top of journal page
   - Toggle between 7 days and 1 month
   - See patterns, average, and supportive insights

3. **Temporary Responses:**
   - AI message/suggestions appear after save
   - Click "Dismiss" to remove
   - Refresh page → responses disappear
   - Sentiment scores persist for trends

## 📁 File Structure

```
lib/
├── gemini.ts              # AI integration (sentiment + response)
├── journal.ts             # Journal CRUD + sentiment updates
└── db.ts                  # Database schema

app/api/journal/
├── route.ts               # Create/read entries
├── [id]/route.ts          # Update/delete entries
├── generate-response/     # AI response generation
│   └── route.ts
├── update-sentiment/      # Save sentiment scores
│   └── route.ts
└── trends/                # Trend data endpoint
    └── route.ts

components/
├── SentimentTrends.tsx    # Visualization component
├── JournalResponse.tsx    # Temporary response display
└── tabs/
    └── JournalTab.tsx     # Main journal interface

scripts/
└── migrate-sentiment-scores.js  # One-time migration
```

## 🎯 Success Criteria

✅ Single Gemini API call returns score + response
✅ Scores consistently in 0-99 range and make sense
✅ Database stores scores correctly
✅ Chart displays clearly with proper formatting
✅ Insights are supportive and non-clinical
✅ Trends help users see patterns without judgment
✅ Component loads in < 2 seconds
✅ Message/suggestions are temporary (not stored)
✅ Sentiment scores persist for visualization

## 💡 Future Enhancements

1. **Support Resources:** Link to professional help when avg < 30
2. **Weekly Summaries:** "This week you experienced..."
3. **Pattern Detection:** "Your mood tends to dip on..."
4. **Export Data:** Download trends as PDF for healthcare providers
5. **Custom Time Ranges:** Select specific date ranges
6. **Comparison View:** Compare weeks/months side-by-side

## 🐛 Known Considerations

- Gemini API may occasionally return non-JSON → Fallback to score 50
- Very short entries (< 10 words) may get inconsistent scores
- Trends require at least 2 entries to be meaningful
- Chart may look sparse with < 5 data points

## 📝 Notes

- Sentiment analysis happens on-demand (not on every page load)
- Scores are AI-generated, not rule-based
- Trends update in real-time as new entries are added
- Empty state encourages continued journaling
- All messaging emphasizes support, not judgment

---

**Implementation Date:** February 2026
**Dependencies:** recharts, @google/generative-ai
**Database:** SQLite with better-sqlite3
**Framework:** Next.js 14+ (App Router)
