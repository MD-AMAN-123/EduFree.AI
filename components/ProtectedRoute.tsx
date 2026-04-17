import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Called when no valid session is found */
  onUnauthenticated: () => void;
}

/**
 * Wraps any view that requires authentication.
 * If no Supabase session exists, calls onUnauthenticated immediately.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, onUnauthenticated }) => {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (!supabase) {
      // No Supabase configured — allow access (dev mode)
      setAuthed(true);
      setChecking(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setAuthed(true);
      } else {
        onUnauthenticated();
      }
      setChecking(false);
    });

    // Listen for auth state changes (e.g. session expiry)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        onUnauthenticated();
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [onUnauthenticated]);

  if (checking) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  if (!authed) return null;

  return <>{children}</>;
};

export default ProtectedRoute;
