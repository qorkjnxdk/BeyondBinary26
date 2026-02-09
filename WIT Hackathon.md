# **SPEC Document: Women's Anonymous Chat & Friendship Platform**

## **1\. Executive Summary**

A web-based platform enabling women in Singapore to engage in anonymous, topic-based conversations with other verified women, with the option to transition from anonymous chats to lasting friendships.

**Core Value Propositions:**

* Verified women-only safe space  
* Anonymous, topic-driven matching  
* Graduated privacy controls  
* Structured chat sessions with accountability  
* Path from anonymity to friendship

**Target Market:** Women in Singapore (Singpass verification)

---

## **2\. System Overview**

### **2.1 Platform**

* **Type:** Web application (responsive design for desktop and mobile browsers)  
* **Geography:** Singapore only  
* **Verification:** Singpass integration (women only)

### **2.2 Key Differentiators vs Competitors**

* **vs Reddit:** Real-time 1:1 matching, verified identity, structured sessions  
* **vs Friends:** Anonymity option, topic-based matching, new connections  
* **vs Chatbots:** Human connection, emotional support, real relationships

---

## **3\. User Roles & Permissions**

### **3.1 User States**

1. **Unregistered** \- Can view marketing pages only  
2. **Registered (Verified)** \- Full platform access  
3. **Suspended** \- Login only, view suspension notice  
4. **Banned** \- No access

### **3.2 Single User Role**

All verified users have identical permissions. No admin/moderator user interface (moderation handled via separate admin panel outside user-facing app scope).

---

## **4\. Core Features & Functionality**

### **4.1 User Registration & Authentication**

#### **4.1.1 Signup Flow**

1. User clicks "Sign Up"

2. Redirect to Singpass for verification

3. Singpass returns user data (name, NRIC, gender)

4. **System validates:** Gender \= Female (reject males)

5. User completes profile setup:

   * Age (dropdown: 18-100)  
   * Marital Status (dropdown: Single, Married, Divorced, Widowed, In a Relationship, It's Complicated)  
   * Employment (dropdown: Employed Full-time, Employed Part-time, Self-employed, Unemployed, Student, Retired, Homemaker)  
   * Hobbies (multi-select tags \+ free text input, max 10 hobbies, 30 characters each)  
   * Location (dropdown: Singapore postal districts 01-28)  
   * Has Baby (dropdown: Yes, No, Expecting)  
   * Career Field (dropdown: 20+ common fields \+ Other with text input, 50 characters)  
   * For each field above, set privacy level:  
     * **Anonymous can see** \- Visible during matching preview and anonymous chats  
     * **Match can see** \- Only visible after becoming friends  
     * **No one can see** \- Never visible to other users  
6. User creates login credentials:

   * Email address (validation required)  
   * Password (min 8 characters, must include uppercase, lowercase, number)  
7. Account created, redirected to main chat interface

#### **4.1.2 Subsequent Logins**

* Email \+ password authentication  
* "Remember me" option (30-day session)  
* Password reset via email

#### **4.1.3 Profile Management**

* Users can edit profile at any time via Settings  
* Changes reflect immediately in all contexts (matching, active chats if matched user refreshes)  
* Cannot change: Name (from Singpass), Gender, NRIC

---

### **4.2 Matching & Chat Initiation**

#### **4.2.1 Prompt Submission**

1. User enters natural language prompt in text box

   * **Character limit:** 280 characters  
   * Examples: "Need advice on dealing with difficult boss", "Want to talk about postpartum depression", "Looking for hiking buddies in the north"  
2. User clicks "Find Matches"

3. **System displays:** "X matches found online" (where X \= 0-5)

   * If X \= 0: Show message "No matches online right now. Try again later or adjust your prompt."  
   * If X \= 1-5: Display match cards

#### **4.2.2 Match Algorithm Logic**

**Ranking factors (in order of importance):**

1. **Online Status** (filter: only currently active users)  
2. **Topic Similarity** (NLP analysis of prompt against recent prompts/interests)  
3. **Profile Compatibility Score:**  
   * Age proximity (±5 years \= higher score)  
   * Shared hobbies (weighted by number of matches)  
   * Similar life stage (marital status, has baby)  
   * Geographic proximity (same/adjacent districts)

**Anti-gaming measures:**

* Don't match same pair within 24 hours (unless they're friends)  
* Penalized users (1-day ban) excluded from matching  
* Blocked users never matched together

**Output:** Top 5 ranked users (or fewer if \<5 available)

#### **4.2.3 Match Preview Cards**

Each match card displays:

* **Randomized username** for this session (e.g., "BlueButterfly42")  
* **Similarity score** (percentage: 50-99%)  
* **Profile data** marked "Anonymous can see":  
  * Example: Age: 28, Location: District 10, Hobbies: Yoga, Reading  
  * Note: Only shows fields user set to "Anonymous can see"  
* **"Invite to Chat" button**

#### **4.2.4 Invitation Management**

* User can send invites to multiple matches (1-5 simultaneously)  
* Each invite has **2-minute expiration** from send time  
* Invited user receives push notification \+ in-app alert  
* Invited user sees:  
  * Inviter's similarity score  
  * Inviter's "Anonymous can see" profile data  
  * Inviter's prompt text  
  * "Accept" / "Decline" buttons

**State changes:**

* If ANY invite is accepted → All pending invites (sent and received) auto-cancelled, both users enter chat room  
* If invite declined → That invite removed, others remain active  
* If invite expires → Automatically removed  
* User can "Refresh Invites" to cancel all pending and resubmit prompt

---

### **4.3 Chat Room Experience**

#### **4.3.1 Chat Initialization**

* Both users enter private chat room  
* **Randomized usernames** displayed (different from match preview, e.g., "GreenOcean88", "PurpleCloud21")  
* **Timer starts:** 10:00 minutes countdown visible to both  
* **Chat history:** Starts empty (no prior context)

#### **4.3.2 Chat Interface**

* **Text-only messaging**  
  * Standard text input box  
  * Send button \+ Enter key  
  * No images, emojis, voice, video, or file sharing  
* **Real-time delivery** (WebSocket/similar)  
* **Typing indicator** ("BlueStar is typing...")  
* **Message display:**  
  * Timestamp (HH:MM)  
  * Sender's randomized username  
  * Message text

#### **4.3.3 Chat Duration Rules**

**10-Minute Minimum:**

* Neither user can leave before timer reaches 0:00  
* "Leave Early" button disabled until 10 minutes elapsed

**After 10 Minutes:**

* Timer displays: "Minimum time reached"  
* System prompts both users: "Continue chatting? Yes / No"  
* If BOTH click Yes → Chat continues (no time limit)  
* If EITHER clicks No → Chat ends immediately

**Leaving Early (before 10 minutes):**

* User A clicks "Leave Early"  
* System shows User A: "Request sent. Waiting for approval..."  
* System prompts User B: "User GreenOcean88 wants to leave early. Approve? Yes / No"  
  * If User B clicks **Yes** → Chat ends, no penalty  
  * If User B clicks **No** → User A receives **1-day chat ban** (effective immediately), chat continues until 10-minute mark or User B leaves  
* **Penalty details:**  
  * Banned user sees banner: "You cannot chat for 24 hours due to early exit violation"  
  * Cannot submit prompts or accept invites  
  * Ban duration: 24 hours from penalty timestamp

#### **4.3.4 Connection Issues**

* If user goes **offline mid-chat:**  
  * **Grace period:** 90 seconds  
  * Other user sees: "UserName has disconnected. Waiting to reconnect..."  
  * If reconnect within 90 seconds → Chat resumes normally  
  * If exceed 90 seconds → Chat ends, no penalty (technical issue)

#### **4.3.5 End of Chat**

* When chat ends (naturally or via leave):  
  * System prompts both users: "Would you like to add UserName as a friend? Yes / No"  
  * If BOTH click Yes → Friend request sent (see Section 4.4)  
  * If EITHER clicks No → Chat history **deleted immediately**, return to main interface

---

### **4.4 Friend System**

#### **4.4.1 Friend Request Flow**

1. After mutual "Yes" to friendship:

   * System sends friend request notification to both  
   * Each user sees pending request: "UserName wants to be friends"  
   * Must explicitly accept (not automatic)  
2. Upon acceptance:

   * Both users added to each other's friend list  
   * **Real identities revealed:**  
     * Actual name (from Singpass)  
     * Profile data marked "Match can see" now visible  
   * **Chat history becomes permanent** (retroactively saved)

#### **4.4.2 Friends List**

* Accessible via sidebar/navigation  
* Displays:  
  * Friend's real name  
  * Online/offline status (green dot / gray dot)  
  * Last active timestamp (if offline)  
  * Unread message count (if any)

#### **4.4.3 Friend Chatting**

* Click friend's name to open direct chat  
* **No time limits or restrictions**  
* **No penalties** for leaving  
* Can have **one active friend chat** \+ participate in anonymous matching simultaneously  
* Chat history persists indefinitely  
* Text-only (same restrictions as anonymous chats)

#### **4.4.4 Unfriending**

* Either user can unfriend via friend profile menu  
* Confirmation dialog: "Are you sure? Chat history will be deleted."  
* If confirmed:  
  * Both removed from each other's friend lists  
  * All chat history permanently deleted  
  * No notification sent to other user (they'll see friend removed next login)

#### **4.4.5 Friend Limits**

* **No maximum** number of friends

---

### **4.5 Safety & Moderation**

#### **4.5.1 Report Function**

Available in:

* Active anonymous chats  
* Friend chats  
* Friend profiles

**Report flow:**

1. User clicks "Report" button

2. Modal appears with:

   * Reason (dropdown): Harassment, Inappropriate Content, Spam, Impersonation, Other  
   * Description (text area, 500 characters max)  
   * Optional: Screenshot upload (future enhancement, not MVP)  
3. On submit:

   * Report sent to moderation queue (human review)  
   * Current chat continues (no immediate action)  
   * Reporter sees confirmation: "Report submitted. We'll review within 24 hours."

**Moderator actions (separate admin panel):**

* Warning (email sent, no account restriction)  
* 7-day suspension  
* Permanent ban

**Consequences:**

* **Suspended users:** Cannot login except to view suspension notice and end date  
* **Banned users:** Account deactivated, cannot login

#### **4.5.2 Block Function**

Available in:

* Active anonymous chats (block button in chat header)  
* Friend profiles  
* Past chat participants (via chat history, if not yet friends)

**Block behavior:**

1. User A blocks User B

2. Immediate effects:

   * If in active chat → Chat ends immediately for both (no penalty)  
   * User B **never matched** with User A again (permanent)  
   * If friends → Automatically unfriended, history deleted  
   * User B receives no notification of block  
3. **Block list:** User A can view/unblock via Settings (unlimited blocks)

---

### **4.6 Notifications**

#### **4.6.1 Push Notification System**

Requires browser permission on first login.

**Notification types:**

1. **Incoming invite:** "Someone invited you to chat\! Topic: \[prompt preview\]"  
2. **Invite accepted:** "UserName accepted your invite. Chat starting now\!"  
3. **Friend request:** "UserName wants to be friends\!"  
4. **Friend accepted:** "You and \[Real Name\] are now friends\!"  
5. **New friend message:** "\[Real Name\]: \[message preview\]"  
6. **Chat ended:** "Chat with UserName has ended" (only if user not in app)

**Settings:**

* Toggle on/off per notification type  
* Quiet hours (user-defined, e.g., 10pm-8am)

---

## **5\. User Flows**

### **5.1 Primary User Flow: Anonymous Chat**

1\. User logs in → Main interface  
2\. User types prompt → Clicks "Find Matches"  
3\. System displays 3 online matches  
4\. User sends invites to 2 matches  
5\. Match 1 accepts → All invites cancelled  
6\. Both enter chat room, randomized names displayed  
7\. 10-minute timer starts  
8\. Users chat for 12 minutes  
9\. System prompts: "Continue chatting?"  
10\. User A: Yes, User B: Yes → Chat continues  
11\. After 5 more minutes, User A wants to leave  
12\. User A clicks "Continue chatting?" → No  
13\. Chat ends  
14\. System prompts: "Add as friend?"  
15\. Both click Yes → Friend request sent  
16\. Both accept → Now friends with real names visible

### **5.2 Secondary User Flow: Friend Chat**

1\. User logs in → Friend list visible  
2\. User clicks friend "Sarah" (online)  
3\. Chat window opens with history  
4\. User types message → Sends  
5\. Real-time delivery to Sarah  
6\. Sarah replies  
7\. User leaves chat (no restrictions)

### **5.3 Edge Case Flow: Early Exit with Penalty**

1\. In anonymous chat, 6 minutes elapsed  
2\. User A clicks "Leave Early"  
3\. System prompts User B: "Approve early exit?"  
4\. User B clicks No  
5\. User A receives 1-day ban notification  
6\. Chat continues until 10-minute mark  
7\. User A cannot chat for 24 hours

---

## **6\. Data Models**

### **6.1 User Table**

user\_id (PK, UUID)  
singpass\_nric (unique, encrypted)  
email (unique, indexed)  
password\_hash  
real\_name (from Singpass)  
age (integer)  
marital\_status (enum)  
employment (enum)  
hobbies (JSONB array)  
location (string, district code)  
has\_baby (enum)  
career\_field (string)  
privacy\_settings (JSONB: {field\_name: privacy\_level})  
created\_at (timestamp)  
last\_active (timestamp)  
account\_status (enum: active, suspended, banned)  
suspension\_end\_date (timestamp, nullable)  
penalty\_end\_date (timestamp, nullable)

### **6.2 Chat Session Table**

session\_id (PK, UUID)  
user\_a\_id (FK → user\_id)  
user\_b\_id (FK → user\_id)  
user\_a\_random\_name (string)  
user\_b\_random\_name (string)  
session\_type (enum: anonymous, friend)  
prompt\_text (string, nullable for friend chats)  
started\_at (timestamp)  
ended\_at (timestamp, nullable)  
minimum\_time\_met (boolean)  
is\_active (boolean)  
became\_friends (boolean, default false)

### **6.3 Message Table**

message\_id (PK, UUID)  
session\_id (FK → chat\_session)  
sender\_id (FK → user\_id)  
message\_text (text)  
sent\_at (timestamp)  
is\_deleted (boolean, for soft delete on unfriend)

### **6.4 Friendship Table**

friendship\_id (PK, UUID)  
user\_a\_id (FK → user\_id)  
user\_b\_id (FK → user\_id)  
origin\_session\_id (FK → chat\_session, nullable)  
created\_at (timestamp)

### **6.5 Invite Table**

invite\_id (PK, UUID)  
sender\_id (FK → user\_id)  
receiver\_id (FK → user\_id)  
prompt\_text (string)  
status (enum: pending, accepted, declined, expired, cancelled)  
created\_at (timestamp)  
expires\_at (timestamp, created\_at \+ 2 minutes)

### **6.6 Block Table**

block\_id (PK, UUID)  
blocker\_id (FK → user\_id)  
blocked\_id (FK → user\_id)  
created\_at (timestamp)

### **6.7 Report Table**

report\_id (PK, UUID)  
reporter\_id (FK → user\_id)  
reported\_id (FK → user\_id)  
session\_id (FK → chat\_session, nullable)  
reason (enum)  
description (text)  
status (enum: pending, reviewed, actioned)  
created\_at (timestamp)  
reviewed\_at (timestamp, nullable)  
moderator\_notes (text, nullable)  
action\_taken (enum: none, warning, suspension, ban, nullable)

---

## **7\. Business Logic & Rules**

### **7.1 Matching Algorithm Pseudocode**

def find\_matches(user, prompt):  
    \# Get eligible users  
    candidates \= get\_online\_users()  
    candidates \= exclude\_blocked(user, candidates)  
    candidates \= exclude\_recently\_matched(user, candidates, hours=24)  
    candidates \= exclude\_penalized(candidates)  
      
    \# Calculate scores  
    scored\_candidates \= \[\]  
    for candidate in candidates:  
        topic\_score \= calculate\_topic\_similarity(prompt, candidate.recent\_prompts)  
        profile\_score \= calculate\_profile\_compatibility(user, candidate)  
          
        \# Weighted combination  
        total\_score \= (topic\_score \* 0.6) \+ (profile\_score \* 0.4)  
        scored\_candidates.append((candidate, total\_score))  
      
    \# Sort and return top 5  
    scored\_candidates.sort(key=lambda x: x\[1\], reverse=True)  
    return scored\_candidates\[:5\]

def calculate\_profile\_compatibility(user\_a, user\_b):  
    score \= 0  
      
    \# Age proximity (max 20 points)  
    age\_diff \= abs(user\_a.age \- user\_b.age)  
    if age\_diff \<= 5:  
        score \+= 20 \- (age\_diff \* 2\)  
      
    \# Shared hobbies (max 30 points)  
    shared \= len(set(user\_a.hobbies) & set(user\_b.hobbies))  
    score \+= min(shared \* 10, 30\)  
      
    \# Life stage similarity (max 25 points)  
    if user\_a.marital\_status \== user\_b.marital\_status:  
        score \+= 15  
    if user\_a.has\_baby \== user\_b.has\_baby:  
        score \+= 10  
      
    \# Geographic proximity (max 25 points)  
    district\_distance \= calculate\_district\_distance(user\_a.location, user\_b.location)  
    if district\_distance \== 0:  
        score \+= 25  
    elif district\_distance \== 1:  
        score \+= 15  
    elif district\_distance \<= 3:  
        score \+= 5  
      
    return score / 100  \# Normalize to 0-1

### **7.2 Chat Time Enforcement**

def handle\_chat\_timer(session):  
    \# At 10-minute mark  
    if session.elapsed\_time \>= 600:  
        session.minimum\_time\_met \= True  
        prompt\_both\_users("Continue chatting?")  
      
def handle\_early\_exit\_request(session, requester\_id):  
    if session.elapsed\_time \< 600:  
        other\_user \= get\_other\_user(session, requester\_id)  
        prompt\_user(other\_user, "Approve early exit?")  
    else:  
        \# After 10 minutes, can leave freely  
        end\_chat(session)

def handle\_early\_exit\_approval(session, requester\_id, approved):  
    if not approved:  
        apply\_penalty(requester\_id, duration\_hours=24)  
        notify\_user(requester\_id, "1-day chat ban applied")

### **7.3 Privacy Level Enforcement**

def get\_visible\_profile\_data(viewer, target, relationship):  
    visible\_fields \= {}  
      
    for field, value in target.profile.items():  
        privacy \= target.privacy\_settings\[field\]  
          
        if privacy \== "anonymous\_can\_see":  
            visible\_fields\[field\] \= value  
          
        elif privacy \== "match\_can\_see":  
            if are\_friends(viewer, target):  
                visible\_fields\[field\] \= value  
          
        \# "no\_one\_can\_see" never added  
      
    return visible\_fields

---

## **8\. UI/UX Requirements**

### **8.1 Responsive Design**

* Mobile-first approach (min width: 320px)  
* Tablet breakpoint: 768px  
* Desktop breakpoint: 1024px  
* Chat interface optimized for portrait mobile screens

### **8.2 Key Screens**

**8.2.1 Main Interface (Post-Login)**

* Header: Logo, user avatar/menu, notifications icon  
* Center: Prompt input box (280 char counter)  
* "Find Matches" button  
* Sidebar: Friend list (collapsible on mobile)

**8.2.2 Match Results**

* Grid of match cards (2 columns mobile, 3 columns tablet, 5 columns desktop)  
* Each card: Random username, similarity %, visible profile data, "Invite" button  
* "Refresh Invites" button at top  
* Counter: "X matches found online"

**8.2.3 Chat Interface**

* Full-screen takeover (exit button returns to main)  
* Header: Other user's random name, timer, "Report" button, "Block" button  
* Message area: Scrollable, auto-scroll to latest  
* Input: Text box, send button, char counter if needed  
* Footer: "Leave Early" button (if \<10 min), "Continue?" prompt (if \>10 min)

**8.2.4 Friend List (Sidebar)**

* Search bar  
* Online friends at top (green dot)  
* Offline friends below (gray dot, last active)  
* Unread indicators (red badge with count)

### **8.3 Accessibility**

* WCAG 2.1 AA compliance  
* Keyboard navigation support  
* Screen reader compatible (ARIA labels)  
* High contrast mode option

---

## **9\. Technical Requirements**

### **9.1 Technology Stack Recommendations (can make executive decisions)**

* **Frontend:** Next.js  
* **Backend:** [Next.js](http://Next.js)  
* Auth: Better Auth  
* **Database:** Local SQLite (with JSONB for flexible profile data)  
* **Real-time:** WebSocket (Socket.io or similar)  
* **Authentication:** JWT tokens

### **9.2 Singpass Integration**

* Use Singpass NDI (National Digital Identity) API  
* OAuth 2.0 flow  
* Required claims: name, sex, nric\_number  
* Test environment available: https://stg-id.singpass.gov.sg/

### **9.3 Performance Requirements**

* Page load: \<3 seconds on 4G connection  
* Message delivery latency: \<1 second  
* Matching algorithm: \<2 seconds for 1000 concurrent users  
* Database query time: \<100ms for 95th percentile

### **9.4 Scalability**

* Support 10,000 concurrent users (MVP)  
* Horizontal scaling for WebSocket servers  
* Database read replicas for query distribution

### **9.5 Security**

* HTTPS only (TLS 1.3)  
* Password hashing: bcrypt (cost factor 12\)  
* NRIC encryption at rest: AES-256  
* SQL injection prevention (parameterized queries)  
* XSS protection (input sanitization)  
* CSRF tokens for state-changing operations  
* Rate limiting:  
  * Login attempts: 5/15min per IP  
  * API requests: 100/min per user  
  * Invite sends: 10/hour per user

---

## **10\. Privacy & Compliance**

### **10.1 Data Retention**

* **Anonymous chat logs:** Deleted immediately after chat ends (unless both become friends)  
* **Friend chat logs:** Retained until unfriending  
* **User profiles:** Retained until account deletion  
* **Reports:** Retained for 2 years  
* **Audit logs:** Retained for 1 year

### **10.2 User Rights (PDPA Compliance)**

* **Right to access:** Users can download their data via Settings  
* **Right to deletion:** Account deletion removes all data within 30 days  
* **Right to correction:** Profile editing always available

### **10.3 Data Collected**

* Identity: Name, NRIC (encrypted), Email  
* Profile: Age, marital status, employment, hobbies, location, has baby, career  
* Usage: Chat logs (friend only), login timestamps, matching history  
* Technical: IP address, browser fingerprint (for fraud prevention)

### **10.4 Privacy Policy & Terms**

* Must be accepted during signup  
* Clearly state: women-only platform, Singpass verification, chat recording policy, moderation practices

---

## **12\. Success Metrics**

### **12.1 KPIs to Track**

* Daily Active Users (DAU)  
* Chat initiation rate  
* Chat completion rate (full 10 minutes)  
* Friend conversion rate (anonymous → friend)  
* Average session duration  
* Retention: D1, D7, D30  
* Report rate (target: \<1% of chats)  
* Block rate (target: \<2% of chats)

### **12.2 Target Benchmarks (Month 3\)**

* 1,000 registered users  
* 50% DAU/MAU ratio  
* 70% chat completion rate  
* 20% friend conversion rate  
* \<5% early exit penalty rate

