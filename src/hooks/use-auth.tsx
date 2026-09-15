'use client';

import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

type AuthStatus = 'loading' | 'signedIn';

type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  isAnonymous: boolean;
  profile: Tables<'users'> | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ANONYMOUS_DISPLAY_NAME = 'New friend';

async function ensureProfileRow(user: User): Promise<Tables<'users'> | null> {
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (existing) return existing;

  // Anonymous-first: an anon visitor still gets a users row (see docs/02 §2).
  const { data: created } = await supabase
    .from('users')
    .insert({ id: user.id, display_name: user.user_metadata.display_name ?? ANONYMOUS_DISPLAY_NAME })
    .select('*')
    .single();

  return created;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Tables<'users'> | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        // Anonymous-first: browsing works without an account. Identity is
        // requested (email magic link) only when the user initiates pairing.
        const { data: anonSession } = await supabase.auth.signInAnonymously();
        if (!active) return;
        setSession(anonSession.session);
        if (anonSession.session?.user) {
          setProfile(await ensureProfileRow(anonSession.session.user));
        }
      } else if (active) {
        setSession(data.session);
        if (data.session.user) {
          setProfile(await ensureProfileRow(data.session.user));
        }
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
        if (!active) return;
        setSession(nextSession);
        setStatus('signedIn');
        if (nextSession?.user) {
          setProfile(await ensureProfileRow(nextSession.user));
        }
      });

      if (active) setStatus('signedIn');

      return () => {
        active = false;
        subscription.unsubscribe();
      };
    })();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return;
    setProfile(await ensureProfileRow(session.user));
  }, [session]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const user = session?.user ?? null;

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      user,
      isAnonymous: user?.is_anonymous ?? false,
      profile,
      refreshProfile,
      signOut,
    }),
    [status, session, user, profile, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
