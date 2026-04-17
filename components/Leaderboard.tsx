import React, { useEffect, useState } from 'react';
import { Trophy, Flame, Zap, TrendingUp, Loader2 } from 'lucide-react';
import { LeaderboardEntry, RankInfo } from '../types';
import { getLeaderboard, getRanking } from '../services/gamificationService';
import { subscribeToLeaderboard } from '../services/realtimeService';

interface LeaderboardProps {
  currentUserId?: string;
}

const MEDALS = ['🥇', '🥈', '🥉'];

const Leaderboard: React.FC<LeaderboardProps> = ({ currentUserId }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [rankInfo, setRankInfo] = useState<RankInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load
    Promise.all([
      getLeaderboard(20),
      currentUserId ? getRanking(currentUserId) : Promise.resolve(null),
    ]).then(([lb, rank]) => {
      setEntries(lb);
      setRankInfo(rank);
      setLoading(false);
    });

    // Real-time updates
    const unsub = subscribeToLeaderboard((updated) => setEntries(updated));
    return unsub;
  }, [currentUserId]);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in pb-24">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 opacity-10"><Trophy size={200} /></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Trophy size={28} />
            <h1 className="text-3xl font-bold">Leaderboard</h1>
            <span className="ml-auto text-[10px] font-bold bg-white/20 px-2 py-1 rounded-full animate-pulse">LIVE</span>
          </div>
          <p className="text-orange-100 text-sm">Top students ranked by XP. Keep learning to climb the ranks!</p>
        </div>
      </div>

      {/* My Rank Card */}
      {rankInfo && currentUserId && (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border dark:border-slate-700 shadow-sm">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Your Standing</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">#{rankInfo.rank}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Global Rank</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{rankInfo.xpToNext.toLocaleString()}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">XP to Next Rank</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{rankInfo.percentile}%</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Percentile</p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b dark:border-slate-700 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-500" /> Top 20 Students
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : (
          <div className="divide-y dark:divide-slate-700">
            {entries.map((entry, idx) => {
              const isMe = entry.id === currentUserId;
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                    isMe ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                  }`}
                >
                  {/* Rank */}
                  <div className="w-8 text-center flex-shrink-0">
                    {idx < 3 ? (
                      <span className="text-xl">{MEDALS[idx]}</span>
                    ) : (
                      <span className="text-sm font-bold text-slate-400 dark:text-slate-500">#{entry.rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
                    {entry.avatar
                      ? <img src={entry.avatar} alt={entry.name} className="w-full h-full object-cover" />
                      : entry.name.charAt(0).toUpperCase()
                    }
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm truncate ${isMe ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-100'}`}>
                      {entry.name} {isMe && <span className="text-xs font-normal">(You)</span>}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                      <Flame size={10} className="text-orange-400" />
                      {entry.streak} day streak
                    </div>
                  </div>

                  {/* XP */}
                  <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold flex-shrink-0">
                    <Zap size={14} />
                    {entry.xp.toLocaleString()} XP
                  </div>
                </div>
              );
            })}

            {entries.length === 0 && (
              <p className="text-center text-slate-400 py-12 text-sm">No students on the leaderboard yet. Start learning to earn XP!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
