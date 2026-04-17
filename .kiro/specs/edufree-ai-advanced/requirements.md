# Requirements Document

## Introduction

EduFree.AI Advanced is a real-time, AI-powered web learning platform built on the existing React/TypeScript/Supabase/Gemini stack. It extends the current app with a live collaborative classroom, real-time progress synchronization, advanced AI tutoring features (voice, vision, adaptive quizzes), a gamified XP/leaderboard system, a teacher analytics dashboard with live student monitoring, and a fully offline-capable PWA mode using WebLLM. The platform targets students in India and underserved regions who need quality education with or without internet connectivity.

---

## Glossary

- **System**: The EduFree.AI web application
- **Student**: An authenticated learner using the platform
- **Teacher**: An authenticated educator who monitors and manages students
- **AI_Coach**: The Gemini-powered or WebLLM-powered tutoring assistant
- **Doubt_Solver**: The vision-based question scanner and solver component
- **Exam_Arena**: The adaptive quiz and exam simulation module
- **Learning_Path**: The AI-generated personalized curriculum graph
- **Leaderboard**: The real-time ranked list of students by XP
- **Classroom**: A real-time collaborative session between a teacher and students
- **Offline_Mode**: Operation using on-device WebLLM when internet is unavailable
- **XP**: Experience points earned by completing learning activities
- **Streak**: Consecutive days of learning activity
- **PWA**: Progressive Web App enabling installability and offline caching
- **Supabase_Realtime**: Supabase's WebSocket-based live data subscription service
- **WebLLM**: Browser-based on-device LLM inference via WebGPU

---

## Requirements

### Requirement 1: Real-Time Dashboard & Live Stats

**User Story:** As a student, I want my dashboard to reflect my learning progress in real time, so that I can see up-to-date stats without refreshing the page.

#### Acceptance Criteria

1. WHEN a student completes a quiz or study session, THE System SHALL update the student's XP, streak, and syllabus progress in Supabase and reflect the changes on the dashboard within 2 seconds.
2. WHEN another student in the same cohort earns XP, THE Leaderboard SHALL update in real time via Supabase Realtime subscriptions without a page reload.
3. THE System SHALL display a live "study pulse" indicator showing how many students are currently active on the platform.
4. WHEN a student's streak is at risk of breaking (last activity > 20 hours ago), THE System SHALL display a prominent streak-warning banner on the dashboard.
5. WHEN the AI_Coach generates personalized insights, THE Dashboard SHALL stream and render those insights token-by-token using server-sent events or streaming API responses.

---

### Requirement 2: Advanced AI Concept Coach

**User Story:** As a student, I want an AI tutor that can explain concepts through text, voice, and images in my preferred language, so that I can learn in the most effective way for me.

#### Acceptance Criteria

1. WHEN a student sends a text message to the AI_Coach, THE AI_Coach SHALL respond using Gemini streaming so that tokens appear progressively in the chat UI.
2. WHEN a student records a voice message, THE System SHALL convert the audio to base64 and send it to Gemini's multimodal API, and THE AI_Coach SHALL respond with both text and synthesized speech via the Web Speech API.
3. WHEN a student selects a language from the supported list (English, Hindi, Hinglish, Tamil, Telugu, Urdu), THE AI_Coach SHALL respond entirely in that language for all subsequent messages in the session.
4. WHEN the AI_Coach is in Socratic (Learning) mode, THE AI_Coach SHALL ask at least one probing question per response and SHALL NOT directly reveal the answer.
5. WHEN the AI_Coach is in Answer mode, THE AI_Coach SHALL provide a structured response with headings, bullet points, and a "Key Takeaway" section.
6. WHEN internet is unavailable, THE System SHALL automatically switch to Offline_Mode using WebLLM (TinyLlama on-device) and SHALL display an "Offline AI Active" indicator.
7. WHEN WebLLM is loading for the first time, THE System SHALL display a download progress bar with percentage and estimated time.
8. WHEN a student requests a visual aid, THE AI_Coach SHALL generate a Markdown-formatted diagram or structured explanation and render it in the chat.

---

### Requirement 3: Vision-Based Doubt Solver

**User Story:** As a student, I want to photograph or upload a question from my textbook and get an instant AI-powered solution, so that I can resolve doubts without typing.

#### Acceptance Criteria

1. WHEN a student uploads or captures an image containing a question, THE Doubt_Solver SHALL use Tesseract.js to extract text from the image and display the extracted text for confirmation.
2. WHEN extracted text is confirmed, THE Doubt_Solver SHALL send the text and image to Gemini Vision API and THE System SHALL stream the solution step-by-step.
3. WHEN the solution is generated, THE Doubt_Solver SHALL display the topic name, final answer, and numbered solution steps in a structured card layout.
4. IF the image quality is too low for OCR (confidence < 60%), THEN THE Doubt_Solver SHALL prompt the student to retake or upload a clearer image.
5. WHEN a solution is generated, THE System SHALL save the question and solution to the student's personal doubt history in Supabase.

---

### Requirement 4: Adaptive Exam Arena

**User Story:** As a student, I want to take AI-generated quizzes that adapt to my performance, so that I am always challenged at the right difficulty level.

#### Acceptance Criteria

1. WHEN a student starts a quiz, THE Exam_Arena SHALL generate 5–10 questions using Gemini based on the selected topic and current difficulty level stored in the student's profile.
2. WHEN a student answers a question correctly 3 times in a row, THE Exam_Arena SHALL increase the difficulty level by one step (Beginner → Intermediate → Advanced).
3. WHEN a student answers a question incorrectly 2 times in a row, THE Exam_Arena SHALL decrease the difficulty level by one step and flag the topic as a weak area.
4. WHEN a quiz is completed, THE System SHALL calculate the score, award XP (10 XP per correct answer), update the student's weak areas list, and persist all results to Supabase.
5. WHEN a quiz is completed, THE Exam_Arena SHALL display a detailed results screen showing score, time taken, per-question breakdown, and AI-generated improvement tips.
6. THE Exam_Arena SHALL support a timed mode where each question has a configurable countdown timer (default 60 seconds), and WHEN the timer expires THE System SHALL auto-submit the current answer as incorrect.

---

### Requirement 5: Personalized Learning Path

**User Story:** As a student, I want an AI-generated learning roadmap for any subject, so that I know exactly what to study and in what order.

#### Acceptance Criteria

1. WHEN a student enters a subject name and clicks "Generate Path", THE Learning_Path SHALL call Gemini to generate a structured JSON array of learning nodes and render them as an interactive visual graph.
2. WHEN a student completes a learning node (by passing a related quiz with score ≥ 70%), THE System SHALL unlock the next node(s) in the path and update the node status in Supabase.
3. WHEN a learning node is clicked, THE System SHALL navigate to the AI_Coach with that node's topic pre-loaded as the initial conversation context.
4. THE Learning_Path SHALL display each node's difficulty level, estimated time, and an AI-generated rationale for why that topic is recommended next.
5. IF internet is unavailable, THEN THE Learning_Path SHALL display a pre-cached fallback path with at least 3 nodes for the most recently studied subject.

---

### Requirement 6: Real-Time Classroom & Teacher Dashboard

**User Story:** As a teacher, I want to monitor my students' live activity and performance, so that I can identify struggling students and intervene in real time.

#### Acceptance Criteria

1. WHEN a teacher opens the Teacher Dashboard, THE System SHALL display a live list of currently active students with their current activity (topic being studied, quiz in progress) updated via Supabase Realtime.
2. WHEN a student's average score drops below 50% on any topic, THE System SHALL flag that student with an "At Risk" status visible to the teacher.
3. WHEN a teacher clicks on a student, THE System SHALL display that student's full learning history, quiz scores, weak areas, and AI-generated intervention recommendations.
4. THE Teacher Dashboard SHALL display class-wide analytics including average score per topic, most common weak areas, and overall class engagement rate.
5. WHEN a teacher sends a broadcast message to the class, THE System SHALL deliver it to all active students as a real-time notification via Supabase Realtime.

---

### Requirement 7: Gamification & Leaderboard

**User Story:** As a student, I want to earn XP, maintain streaks, and compete on a leaderboard, so that learning feels engaging and motivating.

#### Acceptance Criteria

1. WHEN a student completes any learning activity (quiz, concept session, doubt solved), THE System SHALL award XP according to a defined points table and update the student's total XP in Supabase.
2. THE Leaderboard SHALL display the top 20 students ranked by total XP, updated in real time via Supabase Realtime subscriptions.
3. WHEN a student achieves a new personal best score or reaches an XP milestone (500, 1000, 2500, 5000 XP), THE System SHALL display a full-screen animated achievement notification.
4. WHEN a student maintains a streak of 7, 14, or 30 days, THE System SHALL award a streak badge and bonus XP (50, 150, 500 XP respectively).
5. THE System SHALL display the student's current rank, XP to next rank, and percentile among all students on the dashboard.

---

### Requirement 8: Offline PWA & Content Caching

**User Story:** As a student in a low-connectivity area, I want the app to work offline and cache my recent content, so that I can continue learning without internet.

#### Acceptance Criteria

1. THE System SHALL be installable as a PWA on desktop and mobile devices, with a manifest file and service worker registered at app startup.
2. WHEN a student visits any learning content page while online, THE System SHALL cache that content in the browser's Cache API for offline access.
3. WHEN the device goes offline, THE System SHALL display a persistent "Offline Mode" banner and switch AI features to WebLLM automatically.
4. WHEN the device comes back online, THE System SHALL sync any locally stored quiz results, XP changes, and progress updates to Supabase automatically.
5. THE System SHALL cache the student's most recent learning path, last 20 chat messages, and last 5 quiz results in localStorage for offline access.

---

### Requirement 9: Multi-Language UI & Accessibility

**User Story:** As a student who prefers learning in a regional language, I want the entire app interface and AI responses to be available in my language, so that language is not a barrier to learning.

#### Acceptance Criteria

1. THE System SHALL support UI language switching between English and Hindi for all static labels, buttons, and navigation items.
2. WHEN a student selects a language in the AI_Coach, THE System SHALL persist that preference to localStorage and apply it to all subsequent AI interactions in the session.
3. THE System SHALL render all AI responses with correct text direction (LTR for English/Hindi, RTL for Urdu) based on the selected language.
4. THE System SHALL meet WCAG 2.1 AA color contrast requirements for all text elements in both light and dark themes.
5. WHEN a student uses a screen reader, THE System SHALL provide appropriate ARIA labels for all interactive elements including chat messages, quiz options, and navigation items.

---

### Requirement 10: Authentication & User Profiles

**User Story:** As a user, I want to securely sign in and have my progress saved to my profile, so that I can continue learning across devices.

#### Acceptance Criteria

1. WHEN a user submits valid credentials, THE System SHALL authenticate via Supabase Auth and create a session token stored in a secure httpOnly-equivalent mechanism.
2. WHEN a user signs in with Google OAuth, THE System SHALL retrieve or create a Supabase user profile and redirect to the dashboard within 3 seconds.
3. WHEN a user updates their display name or avatar, THE System SHALL persist the changes to Supabase and reflect them in the UI within 1 second.
4. WHEN a user's session expires, THE System SHALL redirect to the login page and preserve the intended destination URL for post-login redirect.
5. IF a user attempts to access a protected route without authentication, THEN THE System SHALL redirect to the AuthPage immediately.
