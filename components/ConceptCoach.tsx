import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Play, Square, Loader2, Volume2, Globe, Image as ImageIcon, BrainCircuit } from 'lucide-react';
import { CoachMode, ChatMessage, Language } from '../types';
import { generateCoachResponse, generateCoachResponseStream, blobToBase64, generateVisualAid } from '../services/geminiService';
import { getTextDirection } from '../services/i18nService';

const CACHE_KEY_MESSAGES = 'edufree_coach_messages';

interface ConceptCoachProps {
  initialTopic?: string;
  onClearTopic?: () => void;
}

const ConceptCoach: React.FC<ConceptCoachProps> = ({ initialTopic, onClearTopic }) => {
  // Load cached messages on mount
  const loadCachedMessages = (): ChatMessage[] => {
    try {
      const cached = localStorage.getItem(CACHE_KEY_MESSAGES);
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.slice(-20); // Keep last 20
      }
    } catch { }
    return [{
      id: 'welcome',
      role: 'model',
      text: 'Hello! I am EduFree, now powered by Gemma 4. I am here to tutor you with advanced reasoning even without internet. What should we learn today?',
      timestamp: Date.now()
    }];
  };

  const [messages, setMessages] = useState<ChatMessage[]>(loadCachedMessages());
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [mode, setMode] = useState<CoachMode>(CoachMode.LEARNING);
  const [language, setLanguage] = useState<Language>(Language.ENGLISH);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGeneratingImage]);

  // Persist last 20 messages to localStorage
  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem(CACHE_KEY_MESSAGES, JSON.stringify(messages.slice(-20)));
    }
  }, [messages]);

  // Auto-start revision if a topic is passed
  useEffect(() => {
    if (initialTopic && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      const prompt = `I need to revise ${initialTopic}. Please give me a quick summary and ask me a conceptual question to check my understanding.`;
      handleSendMessage(prompt);
      if (onClearTopic) onClearTopic();
    }
  }, [initialTopic, onClearTopic]);

  const [modelLoadingProgress, setModelLoadingProgress] = useState(0);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [engineStatus, setEngineStatus] = useState<'IDLE' | 'LOADING' | 'READY'>('IDLE');

  useEffect(() => {
    const checkStatus = async () => {
      const { offlineAIService } = await import('../services/offlineAiService');
      const cached = await offlineAIService.isModelCached();
      if (cached) setEngineStatus('READY');
      else setEngineStatus('IDLE');
    };

    // Check every few seconds or on focus
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDownloadModel = async () => {
    if (engineStatus !== 'IDLE') return;

    try {
      setIsModelLoading(true);
      setEngineStatus('LOADING');
      const { offlineAIService } = await import('../services/offlineAiService');
      offlineAIService.setOnProgress((p) => setModelLoadingProgress(p));
      await offlineAIService.init();
      setEngineStatus('READY');
    } catch (error: any) {
      console.error("Failed to download model:", error);
      alert("Download failed. Please check your internet connection.");
      setEngineStatus('IDLE');
    } finally {
      setIsModelLoading(false);
    }
  };

  const handleSendMessage = async (text: string, audioBase64?: string) => {
    if (!text && !audioBase64) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text || (audioBase64 ? '(Voice Input)' : ''),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);
    setInputText('');

    try {
      let responseText = "";

      // Smart Hybrid Toggle
      if (navigator.onLine) {
        // Create a placeholder message for the AI response
        const aiMsgId = (Date.now() + 1).toString();
        const placeholderMsg: ChatMessage = {
          id: aiMsgId,
          role: 'model',
          text: '',
          timestamp: Date.now()
        };

        setMessages(prev => [...prev, placeholderMsg]);

        const stream = generateCoachResponseStream(
          messages,
          text || "Process this audio",
          mode,
          language,
          audioBase64
        );

        let fullText = "";
        for await (const chunk of stream) {
          fullText += chunk;
          setMessages(prev => prev.map(m =>
            m.id === aiMsgId ? { ...m, text: fullText } : m
          ));
        }
        responseText = fullText;
      } else {
        // ENFORCED OFFLINE MODE
        const { offlineAIService } = await import('../services/offlineAiService');

        try {
          const isSupported = await offlineAIService.isWebGPUSupported();
          if (!isSupported) throw new Error("WEBGPU_NOT_SUPPORTED");

          if (!await offlineAIService.isModelCached() || engineStatus !== 'READY') {
            setIsModelLoading(true);
            setEngineStatus('LOADING');
            offlineAIService.setOnProgress((p) => setModelLoadingProgress(p));
            await offlineAIService.init();
            setIsModelLoading(false);
            setEngineStatus('READY');
          }

          const aiMsgId = (Date.now() + 1).toString();
          setMessages(prev => [...prev, {
            id: aiMsgId,
            role: 'model',
            text: '',
            isAudio: true,
            timestamp: Date.now()
          }]);

          const historyForOffline = messages.map(m => ({
            role: m.role === 'model' ? 'assistant' : 'user' as "assistant" | "user",
            content: m.text
          }));

          const stream = offlineAIService.generateResponseStream([
            { role: 'system', content: `You are an expert tutor. Mode: ${mode}. Language: ${language}` },
            ...historyForOffline,
            { role: 'user', content: text }
          ]);

          let fullText = "";
          for await (const chunk of stream) {
            fullText += chunk;
            setMessages(prev => prev.map(m =>
              m.id === aiMsgId ? { ...m, text: fullText } : m
            ));
          }
          responseText = fullText;
        } catch (offlineErr: any) {
          console.error("Offline Service Error:", offlineErr);
          setIsModelLoading(false);
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            text: offlineErr.message === "WEBGPU_NOT_SUPPORTED"
              ? "Your device doesn't support offline AI. Please connect to the internet."
              : "The offline brain is having trouble waking up. Please refresh the page.",
            timestamp: Date.now()
          }]);
        }
      }

      if (responseText) speakText(responseText);

    } catch (error: any) {
      console.error(error);
      setIsModelLoading(false); // Stop loading on error

      let errorText = "I'm having some trouble connecting to my brain. Please try again in a moment.";
      if (error.message === "WEBGPU_NOT_SUPPORTED") {
        errorText = "Your device doesn't support offline AI (WebGPU missing). Please use Online Mode instead.";
      }

      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: errorText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateVisual = async () => {
    const lastContext = messages[messages.length - 1].text;
    if (!lastContext) return;

    setIsGeneratingImage(true);
    // Add a placeholder message
    const placeholderId = 'generating-image';

    try {
      const imageData = await generateVisualAid(lastContext.substring(0, 100)); // pass simplified topic
      if (imageData) {
        const visualMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'model',
          text: 'Here is a visual aid to help you understand better:',
          imageData: imageData,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, visualMsg]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingImage(false);
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const base64 = await blobToBase64(audioBlob);
        handleSendMessage('', base64);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied", err);
      alert("Microphone access is needed for voice features.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stop all tracks to release mic
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const speakText = (text: string) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Remove markdown symbols for cleaner speech
    const cleanText = text.replace(/[*#_`]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Try to find a good sounding voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Female')) || voices[0];

    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = language === 'English' ? 'en-US' : 'hi-IN'; // Basic language support

    window.speechSynthesis.speak(utterance);
  };

  const playAudio = (base64: string) => {
    // Fallback for direct audio data if ever provided by an API
    const audio = new Audio(`data:audio/wav;base64,${base64}`);
  };

  const getSyncStatus = () => {
    let statusText = engineStatus === 'READY' ? "GEMMA 4 OFFLINE ACTIVE" : "OFFLINE BRAIN MISSING";
    let statusColor = engineStatus === 'READY' ? "bg-green-500" : "bg-slate-400";
    let textColor = engineStatus === 'READY' ? "text-green-600 dark:text-green-400" : "text-slate-500 dark:text-slate-400";
    let bgColor = engineStatus === 'READY' ? "bg-green-50 dark:bg-green-900/20" : "bg-slate-50 dark:bg-slate-900/20";
    let borderColor = engineStatus === 'READY' ? "border-green-100 dark:border-green-800/30" : "border-slate-200 dark:border-slate-800/30";

    if (navigator.onLine && engineStatus === 'IDLE') {
      return (
        <button
          onClick={handleDownloadModel}
          className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 text-white rounded-md text-[11px] font-black border border-indigo-500 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 transform active:scale-95"
        >
          <BrainCircuit className="w-3.5 h-3.5 animate-pulse" />
          ACTIVATE GEMMA 4 OFFLINE
        </button>
      );
    }

    if (engineStatus === 'LOADING' || isModelLoading) {
      statusText = `GEMMA 4 LOADING (${modelLoadingProgress}%)`;
      statusColor = "bg-amber-500";
      textColor = "text-amber-600 dark:text-amber-400";
      bgColor = "bg-amber-50 dark:bg-amber-900/20";
      borderColor = "border-amber-100 dark:border-amber-800/30";
    }

    return (
      <div className={`flex items-center gap-1.5 px-2 py-0.5 ${bgColor} ${textColor} rounded-md text-[10px] font-bold border ${borderColor}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${statusColor} ${engineStatus === 'READY' ? 'animate-pulse' : 'animate-bounce'}`}></div>
        {statusText}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-500" />
            EduFree Offline Tutor
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-slate-500 dark:text-slate-400">Personalized learning in {language}</p>
            {getSyncStatus()}
          </div>
        </div>

        <div className="flex gap-2 text-sm">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="border dark:border-slate-700 rounded-lg px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {Object.values(Language).map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex">
            <button
              onClick={() => setMode(CoachMode.LEARNING)}
              className={`px-3 py-1 rounded-md transition-all ${mode === CoachMode.LEARNING ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Learning
            </button>
            <button
              onClick={() => setMode(CoachMode.ANSWER)}
              className={`px-3 py-1 rounded-md transition-all ${mode === CoachMode.ANSWER ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Answer
            </button>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-label="Chat messages" aria-live="polite">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-slide-in`}>
            <div className={`max-w-[85%] md:max-w-[70%] rounded-[1.5rem] p-5 shadow-lg border-2 ${msg.role === 'user'
              ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none'
              : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-white dark:border-slate-800 rounded-tl-none'
              }`}>
              {msg.text && <p className="leading-relaxed whitespace-pre-wrap font-medium" dir={getTextDirection(language)}>{msg.text}</p>}

              {msg.imageData && (
                <div className="mt-4 rounded-2xl overflow-hidden border-2 border-indigo-100 dark:border-indigo-900/30">
                  <img
                    src={`data:image/png;base64,${msg.imageData}`}
                    alt="Visual Aid"
                    className="w-full h-auto"
                  />
                </div>
              )}
            </div>

            <span className="text-[10px] mt-1 mx-2 font-bold text-slate-400 uppercase tracking-tighter">
              {msg.role === 'user' ? 'Sent by You' : 'EduFree Assistant'}
            </span>
          </div>
        ))}
        {(isModelLoading || isProcessing) && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl rounded-bl-none shadow-md border dark:border-slate-700 flex items-center gap-4 max-w-sm">
              <div className="relative">
                <Loader2 className={`animate-spin text-indigo-500`} size={24} />
                {isModelLoading && (
                  <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold">
                    {modelLoadingProgress}%
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {isModelLoading ? "Downloading AI Brain..." : "EduFree is thinking..."}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {isModelLoading ? `${modelLoadingProgress}% cached on-device` : "On-device neural processing"}
                </span>
                {isModelLoading && modelLoadingProgress === 0 && (
                  <button
                    onClick={() => {
                      setIsModelLoading(false);
                      setIsProcessing(false);
                      alert("Taking too long? Please check your internet or try Online Mode.");
                    }}
                    className="mt-1 text-[8px] text-indigo-500 font-bold uppercase hover:underline text-left"
                  >
                    Click to cancel stay online
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        {isGeneratingImage && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-bl-none shadow-sm border dark:border-slate-700 flex items-center gap-2">
              <Loader2 className="animate-spin text-purple-500" size={18} />
              <span className="text-slate-500 dark:text-slate-400 text-sm">Generating diagram...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t dark:border-slate-800">
        <div className="max-w-4xl mx-auto relative flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
            placeholder={isRecording ? "Listening..." : "Ask a doubt, request a quiz, or simplify a topic..."}
            className="flex-1 border dark:border-slate-700 rounded-full px-5 py-3 pr-12 bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            disabled={isRecording || isProcessing || isGeneratingImage}
          />

          {/* Recording Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`absolute right-14 p-2 rounded-full transition-colors ${isRecording ? 'text-red-500 hover:bg-red-50 animate-pulse' : 'text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
          >
            {isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={20} />}
          </button>

          <button
            onClick={() => handleSendMessage(inputText)}
            disabled={(!inputText.trim() && !isRecording) || isProcessing || isGeneratingImage}
            className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-indigo-200 dark:hover:shadow-none"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-2">
          AI can make mistakes. EduFree works entirely on-device for your privacy and accessibility. Hindi, English & regional nuances supported.
        </p>
      </div>
    </div>
  );
};

export default ConceptCoach;