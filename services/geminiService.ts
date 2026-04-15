import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  CoachMode,
  Language,
  QuizQuestion,
  LearningNode,
  Student,
  StudyBot,
  AIInsight,
  DashboardStats
} from "../types";

/* ===============================
   SAFE ENV
================================ */

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ Gemini API Key Missing");
}

let genAI: GoogleGenerativeAI | null = null;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

/* ===============================
   RETRY WRAPPER
================================ */

async function retry<T>(
  operation: () => Promise<T>,
  retries = 2
): Promise<T> {
  try {
    return await operation();
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise((r) => setTimeout(r, 2000));
    return retry(operation, retries - 1);
  }
}

/* ===============================
   JSON SAFE PARSER
================================ */

function safeParse<T>(text: string | undefined, fallback: T): T {
  if (!text) return fallback;
  try {
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    let cleanText = text;
    if (firstBracket !== -1 && lastBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
      cleanText = text.substring(firstBracket, lastBracket + 1);
    } else if (firstBrace !== -1 && lastBrace !== -1) {
      cleanText = text.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(cleanText) as T;
  } catch {
    console.error("Failed to parse AI response:", text);
    return fallback;
  }
}

/* ===============================
   COACH
================================ */

export async function generateCoachResponse(
  history: { role: string; text: string }[],
  currentMessage: string,
  mode: CoachMode,
  language: Language,
  audioBase64?: string,
  bot?: StudyBot
): Promise<{ text: string }> {

  if (!genAI) {
    return { text: "❌ API Key missing. Configure environment variables." };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{
            text: bot
              ? `You are "${bot.name}", expert in ${bot.subject}. Respond in ${language}.`
              : `You are EduFree AI tutor. Mode: ${mode}, Language: ${language}.`
          }]
        },
        {
          role: "model",
          parts: [{ text: "Ready to help!" }]
        },
        ...history.map(h => ({
          role: h.role === "model" ? "model" : "user",
          parts: [{ text: h.text }]
        }))
      ]
    });

    const parts: any[] = [{ text: currentMessage || "Continue" }];

    if (audioBase64) {
      parts.push({
        inlineData: {
          mimeType: "audio/webm",
          data: audioBase64
        }
      });
    }

    const result = await chat.sendMessage(parts);
    return { text: result.response.text() };

  } catch (err) {
    console.error(err);
    return { text: "❌ AI Error. Please try again." };
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

    const res = await model.generateContent(
      `Generate 5 quiz questions about ${topic} (difficulty: ${difficulty}) in JSON format`
    );

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

    const res = await model.generateContent(
      `Create a learning path for ${subject} in JSON`
    );

    return safeParse<LearningNode[]>(res.response.text(), []);

  } catch {
    return [];
  }
}

/* ===============================
   IMAGE SOLVER
================================ */

export async function solveQuestionFromImage(
  base64Image: string
) {
  if (!genAI) {
    return {
      topic: "Error",
      answer: "API key missing",
      steps: []
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      "Solve step by step in JSON",
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg"
        }
      }
    ]);

    return safeParse(result.response.text(), {
      topic: "Unknown",
      answer: "Error",
      steps: []
    });

  } catch {
    return {
      topic: "Error",
      answer: "Failed",
      steps: []
    };
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

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const res = await model.generateContent(
      `Give insights for ${userName} based on ${JSON.stringify(stats)}`
    );

    return safeParse<AIInsight[]>(res.response.text(), []);

  } catch {
    return [];
  }
}

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

/* ===============================
   ORIGINALITY CHECK (FIXED)
================================ */

export const checkOriginality = async (text: string) => {
  // basic placeholder logic
  return text.length > 20;
};
export async function generateVisualAid(topic: string): Promise<string> {
  if (!topic) return "No topic provided";

  try {
    if (!genAI) return "API Key missing";

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const res = await model.generateContent(`Explain ${topic} clearly with examples`);

    return res.response.text();
  } catch (err) {
    console.error(err);
    return "Failed to generate visual aid";
  }
}