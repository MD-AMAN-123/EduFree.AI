import * as webllm from "@mlc-ai/web-llm";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export class OfflineAIService {
  private engine: webllm.MLCEngineInterface | null = null;
  private modelId = import.meta.env.VITE_OFFLINE_MODEL || "gemma-2b-it-q4f16_1-MLC";
  private isLoaded = false;
  private onProgressCallback?: (progress: number) => void;

  constructor() { }

  setOnProgress(callback: (progress: number) => void) {
    this.onProgressCallback = callback;
  }

  async isWebGPUSupported(): Promise<boolean> {
    const nav = navigator as any;
    if (!nav.gpu) return false;
    try {
      const adapter = await nav.gpu.requestAdapter();
      return !!adapter;
    } catch {
      return false;
    }
  }

  async init() {
    if (this.isLoaded) return;

    const isSupported = await this.isWebGPUSupported();
    if (!isSupported) {
      throw new Error("WEBGPU_NOT_SUPPORTED");
    }

    try {
      this.engine = await webllm.CreateMLCEngine(this.modelId, {
        initProgressCallback: (report) => {
          if (this.onProgressCallback) {
            const progress = report.progress;
            this.onProgressCallback(Math.round(progress * 100));
          }
        },
      });
      this.isLoaded = true;
    } catch (error) {
      console.error("Failed to initialize Web-LLM:", error);
      throw error;
    }
  }

  async generateResponse(messages: ChatMessage[]): Promise<string> {
    if (!this.engine) {
      await this.init();
    }

    try {
      const reply = await this.engine!.chat.completions.create({
        messages: messages as any,
      });
      return reply.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
    } catch (error) {
      console.error("Offline AI generation error:", error);
      return "Offline AI error. Please check your connection or device storage.";
    }
  }

  async *generateResponseStream(messages: ChatMessage[]): AsyncGenerator<string> {
    if (!this.engine) {
      await this.init();
    }

    try {
      const completion = await this.engine!.chat.completions.create({
        messages: messages as any,
        stream: true,
      });

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error("Offline AI streaming error:", error);
      yield "Offline AI service encountered an error. Please refresh or check your WebGPU support.";
    }
  }

  async isModelCached(): Promise<boolean> {
    return this.isLoaded;
  }
}

export const offlineAIService = new OfflineAIService();
