# Implementation Plan: EduFree.AI Advanced

## Overview

Incremental implementation of the advanced EduFree.AI platform. Each task builds on the previous, starting with the data layer and core services, then UI components, then real-time features, and finally PWA/offline capabilities. All tasks reference specific requirements and design properties.

---

## Tasks

- [x] 1. Extend TypeScript types and Supabase schema
  - Add all new types to `types.ts`: `LeaderboardEntry`, `RankInfo`, `QuizSession`, `QuizResult`, `DifficultyLevel`, `ActivityType`, `SyncOperation`, `MilestoneResult`, `BroadcastMessage`, `ClassroomEvent`
  - Update `supabase_setup.sql` with the 6 new tables: extended `profiles`, `quiz_results`, `doubt_history`, `learning_nodes`, `broadcasts`, `achievements`
  - Add Row Level Security policies for all new tables
  - _Requirements: 1.1, 4.4, 7.1, 6.5_

- [x] 2. Build the Gamification Service
  - [x] 2.1 Implement `services/gamificationService.ts` with `awardXP`, `checkMilestones`, `getRanking`, and `getLeaderboard` functions
    - XP points table: quiz_complete = 10×correct, concept_session = 25, doubt_solved = 15, node_complete = 50
    - Milestone thresholds: XP at 500/1000/2500/5000, Streak at 7/14/30 days
    - _Requirements: 7.1, 7.3, 7.4, 7.5_

  - [ ]* 2.2 Write property tests for gamification service
    - **Property 1: XP Award Correctness** — for any activity type, awarded XP matches the points table
    - **Property 2: Leaderboard Ranking Invariant** — for any set of XP values, leaderboard is sorted descending with no duplicates
    - **Property 6: Milestone Detection** — for any XP/streak value, correct milestone and bonus returned at thresholds, none returned below
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

- [x] 3. Build the Adaptive Quiz Engine
  - [x] 3.1 Implement `services/adaptiveQuizEngine.ts` with `generateQuiz`, `processAnswer`, and `completeQuiz` functions
    - `processAnswer` tracks consecutive correct/incorrect counts and returns a `DifficultyUpdate`
    - `completeQuiz` calculates score, XP (10 per correct), weak areas, and new difficulty
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 3.2 Write property tests for adaptive quiz engine
    - **Property 3: Difficulty Adaptation Upward** — 3+ consecutive correct answers always increases difficulty (capped at Advanced)
    - **Property 4: Difficulty Adaptation Downward** — 2+ consecutive incorrect answers always decreases difficulty (floored at Beginner) and flags weak area
    - **Property 5: Quiz Score Calculation** — score = (correct/total)×100 rounded, XP = correct×10
    - **Validates: Requirements 4.2, 4.3, 4.4**

- [ ] 4. Checkpoint — Ensure all service tests pass, ask the user if questions arise.

- [x] 5. Extend Gemini service with streaming and vision improvements
  - [x] 5.1 Refactor `generateCoachResponseStream` to ensure it always yields at least one chunk and the concatenated chunks equal the full response
    - Add `blobToBase64` round-trip validation in the audio processing path
    - _Requirements: 2.1, 2.2_

  - [ ]* 5.2 Write property tests for Gemini service
    - **Property 8: Streaming Response Completeness** — concatenated chunks equal full response, at least one chunk yielded
    - **Property 9: Audio Base64 Round-Trip** — for any Blob, base64 decode produces same byte length as original
    - **Validates: Requirements 2.1, 2.2**

- [x] 6. Build the Offline Sync Queue and language utilities
  - [x] 6.1 Implement `services/syncQueue.ts` with `enqueue`, `flush`, and `getPending` functions using localStorage
    - `flush` attempts Supabase upserts for all pending operations and removes successful ones
    - _Requirements: 8.4_

  - [x] 6.2 Implement `services/i18nService.ts` with `getLabel(key, language)` for English/Hindi UI strings and `getTextDirection(language)` returning 'ltr' or 'rtl'
    - _Requirements: 9.1, 9.3_

  - [ ]* 6.3 Write property tests for sync queue and i18n
    - **Property 7: Offline Mode Routing** — when navigator.onLine is false, AI requests route to WebLLM, not Gemini
    - **Property 13: Text Direction Detection** — Urdu returns 'rtl', all others return 'ltr'
    - **Property 14: Language Preference Persistence** — set language → read localStorage → same value returned
    - **Property 17: Offline Cache Completeness** — cached data structurally equivalent to original after round-trip
    - **Validates: Requirements 2.6, 8.3, 8.5, 9.2, 9.3**

- [x] 7. Build the Realtime Service
  - [x] 7.1 Implement `services/realtimeService.ts` with Supabase Realtime subscriptions for leaderboard, classroom events, and student activity
    - `subscribeToLeaderboard` returns an unsubscribe function and fires callback on any XP change
    - `broadcastToClass` inserts a row into the `broadcasts` table, triggering all subscribed students
    - _Requirements: 1.2, 6.1, 6.5_

  - [ ]* 7.2 Write property tests for realtime service
    - **Property 11: At-Risk Classification** — avg score < 50 → "At Risk", ≥ 50 → not "At Risk"
    - **Property 18: Class Analytics Correctness** — class average equals arithmetic mean, most common weak area is correctly identified
    - **Validates: Requirements 6.2, 6.4**

- [ ] 8. Checkpoint — Ensure all service tests pass, ask the user if questions arise.

- [x] 9. Upgrade the Dashboard with real-time features
  - [x] 9.1 Add `LivePulse` component showing active student count via Supabase Realtime subscription to `profiles` table (online status)
    - _Requirements: 1.3_

  - [x] 9.2 Add `StreakWarning` component that computes elapsed time since `last_activity_at` and renders a banner when > 20 hours
    - _Requirements: 1.4_

  - [ ]* 9.3 Write property test for streak warning
    - **Property 10: Streak Warning Threshold** — banner appears if and only if elapsed time > 20 hours
    - **Validates: Requirements 1.4**

  - [x] 9.4 Add `AIInsightsStream` component that renders AI insights token-by-token using the streaming generator, replacing the current batch fetch
    - _Requirements: 1.5_

  - [x] 9.5 Add `LeaderboardWidget` component to the dashboard showing top 5 students with real-time XP updates via `realtimeService.subscribeToLeaderboard`
    - _Requirements: 1.2, 7.2_

- [x] 10. Upgrade the Exam Arena with adaptive quiz and timer
  - [x] 10.1 Refactor `ExamArena` component to use `adaptiveQuizEngine.generateQuiz` and `processAnswer` for difficulty adaptation
    - Display current difficulty level with a `DifficultyBadge` component
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 10.2 Add `TimerBar` component with configurable countdown (default 60s) that auto-submits the current answer as incorrect on expiry
    - Pause timer when `document.visibilityState === 'hidden'`
    - _Requirements: 4.6_

  - [x] 10.3 Add `ResultsScreen` component showing score, time taken, per-question breakdown, XP earned, and AI-generated improvement tips (streamed from Gemini)
    - Call `gamificationService.awardXP` and `gamificationService.checkMilestones` on quiz completion
    - Display full-screen achievement animation when a milestone is reached
    - _Requirements: 4.4, 4.5, 7.3_

- [x] 11. Upgrade the Doubt Solver with OCR confidence and history
  - [x] 11.1 Add Tesseract.js confidence check: if confidence < 60, show retake prompt instead of proceeding to solution
    - _Requirements: 3.1, 3.4_

  - [ ]* 11.2 Write property test for OCR confidence threshold
    - **Property 16: OCR Confidence Threshold** — confidence < 60 always triggers error state, never proceeds to solution
    - **Validates: Requirements 3.4**

  - [x] 11.3 After solution generation, save question + solution to `doubt_history` table in Supabase (or enqueue in SyncQueue if offline)
    - Add a "Doubt History" tab to the Doubt Solver showing past questions
    - _Requirements: 3.5_

- [x] 12. Upgrade the Learning Path with node unlocking and offline fallback
  - [x] 12.1 After a quiz completion with score ≥ 70%, call `realtimeService` to update node status in Supabase and unlock successor nodes
    - _Requirements: 5.2_

  - [ ]* 12.2 Write property test for learning node unlock
    - **Property 12: Learning Node Unlock** — score ≥ 70 unlocks all direct successors, score < 70 leaves them locked
    - **Validates: Requirements 5.2**

  - [x] 12.3 Implement offline fallback: when `navigator.onLine` is false, load the most recently cached learning path from localStorage
    - _Requirements: 5.5_

- [ ] 13. Checkpoint — Ensure all component tests pass, ask the user if questions arise.

- [x] 14. Build the Teacher Dashboard with live monitoring
  - [x] 14.1 Implement live student list in `TeacherDashboard` using `realtimeService.subscribeToClassroom`, showing current activity and At-Risk flags
    - _Requirements: 6.1, 6.2_

  - [x] 14.2 Implement student detail panel showing full quiz history, weak areas, and AI-generated intervention recommendations (streamed from Gemini)
    - _Requirements: 6.3_

  - [x] 14.3 Implement `ClassAnalytics` component computing average score per topic and engagement rate from `quiz_results` table
    - _Requirements: 6.4_

  - [x] 14.4 Implement `BroadcastPanel` allowing teacher to send a message to all active students via `realtimeService.broadcastToClass`
    - Students receive the broadcast as a toast notification via their Supabase Realtime subscription
    - _Requirements: 6.5_

- [x] 15. Build the full Leaderboard page
  - [x] 15.1 Implement `Leaderboard` component showing top 20 students with rank, name, XP, streak, and real-time updates
    - Show the current student's rank, XP to next rank, and percentile using `gamificationService.getRanking`
    - _Requirements: 7.2, 7.5_

  - [x] 15.2 Add `AppView.LEADERBOARD` to the router and Sidebar navigation
    - _Requirements: 7.2_

- [x] 16. Implement PWA and offline infrastructure
  - [x] 16.1 Install and configure `vite-plugin-pwa` to generate `manifest.json` and a service worker that caches static assets and visited pages
    - _Requirements: 8.1, 8.2_

  - [x] 16.2 Add `OfflineBanner` component that listens to `window.online`/`offline` events and displays a persistent banner when offline, triggering WebLLM mode
    - On reconnect, call `syncQueue.flush()` to sync pending operations to Supabase
    - _Requirements: 8.3, 8.4_

  - [x] 16.3 Implement localStorage caching in `ConceptCoach` (last 20 messages), `LearningPath` (current path), and `ExamArena` (last 5 results)
    - _Requirements: 8.5_

- [x] 17. Implement authentication improvements and route guarding
  - [x] 17.1 Add a `ProtectedRoute` wrapper component that checks Supabase session and redirects to `AuthPage?redirect=<path>` if unauthenticated
    - _Requirements: 10.4, 10.5_

  - [ ]* 17.2 Write property test for route guard
    - **Property 15: Protected Route Guard** — any protected route without a valid session always redirects to AuthPage
    - **Validates: Requirements 10.5**

  - [x] 17.3 Add profile update functionality: name and avatar changes persist to Supabase `profiles` table and update local state within 1 second
    - _Requirements: 10.3_

- [x] 18. Add multi-language UI support
  - [x] 18.1 Apply `i18nService.getLabel` to all static UI strings in Sidebar, Dashboard, and navigation components for English/Hindi switching
    - Add a language toggle to the Sidebar
    - _Requirements: 9.1_

  - [x] 18.2 Apply `i18nService.getTextDirection` to all AI response containers, setting the `dir` attribute dynamically based on selected language
    - _Requirements: 9.3_

  - [x] 18.3 Add ARIA labels to all interactive elements: chat messages (`role="log"`), quiz options (`role="radio"`), navigation items (`aria-label`), and modal dialogs (`role="dialog"`)
    - _Requirements: 9.5_

- [x] 19. Final checkpoint — Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout development
- Property tests use fast-check with minimum 100 iterations each
- Unit tests use Vitest + React Testing Library
- All property tests must include the comment: `// Feature: edufree-ai-advanced, Property N: <text>`
