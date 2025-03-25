import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType>({ 
  session: null, 
  loading: true,
  error: null 
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    async function setupAuth() {
      try {
        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (mounted) {
          setSession(initialSession);
          setLoading(false);
        }

        // Setup auth state change listener
        const { data: { subscription }, error: subscriptionError } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            if (mounted) {
              setSession(session);
            }
          }
        );

        if (subscriptionError) throw subscriptionError;
        authSubscription = subscription;

      } catch (err) {
        console.error('Auth setup error:', err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Authentication failed'));
          setLoading(false);
        }
      }
    }

    setupAuth();

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 