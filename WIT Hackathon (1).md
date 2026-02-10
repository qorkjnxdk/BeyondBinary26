Great — this is a **clean pivot** and a much more coherent product.  
I’ll give you a **new, integrated SPEC v2** that:

* Incorporates **all prior design corrections**  
* Is **postpartum-first**, not generic women-only  
* Keeps things **buildable for MVP**  
* Avoids clinical claims while still targeting depression \+ isolation  
* Reads like something you could hand to engineers or judges

I’ll **rewrite**, not annotate. You can diff later if needed.

---

# **SPEC v2 — Postpartum Mothers Connection & Wellbeing Platform**

---

## **1\. Executive Summary**

A web-based platform designed specifically for post-birth mothers in Singapore to reduce **isolation** and **postpartum depressive symptoms** through safe human connection, ambient social presence, and lightweight self-care tools.

The platform combines:

* Anonymous, topic-based chat with a path to real friendships  
* A real-time social presence map to reduce feelings of aloneness  
* Private journalling with sentiment-aware reflection  
* Simple habit tracking focused on physical foundations of mental health

**Core Design Principles**

* Comfort over compliance  
* Support without diagnosis  
* Presence over performance  
* Privacy by default, trust by choice

**Target Market:** Postpartum mothers in Singapore (Singpass-verified women)

---

## **2\. Platform Overview**

### **2.1 Platform Type**

* Responsive web application (mobile-first)  
* Desktop and mobile browsers supported

### **2.2 Geography**

* Singapore only

### **2.3 Verification**

* Singpass (female users only)  
* Postpartum status self-declared (non-medical)

---

## **3\. Core Problems Addressed**

### **Isolation & Loneliness**

* Loss of daily adult interaction  
* Long hours at home alone  
* Social friction in initiating contact

### **Postpartum Depression Risk Factors**

* Rumination and emotional suppression  
* Sleep deprivation and physical depletion  
* Loss of routine and self-identity

**Important:**  
The platform does **not diagnose or treat depression**.  
It reduces *known contributors* through behavioral and social support.

---

## **4\. Key Features (High-Level)**

| Problem | Feature |
| ----- | ----- |
| Loneliness | Anonymous Chat |
| Feeling Alone | Live Social Presence Map |
| Emotional Processing | Journalling |
| Low Mood / Energy | Habit Tracker |

---

## **5\. User Roles & States**

### **5.1 User States**

1. Unregistered (marketing pages only)  
2. Verified Active User  
3. Suspended  
4. Banned

### **5.2 Role Model**

* Single role for all users  
* Moderation handled via separate admin panel

---

## **6\. Registration & Authentication**

### **6.1 Signup Flow**

1. User clicks **Sign Up**  
2. Redirect to Singpass OAuth  
3. System receives:  
   * Name  
   * NRIC  
   * Gender  
4. System validates:  
   * Gender \= Female  
5. User completes onboarding:  
   * Age range  
   * Postpartum stage:  
     * 0–3 months  
     * 3–6 months  
     * 6–12 months  
     * 12+ months  
   * District (01–28)  
   * Optional interests (tags)  
6. Login method:  
   * Singpass re-auth OR magic email link (no passwords)

---

## **7\. Feature 1 — Anonymous Chat (Isolation)**

### **7.1 Prompt-Based Matching**

* Users enter a short prompt (280 chars)  
* Example:  
  * “Feeling overwhelmed today”  
  * “Anyone awake with a newborn?”  
  * “Looking for someone to talk to”

### **7.2 Matching Logic**

**Eligibility**

* Online users only  
* Excludes blocked / recently matched users

**Ranking Factors**

1. Topic similarity (primary)  
2. Postpartum stage proximity  
3. Location proximity  
4. Light randomness (serendipity)

Matching intentionally avoids over-optimization to prevent echo chambers.

---

### **7.3 Match Preview**

Each card shows:

* Session pseudonym  
* Similarity range (e.g. “High / Medium” — no %)  
* Limited profile fields marked “Anonymous-visible”

---

### **7.4 Chat Session Rules**

#### **Chat Characteristics**

* Text-only  
* No media  
* Pseudonyms only  
* No history carryover

#### **Time Design**

* **Suggested** minimum: 10 minutes  
* Not enforced

#### **Early Exit**

* Allowed anytime  
* User selects reason:  
  * Low energy  
  * Not a good fit  
  * Personal reasons  
* No penalties  
* Exit data used silently to improve matching

---

### **7.5 Safety Controls**

* Block (instant, silent)  
* Report:  
  * “Report and continue”  
  * “Report and end chat immediately”

---

### **7.6 Post-Chat Outcomes**

At chat end, both users choose independently:

1. End chat (history deleted)  
2. Continue as **Anonymous Contacts**  
3. Request Friendship

---

## **8\. Friendship & Trust Progression**

### **8.1 Anonymous Contacts (Intermediate State)**

* Persistent chat  
* Still pseudonymous  
* Optional limited profile reveal

### **8.2 Friendship**

* Mutual consent required  
* Reveals:  
  * Real name  
  * Additional profile fields  
* Chat history becomes permanent

### **8.3 Unfriend**

* Deletes history  
* No notification

---

## **9\. Feature 2 — Live Social Presence Map**

### **9.1 Purpose**

To reduce the feeling of “I’m alone” by showing **others are here right now**, without requiring interaction.

### **9.2 Map Design**

* Singapore map (district-level granularity)  
* Stylized avatar dots (no photos)  
* No exact location

### **9.3 Views**

* All online users  
* Friends only (toggle)

### **9.4 Privacy**

* Presence is opt-in  
* Users can:  
  * Appear invisible  
  * Hide exact district (shows “nearby” instead)

### **9.5 Interaction**

* Clicking a dot:  
  * See pseudonym  
  * “Start chat” button (if available)

---

## **10\. Feature 3 — Journalling (Depression Support)**

### **10.1 Journalling Experience**

* Private, open-ended text  
* No prompts required (optional prompts available)

### **10.2 Sentiment Analysis**

* Local sentiment scoring (non-diagnostic)  
* Tracks emotional trends over time

### **10.3 Feedback Design**

* Reflective, not prescriptive  
* Example:  
  * “It sounds like today was heavy. You’re not alone in this.”  
  * “You’ve been carrying a lot lately. Be gentle with yourself.”

No clinical labels, no alerts, no risk flags.

---

### **10.4 Privacy**

* Journal entries are private by default  
* Never shared  
* Never used for matching

---

## **11\. Feature 4 — Habit Tracker (Foundations)**

### **11.1 Focus**

Physical and behavioral basics that support mental health.

### **11.2 Default Habits**

* Drink water  
* Sleep (rough estimate)  
* Go outside  
* Eat a meal  
* Stretch / move  
* Rest

### **11.3 Design Principles**

* No streaks  
* No penalties  
* Missed days are neutral

### **11.4 Feedback**

* Gentle encouragement  
* Trend-based insights, not goals

---

## **12\. Notifications**

* Chat invites  
* Friend messages  
* Optional daily check-in reminder

Quiet hours configurable.

---

## **13\. Safety & Moderation**

* Human moderation  
* Clear escalation paths  
* Zero tolerance for harassment  
* Strong block-first design

---

## **14\. Data Models (High-Level)**

### **Core Tables**

* Users  
* Chat Sessions  
* Messages  
* Friendships  
* Journal Entries  
* Habit Logs  
* Blocks  
* Reports

Journal and habit data strictly siloed from social features.

---

## **15\. Success Metrics**

### **Primary**

* Return-to-chat rate (7 days)  
* Average chats per user per week  
* Map engagement rate

### **Secondary**

* Journal consistency (not frequency)  
* Habit check-in usage  
* Friend conversion (non-goal, observed)

### **Anti-Metrics**

* Early exit penalties (removed)  
* Streak pressure (none)

---

## **16\. MVP Scope (Strong Recommendation)**

### **MVP Includes**

* Anonymous chat  
* Social presence map  
* Journalling (basic sentiment)  
* Habit tracker (manual)

### **Post-MVP**

* Advanced analytics  
* Personalisation  
* Optional community features

---

## **17\. Positioning Statement**

A private, human-first space for post-birth mothers to feel less alone, supported in small ways, and connected on their own terms.

---

If you want next, I can:

* Cut this into a **1-page YC spec**  
* Redesign the **map UX**  
* Stress-test **ethics & liability**  
* Turn this into a **pitch deck narrative**  
* Produce an **MVP engineering breakdown**

Tell me what you want to do next.

