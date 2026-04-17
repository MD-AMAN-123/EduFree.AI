import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Check, X, AlertTriangle, BookOpen } from 'lucide-react';
import { DifficultyLevel, QuizQuestion, QuizResult } from '../types';
import { generateQuiz, processAnswer, completeQuiz } from '../services/adaptiveQuizEngine';
import { awardXP } from '../services/gamificationService';
import DifficultyBadge from './DifficultyBadge';
import TimerBar from './TimerBar';
import ResultsScreen from './ResultsScreen';

const CACHE_KEY_RESULTS = 'edufree_quiz_results';

interface ExamArenaProps {
  initialTopic?: string;
  onClearTopic?: () => void;
  studentId?: string;
}

const QUESTION_TIMER = 60; // seconds per question

const ExamArena: React.FC<ExamArenaProps> = ({ initialTopic, onClearTopic, studentId }) => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Beginner');
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timerKey, setTimerKey] = useState(0);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (initialTopic && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      setTopic(initialTopic);
      startQuiz(initialTopic);
      if (onClearTopic) onClearTopic();
    }
  }, [initialTopic]);

  const startQuiz = async (topicStr: string) => {
    setLoading(true);
    setResult(null);
    setCurrentIdx(0);
    setSelectedOption(null);
    setAnswered(false);
    setError(null);

    try {
      const { sessionId: sid, questions: qs } = await generateQuiz(topicStr, difficulty);
      setSessionId(sid);
      setQuestions(qs);
      setTimerKey(k => k + 1);
    } catch {
      setError('Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (optIdx: number) => {
    if (answered || !sessionId) return;
    setSelectedOption(optIdx);
    setAnswered(true);

    const update = processAnswer(sessionId, currentIdx, optIdx);
    setDifficulty(update.newDifficulty);
  };

  const handleTimerExpire = () => {
    if (!answered && sessionId) {
      // Auto-submit as wrong (index -1 won't match any correct answer)
      processAnswer(sessionId, currentIdx, -1);
      setAnswered(true);
      setSelectedOption(null);
    }
  };

  const handleNext = async () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelectedOption(null);
      setAnswered(false);
      setTimerKey(k => k + 1);
    } else {
      // Quiz complete
      if (sessionId) {
        const quizResult = await completeQuiz(sessionId, studentId);
        setResult(quizResult);

        // Cache last 5 results
        try {
          const cached = JSON.parse(localStorage.getItem(CACHE_KEY_RESULTS) ?? '[]');
          cached.push({ ...quizResult, timestamp: Date.now() });
          localStorage.setItem(CACHE_KEY_RESULTS, JSON.stringify(cached.slice(-5)));
        } catch {}

        if (studentId) {
          await awardXP(studentId, 'quiz_complete', {
            correctAnswers: Math.round((quizResult.score / 100) * quizResult.totalQuestions),
          });
        }
      }
    }
  };

  const currentQuestion = questions[currentIdx];
  const isLastQuestion = currentIdx === questions.length - 1;

  if (result) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <ResultsScreen result={result} onRestart={() => { setResult(null); setQuestions([]); setSessionId(null); }} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border dark:border-slate-700 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
          <BookOpen className="text-indigo-600" /> Adaptive Exam Arena
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Difficulty adjusts in real-time based on your performance.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && topic && startQuiz(topic)}
            placeholder="Enter topic (e.g. Organic Chemistry, Indian History)..."
            className="flex-1 bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          />
          <div className="flex items-center gap-3">
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
              className="border dark:border-slate-700 rounded-xl px-3 py-3 bg-slate-50 dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
            <button
              onClick={() => topic && startQuiz(topic)}
              disabled={loading || !topic}
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Start'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 text-red-600 p-4 rounded-2xl flex items-center gap-3">
          <AlertTriangle size={20} />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-3xl border dark:border-slate-700">
          <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
          <p className="font-bold text-slate-700 dark:text-slate-200">Generating adaptive quiz for "{topic}"...</p>
        </div>
      )}

      {/* Active Quiz */}
      {!loading && currentQuestion && (
        <div className="space-y-4">
          {/* Progress + Difficulty */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
              Question {currentIdx + 1} / {questions.length}
            </span>
            <DifficultyBadge level={difficulty} />
          </div>

          {/* Timer */}
          <TimerBar
            key={timerKey}
            durationSeconds={QUESTION_TIMER}
            onExpire={handleTimerExpire}
            paused={answered}
          />

          {/* Question Card */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">
              {currentQuestion.question}
            </h3>

            <div className="space-y-3" role="radiogroup" aria-label="Answer options">
              {currentQuestion.options.map((opt, oIdx) => {
                const isSelected = selectedOption === oIdx;
                const isCorrect = oIdx === currentQuestion.correctAnswerIndex;
                let cls = 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer';

                if (answered) {
                  if (isCorrect) cls = 'border-green-400 bg-green-50 dark:bg-green-900/20 cursor-default';
                  else if (isSelected) cls = 'border-red-400 bg-red-50 dark:bg-red-900/20 cursor-default';
                  else cls = 'border-slate-200 dark:border-slate-700 opacity-50 cursor-default';
                } else if (isSelected) {
                  cls = 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20';
                }

                return (
                  <div
                    key={oIdx}
                    onClick={() => handleOptionSelect(oIdx)}
                    className={`p-4 rounded-xl border-2 flex items-center justify-between transition-all ${cls}`}
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={opt}
                  >
                    <span className="text-slate-700 dark:text-slate-200 font-medium">{opt}</span>
                    {answered && isCorrect && <Check size={18} className="text-green-600 flex-shrink-0" />}
                    {answered && isSelected && !isCorrect && <X size={18} className="text-red-600 flex-shrink-0" />}
                  </div>
                );
              })}
            </div>

            {answered && currentQuestion.explanation && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl text-sm text-blue-800 dark:text-blue-300">
                <strong>💡 Explanation:</strong> {currentQuestion.explanation}
              </div>
            )}
          </div>

          {answered && (
            <button
              onClick={handleNext}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
            >
              {isLastQuestion ? 'See Results' : 'Next Question →'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ExamArena;
