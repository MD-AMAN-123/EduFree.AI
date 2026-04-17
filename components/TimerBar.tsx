import React, { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';

interface TimerBarProps {
  durationSeconds: number;
  onExpire: () => void;
  paused?: boolean;
}

const TimerBar: React.FC<TimerBarProps> = ({ durationSeconds, onExpire, paused = false }) => {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const expiredRef = useRef(false);

  useEffect(() => {
    setTimeLeft(durationSeconds);
    expiredRef.current = false;
  }, [durationSeconds]);

  useEffect(() => {
    if (paused || expiredRef.current) return;

    const tick = setInterval(() => {
      // Pause when tab is hidden
      if (document.visibilityState === 'hidden') return;

      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(tick);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpire();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [paused, onExpire, durationSeconds]);

  const pct = (timeLeft / durationSeconds) * 100;
  const isUrgent = timeLeft <= 10;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-bold">
        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
          <Clock size={12} /> Time
        </span>
        <span className={isUrgent ? 'text-red-500 animate-pulse' : 'text-slate-700 dark:text-slate-200'}>
          {timeLeft}s
        </span>
      </div>
      <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            isUrgent ? 'bg-red-500' : pct > 50 ? 'bg-indigo-500' : 'bg-amber-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default TimerBar;
