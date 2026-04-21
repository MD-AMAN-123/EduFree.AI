import * as webllm from "@mlc-ai/web-llm";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export class OfflineAIService {
  private engine: webllm.MLCEngineInterface | null = null;
  private modelId = import.meta.env.VITE_OFFLINE_MODEL || "gemma-2b-it-q4f16_1-MLC";
  private isLoaded = false;
  private isInitializing = false;
  private onProgressCallback?: (progress: number) => void;

  constructor() { }

  setOnProgress(callback: (progress: number) => void) {
    this.onProgressCallback = callback;
  }

  async isWebGPUSupported(): Promise<{ supported: boolean; reason?: string }> {
    const nav = navigator as any;
    if (!nav.gpu) return { supported: false, reason: "Your browser does not support WebGPU. Try using the latest version of Chrome or Edge." };
    try {
      const adapter = await nav.gpu.requestAdapter();
      if (!adapter) return { supported: false, reason: "WebGPU is supported but no compatible graphics adapter was found." };
      return { supported: true };
    } catch (e: any) {
      return { supported: false, reason: `WebGPU initialization failed: ${e.message}` };
    }
  }

  async init() {
    if (this.isLoaded || this.isInitializing) return;
    this.isInitializing = true;

    const gpuStatus = await this.isWebGPUSupported();
    if (!gpuStatus.supported) {
      this.isInitializing = false;
      throw new Error(gpuStatus.reason || "WEBGPU_NOT_SUPPORTED");
    }

    try {
      console.log("Starting Web-LLM engine with model:", this.modelId);
      this.engine = await webllm.CreateMLCEngine(this.modelId, {
        initProgressCallback: (report) => {
          if (this.onProgressCallback) {
            const progress = report.progress;
            this.onProgressCallback(Math.round(progress * 100));
          }
        },
      });
      this.isLoaded = true;
      this.isInitializing = false;
    } catch (error) {
      this.isInitializing = false;
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
    } catch (error: any) {
      console.error("CRITICAL: Offline AI streaming error:", error);
      const msg = error?.message || "";
      if (msg.includes("out of memory")) yield "Offline AI ran out of memory. Try closing other tabs.";
      else if (msg.includes("device lost")) yield "Graphics device lost connection. Please refresh the page.";
      else yield `Offline AI error: ${msg || "Unknown error"}. Please check your browser's WebGPU support.`;
    }
  }

  async isModelCached(): Promise<boolean> {
    // If it's already loaded in memory, it's definitely cached
    if (this.isLoaded) return true;
    
    // We can check if the model exists in the MLC cache via IndexedDB
    // For now, we'll return the in-memory status primarily, 
    // but in a production app we'd check the storage.
    return this.isLoaded;
  }
}

export const offlineAIService = new OfflineAIService();
