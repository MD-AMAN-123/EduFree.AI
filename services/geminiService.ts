import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import {
  CoachMode,
  Language,
  QuizQuestion,
  LearningNode,
  StudyBot,
  AIInsight,
  DashboardStats,
  ChatMessage,
  TeacherInsight
} from "../types";

/* Build Trigger: 2026-04-16T22:50:00 */
/* ===============================
   ENV SETUP
 ================================ */

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Import offline service for transparent fallback
import { offlineAIService } from "./offlineAiService";

const DEFAULT_MODEL = import.meta.env.VITE_AI_MODEL || "gemma-4-31b-it"; 
const FALLBACK_MODEL = "gemini-1.5-flash"; 
const PRO_MODEL = "gemma-4-31b-it"; 
const VISION_MODEL = "gemini-1.5-pro"; 

/* ===============================
   PROMPTS & SYSTEM INSTRUCTIONS
 ================================ */

const COACH_SYSTEM_INSTRUCTION = (mode: CoachMode, language: Language, bot?: StudyBot) => `
You are ${bot?.name || "EduFree AI Coach"}, a brilliant, empathetic, and world-class learning assistant for the EduFree.AI platform. 
Your mission is to make learning frictionless, engaging, and deeply meaningful.

Subject Expertise: ${bot?.subject || "General Education, Science, Math, and Humanities"}.
Personality: ${bot?.personality || "Encouraging, expert, witty, and deeply patient"}.

Pedagogical Framework:
- If mode is 'LEARNING' (Socratic Method):
  1. Never give the answer directly.
  2. Start by acknowledging the student's current progress.
  3. Ask 1-2 probing questions that challenge their assumptions or guide their logic.
  4. Use analogies to explain complex concepts.
  5. Include a "💡 Pro Tip" or "🤔 Think About It" sidebar in your response.

- If mode is 'ANSWER' (Direct Resolution):
  1. Provide a comprehensive, structured response.
  2. Use clear headings (e.g., ### Concept Overview, ### Detailed Breakdown).
  3. Use bullet points for steps or key facts.
  4. End with a "🎯 Key Takeaway" summary.
  5. Suggest a related topic the student might like next.

Visual Reasoning (Vision Tasks):
- If the user sends an image, describe the identified text/concepts first.
- Break down physical diagrams or math formulas with precision.

Communication Tone:
- Professional yet warm.
- Response should be entirely in ${language}.
- Use rich Markdown formatting (bold, italics, blocks) for a premium experience.
`;

const QUIZ_PROMPT = (topic: string, difficulty: string) => `
Generate a quiz with 5-10 questions about "${topic}" at ${difficulty} level.
Return ONLY a valid JSON array of objects following this TypeScript interface:
interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number; 
  explanation: string;
}
Ensure the explanation is helpful and educational.
Return ONLY the JSON. No markdown code blocks, no preamble.
`;

const LEARNING_PATH_PROMPT = (subject: string) => `
Create a structured learning path for "${subject}".
Return ONLY a valid JSON array of objects following this TypeScript interface:
interface LearningNode {
  id: string;
  title: string;
  description: string;
  status: 'LOCKED' | 'UNLOCKED' | 'IN_PROGRESS' | 'MASTERED';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  rationale: string;
}
Start the first 1-2 nodes as UNLOCKED.
Return ONLY the JSON. No markdown code blocks, no preamble.
`;

const DASHBOARD_INSIGHTS_PROMPT = (userName: string, stats: DashboardStats) => `
Analyze the following student performance data for ${userName}:
- Topics Mastered: ${stats.topicsMastered}
- Avg Score: ${stats.avgScore}%
- Study Hours: ${stats.studyHours}
- Current Streak: ${stats.streak}
- Weak Areas: ${stats.weakAreas}

Return exactly 3 actionable insights in a valid JSON array:
interface AIInsight {
  title: string;
  description: string;
  type: 'success' | 'warning' | 'info';
}
Be encouraging but honest.
Return ONLY the JSON. No codes blocks.
`;

/* ===============================
   SAFE PARSE
 ================================ */

function safeParse<T>(text: string | undefined, fallback: T): T {
  if (!text) return fallback;
  try {
    // Gemini sometimes wraps JSON in markdown code blocks
    const cleanJson = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("JSON Parse Error:", error, "Raw Text:", text);
    return fallback;
  }
}

/* ===============================
   COACH
 ================================ */

export async function generateCoachResponse(
  history: ChatMessage[],
  currentMessage: string,
  mode: CoachMode,
  language: Language,
  audioBase64?: string,
  bot?: StudyBot
): Promise<{ text: string }> {

  if (!genAI) return { text: "AI Service is currently unavailable. Please check your API configuration." };

  const filteredHistory = history.filter((msg, idx) => {
    if (idx === 0 && msg.role === 'model') return false;
    return true;
  });

  const chatHistory = filteredHistory.map(msg => ({
    role: msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.text }]
  }));

  const parts: (string | Part)[] = [currentMessage];
  if (audioBase64) {
    parts.push({
      inlineData: {
        data: audioBase64,
        mimeType: "audio/wav"
      }
    });
  }

  try {
    const model = genAI.getGenerativeModel(
      { model: DEFAULT_MODEL, systemInstruction: COACH_SYSTEM_INSTRUCTION(mode, language, bot) },
      { apiVersion: "v1" }
    );
    const result = await model.startChat({ history: chatHistory }).sendMessage(parts);
    return { text: (await result.response).text() };
  } catch (outerError: any) {
    console.warn("V1 model failed, trying beta as fallback...", outerError);
    try {
        const betaModel = genAI.getGenerativeModel({ model: FALLBACK_MODEL });
        const result = await betaModel.startChat({ history: chatHistory }).sendMessage(parts);
        return { text: (await result.response).text() };
    } catch (innerError) {
        console.error("Coach Error:", innerError);
        return { text: "EduFree is still warming up its brain. Please try again in 5 seconds!" };
    }
  }
}

export async function* generateCoachResponseStream(
  history: ChatMessage[],
  currentMessage: string,
  mode: CoachMode,
  language: Language,
  audioBase64?: string,
  bot?: StudyBot
): AsyncGenerator<string> {

  if (!genAI) {
    yield "AI Service is currently unavailable.";
    return;
  }

  const chatHistory = history.filter((msg, idx) => !(idx === 0 && msg.role === 'model')).map(msg => ({
    role: msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.text }]
  }));

  const parts: (string | Part)[] = [currentMessage];
  if (audioBase64) {
    parts.push({ inlineData: { data: audioBase64, mimeType: "audio/wav" } });
  }

  try {
    const model = genAI.getGenerativeModel(
      { model: DEFAULT_MODEL, systemInstruction: COACH_SYSTEM_INSTRUCTION(mode, language, bot) },
      { apiVersion: 'v1' }
    );

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessageStream(parts);

    for await (const chunk of result.stream) {
      yield chunk.text();
    }
  } catch (err: any) {
    console.warn("V1 Streaming failed, trying beta fallback...", err);
    try {
        const fallbackModel = genAI.getGenerativeModel({
          model: FALLBACK_MODEL,
          systemInstruction: COACH_SYSTEM_INSTRUCTION(mode, language, bot)
        });
        const chat = fallbackModel.startChat({ history: chatHistory });
        const result = await chat.sendMessageStream(parts);
        for await (const chunk of result.stream) {
          yield chunk.text();
        }
    } catch (fallbackErr: any) {
        console.warn("All streaming failed, attempting non-streaming v1...");
        try {
            const staticModel = genAI.getGenerativeModel(
              { model: DEFAULT_MODEL, systemInstruction: COACH_SYSTEM_INSTRUCTION(mode, language, bot) },
              { apiVersion: 'v1' }
            );
            const chat = staticModel.startChat({ history: chatHistory });
            const result = await chat.sendMessage(parts);
            yield (await result.response).text();
        } catch (staticErr: any) {
            console.error("Critical AI Failure:", staticErr);
            if (!navigator.onLine) {
                yield "It looks like you're offline. Please check your internet connection or use Offline Mode.";
            } else {
                yield "I encountered another error while thinking. Testing your API key connectivity. Please verify your VITE_GEMINI_API_KEY in .env.local.";
            }
        }
    }
  }
}

export async function generateQuiz(topic: string, difficulty: string): Promise<QuizQuestion[]> {
  if (!genAI) return [];
  try {
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL }, { apiVersion: 'v1' });
    let res;
    try {
        res = await model.generateContent(QUIZ_PROMPT(topic, difficulty));
    } catch (err) {
        const fbModel = genAI.getGenerativeModel({ model: FALLBACK_MODEL });
        res = await fbModel.generateContent(QUIZ_PROMPT(topic, difficulty));
    }
    const questions = safeParse<QuizQuestion[]>(res.response.text(), []);
    return questions.length > 0 ? questions : [{ id: 1, question: `Could not reach AI for ${topic}. Try again or check connection.`, options: ["N/A"], correctAnswerIndex: 0, explanation: "Retry logic active." }];
  } catch (error) {
    console.error("Quiz Error:", error);
    return [];
  }
}

export async function generateLearningPath(subject: string): Promise<LearningNode[]> {
  if (!genAI || !navigator.onLine) return generateOfflineLearningPath(subject);
  try {
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL }, { apiVersion: 'v1' });
    const res = await model.generateContent(LEARNING_PATH_PROMPT(subject));
    const path = safeParse<LearningNode[]>(res.response.text(), []);
    return path.length > 0 ? path : generateOfflineLearningPath(subject);
  } catch (error) {
    console.error("Path Error:", error);
    return generateOfflineLearningPath(subject);
  }
}

function generateOfflineLearningPath(subject: string): LearningNode[] {
  return [
    { id: '1', title: `Introduction to ${subject}`, description: 'Fundamentals and core principles.', status: 'UNLOCKED', difficulty: 'Beginner', rationale: 'Essential first step.' },
    { id: '2', title: 'Advanced Concepts', description: 'Deep dive into complex topics.', status: 'LOCKED', difficulty: 'Intermediate', rationale: 'Building on basics.' },
    { id: '3', title: 'Mastery & Beyond', description: 'Final project and application.', status: 'LOCKED', difficulty: 'Advanced', rationale: 'Final evaluation.' },
  ];
}

export async function generateDashboardInsights(userName: string, stats: DashboardStats): Promise<AIInsight[]> {
  if (!genAI) return [];
  try {
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL }, { apiVersion: 'v1' });
    const res = await model.generateContent(DASHBOARD_INSIGHTS_PROMPT(userName, stats));
    return safeParse<AIInsight[]>(res.response.text(), [{ title: "Continue Learning", description: "Stay consistent!", type: "success" }]);
  } catch (error) {
    console.error("Insight Error:", error);
    return [];
  }
}

export async function generateTeacherInsights(classDataJson: string): Promise<TeacherInsight[]> {
  if (!genAI) return [];
  try {
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL }, { apiVersion: 'v1' });
    const res = await model.generateContent(`Analyze class performance data: ${classDataJson}. Return JSON array of insights.`);
    return safeParse<TeacherInsight[]>(res.response.text(), []);
  } catch (error) {
    console.error("Teacher Insight Error:", error);
    return [];
  }
}

export async function solveQuestionFromImage(imageData: string): Promise<{ topic: string, answer: string, steps: string[] }> {
  if (!genAI) throw new Error("AI Service Unavailable");
  try {
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL }, { apiVersion: 'v1' });
    const prompt = `Identify the question in this image. Provide JSON: {topic, answer, steps}`;
    const result = await model.generateContent([prompt, { inlineData: { data: imageData, mimeType: "image/jpeg" } }]);
    return safeParse(result.response.text(), { topic: "General", answer: "Check image clarity", steps: ["Retry..."] });
  } catch (error) {
    console.error("Vision Error:", error);
    throw error;
  }
}

export async function generateSupportResponse(history: any[], currentMessage: string): Promise<string> {
  if (!genAI) return "Support offline.";
  try {
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL }, { apiVersion: 'v1' });
    const res = await model.generateContent(currentMessage);
    return res.response.text();
  } catch (error) {
    return "I'm having trouble helping right now.";
  }
}

export async function* generateSupportResponseStream(history: any[], currentMessage: string): AsyncGenerator<string> {
  if (!genAI) { yield "Support offline."; return; }
  try {
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL }, { apiVersion: 'v1' });
    const chat = model.startChat({ history: [] });
    const result = await chat.sendMessageStream(currentMessage);
    for await (const chunk of result.stream) { yield chunk.text(); }
  } catch (err) { yield "Error answering..."; }
}

export async function generateVisualAid(topic: string): Promise<string> {
  if (!genAI) return "Visual service offline.";
  try {
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL }, { apiVersion: 'v1' });
    const res = await model.generateContent(`Explain ${topic} visually with markdown.`);
    return res.response.text();
  } catch (error) { return "Visual aid error."; }
}

export const checkOriginality = async (text: string): Promise<{ score: number, analysis: string }> => {
  if (!genAI) return { score: 100, analysis: "Local check only." };
  try {
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL }, { apiVersion: 'v1' });
    const res = await model.generateContent(`Analyze for AI: ${text}. Return JSON: {score, analysis}`);
    return safeParse(res.response.text(), { score: 70, analysis: "Likely original." });
  } catch (error) { return { score: 50, analysis: "Check failed." }; }
};

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}