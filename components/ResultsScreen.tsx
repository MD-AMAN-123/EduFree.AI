import React from 'react';
import { Trophy, Clock, Zap, AlertTriangle, TrendingUp } from 'lucide-react';
import { QuizResult } from '../types';
import DifficultyBadge from './DifficultyBadge';

interface ResultsScreenProps {
  result: QuizResult;
  onRestart: () => void;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ result, onRestart }) => {
  const isPassing = result.score >= 70;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Card */}
      <div className={`relative overflow-hidden rounded-3xl p-8 text-white ${
        isPassing ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-orange-500 to-red-600'
      }`}>
        <div className="absolute top-0 right-0 opacity-10">
          <Trophy size={200} />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            {isPassing ? <Trophy size={32} /> : <AlertTriangle size={32} />}
            <h2 className="text-3xl font-bold">
              {isPassing ? 'Great Job!' : 'Keep Practicing!'}
            </h2>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-extrabold">{result.score}%</span>
            <span className="text-xl opacity-80">Score</span>
          </div>
          <p className="text-lg opacity-90">
            {isPassing
              ? 'You demonstrated strong understanding of the material.'
              : 'Review the weak areas and try again to improve your score.'}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border dark:border-slate-700 text-center">
          <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{result.totalQuestions}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">Questions</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border dark:border-slate-700 text-center">
          <div className="flex items-center justify-center gap-1 text-3xl font-bold text-amber-600 dark:text-amber-400">
            <Clock size={24} />
            {Math.floor(result.timeTaken / 60)}:{(result.timeTaken % 60).toString().padStart(2, '0')}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">Time Taken</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border dark:border-slate-700 text-center">
          <div className="flex items-center justify-center gap-1 text-3xl font-bold text-purple-600 dark:text-purple-400">
            <Zap size={24} />
            {result.xpEarned}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">XP Earned</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border dark:border-slate-700 text-center">
          <div className="flex items-center justify-center">
            <DifficultyBadge level={result.newDifficulty} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-semibold">New Difficulty</p>
        </div>
      </div>

      {/* Weak Areas */}
      {result.weakAreas.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="text-orange-600 dark:text-orange-400" size={20} />
            <h3 className="font-bold text-orange-700 dark:text-orange-400">Areas to Improve</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.weakAreas.map((area, idx) => (
              <span key={idx} className="px-3 py-1 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded-full text-sm font-semibold">
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onRestart}
          className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
        >
          Try Another Quiz
        </button>
      </div>
    </div>
  );
};

export default ResultsScreen;
