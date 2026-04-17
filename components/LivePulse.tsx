import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Users } from 'lucide-react';

const LivePulse: React.FC = () => {
  const [activeCount, setActiveCount] = useState<number>(0);

  useEffect(() => {
    if (!supabase) return;

    const fetchCount = async () => {
      const threshold = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('last_activity_at', threshold);
      setActiveCount(count ?? 0);
    };

    fetchCount();

    const channel = supabase
      .channel('live-pulse')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchCount)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-full text-xs font-bold text-emerald-700 dark:text-emerald-400">
      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <Users size={12} />
      <span>{activeCount} studying now</span>
    </div>
  );
};

export default LivePulse;
