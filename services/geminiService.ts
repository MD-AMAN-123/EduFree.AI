import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  CoachMode,
  Language,
  QuizQuestion,
  LearningNode,
  StudyBot,
  AIInsight,
  DashboardStats
} from "../types";

/* ===============================
   ENV SETUP
================================ */

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

/* ===============================
   SAFE PARSE
================================ */

function safeParse<T>(text: string | undefined, fallback: T): T {
  try {
    return text ? JSON.parse(text) : fallback;
  } catch {
    return fallback;
  }
}

/* ===============================
   COACH
================================ */

export async function generateCoachResponse(
  history: any[],
  currentMessage: string,
  mode: CoachMode,
  language: Language,
  audioBase64?: string,
  bot?: StudyBot
): Promise<{ text: string }> {

  if (!genAI) return { text: "API Key missing" };

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const res = await model.generateContent(currentMessage);

    return { text: res.response.text() };

  } catch {
    return { text: "Error generating response" };
  }
}

/* ===============================
   QUIZ
================================ */

export async function generateQuiz(
  topic: string,
  difficulty: string
): Promise<QuizQuestion[]> {

  if (!genAI) return [];

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const res = await model.generateContent(`Quiz on ${topic}`);

    return safeParse<QuizQuestion[]>(res.response.text(), []);

  } catch {
    return [];
  }
}

/* ===============================
   LEARNING PATH
================================ */

export async function generateLearningPath(
  subject: string
): Promise<LearningNode[]> {

  if (!genAI) return [];

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const res = await model.generateContent(`Path for ${subject}`);

    return safeParse<LearningNode[]>(res.response.text(), []);

  } catch {
    return [];
  }
}

/* ===============================
   DASHBOARD
================================ */

export async function generateDashboardInsights(
  userName: string,
  stats: DashboardStats
): Promise<AIInsight[]> {

  if (!genAI) return [];

  return [];
}

/* ===============================
   VISUAL AID
================================ */

export async function generateVisualAid(topic: string): Promise<string> {
  if (!genAI) return "API key missing";

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const res = await model.generateContent(`Explain ${topic}`);
    return res.response.text();
  } catch {
    return "Error";
  }
}

/* ===============================
   ORIGINALITY
================================ */

export const checkOriginality = async (text: string) => {
  return text.length > 10;
};

/* ===============================
   UTIL
================================ */

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () =>
      resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}