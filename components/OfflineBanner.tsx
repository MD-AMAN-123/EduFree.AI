import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, Loader2 } from 'lucide-react';
import { flush } from '../services/syncQueue';

const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ succeeded: number; failed: number } | null>(null);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = async () => {
      setIsOffline(false);
      // Auto-sync pending operations
      setSyncing(true);
      const result = await flush();
      setSyncing(false);
      if (result.succeeded > 0) {
        setSyncResult(result);
        setTimeout(() => setSyncResult(null), 4000);
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline && !syncing && !syncResult) return null;

  if (syncResult) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/40 rounded-2xl text-green-700 dark:text-green-400 text-sm font-semibold animate-in slide-in-from-top-2">
        <Wifi size={16} />
        Back online — synced {syncResult.succeeded} item{syncResult.succeeded !== 1 ? 's' : ''} to the cloud.
      </div>
    );
  }

  if (syncing) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 mb-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700/40 rounded-2xl text-indigo-700 dark:text-indigo-400 text-sm font-semibold">
        <Loader2 size={16} className="animate-spin" />
        Syncing offline data...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-2xl text-amber-700 dark:text-amber-400 text-sm font-semibold">
      <WifiOff size={16} />
      You're offline — AI Coach is using Gemma 4 on-device mode. Progress will sync when you reconnect.
    </div>
  );
};

export default OfflineBanner;
