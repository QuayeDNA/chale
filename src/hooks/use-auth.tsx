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
  signInWithOtpEmail: (email: string) => Promise<void>;
  /** Keeps a guest's user id (and therefore their favourites) on sign-up. */
  claimAccount: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  /**
   * Deep-link sign-in: exchanges a `token_hash` from an emailed link, carried
   * through the hosted auth bridge (web/auth-bridge.html) into the app.
   */
  verifyOtpLink: (tokenHash: string, type: LinkVerifyType) => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ANONYMOUS_DISPLAY_NAME = 'New friend';

/** The verifyOtp types a magic link can carry. */
export type LinkVerifyType = 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email';

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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setProfile(await ensureProfileRow(user));
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const signInWithOtpEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
    if (error) throw error;
  }, []);

  /**
   * Promotes an anonymous session to a real account IN PLACE.
   *
   * Why not signInWithOtpEmail: Supabase does not link an anonymous user to a
   * new account automatically. Signing in normally mints a BRAND NEW user id,
   * which orphans everything keyed to the old one — a guest's favourites
   * (favourites.user_id) silently disappear on sign-up. updateUser() keeps the
   * same user.id, so their data comes with them and no schema change is needed.
   *
   * See https://supabase.com/docs/guides/auth/auth-anonymous ("linking").
   */
  const claimAccount = useCallback(async (email: string) => {
    const clean = email.trim();
    const { data: current } = await supabase.auth.getUser();
    if (!current.user) throw new Error('Not signed in');
    if (!current.user.is_anonymous) {
      const { error } = await supabase.auth.signInWithOtp({ email: clean, options: { shouldCreateUser: true } });
      if (error) throw error;
      return;
    }

    const { error } = await supabase.auth.updateUser({ email: clean });
    if (!error) {
      // The anon user keeps its id, so the existing users row still matches.
      await refreshProfile();
      return;
    }

    // updateUser fails when the address already belongs to a different account.
    // That is the one case where an in-place promotion is impossible, so fall
    // back to a normal sign-in and accept that the anon data stays behind.
    if (/already|registered|exists|conflict/i.test(error.message)) {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: clean,
        options: { shouldCreateUser: true },
      });
      if (otpError) throw otpError;
      return;
    }
    throw error;
  }, [refreshProfile]);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: 'email' });
    if (error) throw error;
    await supabase.auth.getSession();
    await refreshProfile();
  }, [refreshProfile]);

  const verifyOtpLink = useCallback(
    async (tokenHash: string, type: LinkVerifyType) => {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      if (error) throw error;
      await refreshProfile();
    },
    [refreshProfile],
  );

  const updateDisplayName = useCallback(async (name: string) => {
    const clean = name.trim();
    if (!clean) throw new Error('Name cannot be empty');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in');
    const { error } = await supabase.from('users').update({ display_name: clean }).eq('id', user.id);
    if (error) throw error;
    await refreshProfile();
  }, [refreshProfile]);

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
      signInWithOtpEmail,
      claimAccount,
      verifyOtp,
      verifyOtpLink,
      updateDisplayName,
    }),
    [
      status,
      session,
      user,
      profile,
      refreshProfile,
      signOut,
      signInWithOtpEmail,
      claimAccount,
      verifyOtp,
      verifyOtpLink,
      updateDisplayName,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
