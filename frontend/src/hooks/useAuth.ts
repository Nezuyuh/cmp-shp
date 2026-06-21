'use client';

import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAdmin: false,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      const isAdmin = user?.user_metadata?.role === 'admin' ||
        user?.app_metadata?.role === 'admin';
      setState({ user, session, loading: false, isAdmin });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      const isAdmin = user?.user_metadata?.role === 'admin' ||
        user?.app_metadata?.role === 'admin';
      setState({ user, session, loading: false, isAdmin });
    });

    return () => subscription.unsubscribe();
  }, []);

  return state;
}
