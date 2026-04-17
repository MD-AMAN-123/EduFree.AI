import { generateQuiz as geminiGenerateQuiz } from './geminiService';
import { supabase } from './supabaseClient';
import {
  DifficultyLevel,
  DifficultyUpdate,
  QuizQuestion,
  QuizResult,
  QuizSession,
} from '../types';
import { XP_PER_CORRECT_ANSWER } from './gamificationService';

// ── Difficulty ladder ────────────────────────────────────────
const DIFFICULTY_ORDER: DifficultyLevel[] = ['Beginner', 'Intermediate', 'Advanced'];

export function stepUp(d: DifficultyLevel): DifficultyLevel {
  const idx = DIFFICULTY_ORDER.indexOf(d);
  return DIFFICULTY_ORDER[Math.min(idx + 1, DIFFICULTY_ORDER.length - 1)];
}

export function stepDown(d: DifficultyLevel): DifficultyLevel {
  const idx = DIFFICULTY_ORDER.indexOf(d);
  return DIFFICULTY_ORDER[Math.max(idx - 1, 0)];
}

// ── In-memory session store ──────────────────────────────────
const sessions = new Map<string, QuizSession>();

// ── generateQuiz ─────────────────────────────────────────────
export async function generateQuiz(
  topic: string,
  difficulty: DifficultyLevel,
  count = 5
): Promise<{ sessionId: string; questions: QuizQuestion[] }> {
  const questions = await geminiGenerateQuiz(topic, difficulty);
  const limited = questions.slice(0, Math.max(5, Math.min(count, 10)));

  const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const session: QuizSession = {
    id: sessionId,
    topic,
    difficulty,
    questions: limited,
    answers: new Array(limited.length).fill(null),
    startTime: Date.now(),
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
  };
  sessions.set(sessionId, session);

  return { sessionId, questions: limited };
}

// ── processAnswer ────────────────────────────────────────────
/**
 * Records an answer and returns the updated difficulty state.
 * Pure logic — does NOT persist to Supabase (completeQuiz does that).
 */
export function processAnswer(
  sessionId: string,
  questionIndex: number,
  selectedIndex: number
): DifficultyUpdate {
  const session = sessions.get(sessionId);
  if (!session) {
    return { newDifficulty: 'Beginner', consecutiveCorrect: 0, consecutiveIncorrect: 0 };
  }

  const question = session.questions[questionIndex];
  const isCorrect = question?.correctAnswerIndex === selectedIndex;

  session.answers[questionIndex] = selectedIndex;

  if (isCorrect) {
    session.consecutiveCorrect += 1;
    session.consecutiveIncorrect = 0;
  } else {
    session.consecutiveIncorrect += 1;
    session.consecutiveCorrect = 0;
  }

  let newDifficulty = session.difficulty;
  let weakAreaFlagged: string | undefined;

  if (session.consecutiveCorrect >= 3) {
    newDifficulty = stepUp(session.difficulty);
    session.difficulty = newDifficulty;
    session.consecutiveCorrect = 0;
  } else if (session.consecutiveIncorrect >= 2) {
    newDifficulty = stepDown(session.difficulty);
    session.difficulty = newDifficulty;
    session.consecutiveIncorrect = 0;
    weakAreaFlagged = session.topic;
  }

  return {
    newDifficulty,
    consecutiveCorrect: session.consecutiveCorrect,
    consecutiveIncorrect: session.consecutiveIncorrect,
    weakAreaFlagged,
  };
}

// ── completeQuiz ─────────────────────────────────────────────
export async function completeQuiz(
  sessionId: string,
  studentId?: string
): Promise<QuizResult> {
  const session = sessions.get(sessionId);
  if (!session) {
    return { score: 0, totalQuestions: 0, timeTaken: 0, xpEarned: 0, weakAreas: [], newDifficulty: 'Beginner' };
  }

  const timeTaken = Math.round((Date.now() - session.startTime) / 1000);
  const total = session.questions.length;

  let correct = 0;
  const weakAreas: string[] = [];

  session.questions.forEach((q, idx) => {
    const answered = session.answers[idx];
    if (answered !== null && answered === q.correctAnswerIndex) {
      correct++;
    } else {
      // Flag the topic as a weak area on wrong answers
      if (!weakAreas.includes(session.topic)) {
        weakAreas.push(session.topic);
      }
    }
  });

  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const xpEarned = correct * XP_PER_CORRECT_ANSWER;

  const result: QuizResult = {
    score,
    totalQuestions: total,
    timeTaken,
    xpEarned,
    weakAreas,
    newDifficulty: session.difficulty,
  };

  // Persist to Supabase if we have a student
  if (studentId) {
    await supabase.from('quiz_results').insert({
      student_id: studentId,
      topic: session.topic,
      score,
      total_questions: total,
      time_taken_seconds: timeTaken,
      difficulty: session.difficulty,
      weak_areas: weakAreas,
      xp_earned: xpEarned,
    });
  }

  sessions.delete(sessionId);
  return result;
}

// ── getSession (for UI access) ───────────────────────────────
export function getSession(sessionId: string): QuizSession | undefined {
  return sessions.get(sessionId);
}
