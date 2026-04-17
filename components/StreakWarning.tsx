import React from 'react';
import { AlertTriangle, Flame } from 'lucide-react';

interface StreakWarningProps {
  lastActivityAt: string | null;
  streak: number;
}

export function isStreakAtRisk(lastActivityAt: string | null): boolean {
  if (!lastActivityAt) return false;
  const elapsed = Date.now() - new Date(lastActivityAt).getTime();
  const hoursElapsed = elapsed / (1000 * 60 * 60);
  return hoursElapsed > 20;
}

const StreakWarning: React.FC<StreakWarningProps> = ({ lastActivityAt, streak }) => {
  if (!isStreakAtRisk(lastActivityAt)) return null;

  return (
    <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700/40 rounded-2xl animate-pulse-slow">
      <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-xl">
        <AlertTriangle className="w-5 h-5 text-orange-500" />
      </div>
      <div className="flex-1">
        <p className="font-bold text-orange-700 dark:text-orange-400 text-sm">
          🔥 Your {streak}-day streak is at risk!
        </p>
        <p className="text-xs text-orange-600 dark:text-orange-500 mt-0.5">
          Study something today to keep your streak alive.
        </p>
      </div>
      <Flame className="w-6 h-6 text-orange-400 animate-bounce" />
    </div>
  );
};

export default StreakWarning;
