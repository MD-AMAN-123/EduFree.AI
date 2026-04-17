import React, { useEffect, useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { AIInsight, DashboardStats } from '../types';
import { generateDashboardInsights } from '../services/geminiService';

interface AIInsightsStreamProps {
  userName: string;
  stats: DashboardStats;
}

const TYPE_STYLES: Record<AIInsight['type'], string> = {
  success: 'border-green-100 dark:border-green-800/30 bg-green-50/50 dark:bg-green-900/10',
  warning: 'border-orange-100 dark:border-orange-800/30 bg-orange-50/50 dark:bg-orange-900/10',
  info:    'border-blue-100 dark:border-blue-800/30 bg-blue-50/50 dark:bg-blue-900/10',
};

const DOT_STYLES: Record<AIInsight['type'], string> = {
  success: 'bg-green-500',
  warning: 'bg-orange-500',
  info:    'bg-blue-500',
};

const AIInsightsStream: React.FC<AIInsightsStreamProps> = ({ userName, stats }) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setInsights([]);

    generateDashboardInsights(userName, stats)
      .then((result) => {
        if (!cancelled) {
          // Simulate streaming by revealing insights one by one
          result.forEach((insight, idx) => {
            setTimeout(() => {
              if (!cancelled) setInsights(prev => [...prev, insight]);
            }, idx * 400);
          });
          setTimeout(() => { if (!cancelled) setLoading(false); }, result.length * 400 + 200);
        }
      })
      .catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [userName]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-indigo-500" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">AI Personal Insights</h3>
        {loading && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin ml-1" />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl border flex flex-col gap-2 transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-2 duration-500 ${TYPE_STYLES[insight.type]}`}
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${DOT_STYLES[insight.type]}`} />
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{insight.title}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {insight.description}
            </p>
          </div>
        ))}

        {loading && insights.length === 0 && (
          <div className="col-span-full py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed dark:border-slate-700">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Generating fresh insights for you...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsightsStream;
