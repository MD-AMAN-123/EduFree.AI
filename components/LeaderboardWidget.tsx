import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { LeaderboardEntry } from '../types';
import { subscribeToLeaderboard } from '../services/realtimeService';
import { getLeaderboard } from '../services/gamificationService';

interface LeaderboardWidgetProps {
  currentUserId?: string;
  limit?: number;
}

const MEDAL = ['🥇', '🥈', '🥉'];

const LeaderboardWidget: React.FC<LeaderboardWidgetProps> = ({ currentUserId, limit = 5 }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    // Initial fetch
    getLeaderboard(limit).then(setEntries);

    // Real-time updates
    const unsub = subscribeToLeaderboard((all) => setEntries(all.slice(0, limit)));
    return unsub;
  }, [limit]);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Top Students</h3>
        <span className="ml-auto text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full animate-pulse">
          LIVE
        </span>
      </div>

      <div className="space-y-3">
        {entries.map((entry, idx) => {
          const isMe = entry.id === currentUserId;
          return (
            <div
              key={entry.id}
              className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${
                isMe ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30' : ''
              }`}
            >
              <span className="text-lg w-6 text-center">
                {idx < 3 ? MEDAL[idx] : <span className="text-xs font-bold text-slate-400">#{entry.rank}</span>}
              </span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {entry.avatar
                  ? <img src={entry.avatar} alt={entry.name} className="w-full h-full rounded-full object-cover" />
                  : entry.name.charAt(0).toUpperCase()
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isMe ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>
                  {entry.name} {isMe && '(You)'}
                </p>
                <p className="text-[10px] text-slate-400">🔥 {entry.streak} day streak</p>
              </div>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {entry.xp.toLocaleString()} XP
              </span>
            </div>
          );
        })}

        {entries.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-4">Loading leaderboard...</p>
        )}
      </div>
    </div>
  );
};

export default LeaderboardWidget;
