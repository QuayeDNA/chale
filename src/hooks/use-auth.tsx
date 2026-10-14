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
import { AUTH_BRIDGE_URL } from '@/constants/legal';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';

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
  signInWithGoogle: () => Promise<LinkResult>;
  signInWithApple: () => Promise<LinkResult>;
  updateDisplayName: (name: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ANONYMOUS_DISPLAY_NAME = 'New friend';

/** The verifyOtp types a magic link can carry. */
export type LinkVerifyType = 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email';

const bridgeRedirect = () => (AUTH_BRIDGE_URL ? { emailRedirectTo: AUTH_BRIDGE_URL } : {});

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

// Completes web auth sessions. No-op on native, required on web.
WebBrowser.maybeCompleteAuthSession();

const CALLBACK = 'chale://auth-callback';

const linkConflict = (message: string) => /already|linked|exists|conflict/i.test(message);

/** What a social method reports: linked in place, signed in separately, or stood down. */
export type LinkResult = { linked: boolean; note?: string; cancelled?: boolean };

/** Pulls `?code=` out of a redirect URL without relying on the URL constructor. */
const codeFromUrl = (url: string) => {
  const m = /[?&]code=([^&]+)/.exec(url);
  return m ? decodeURIComponent(m[1]) : null;
};

/**
 * Opens the provider URL and exchanges the PKCE code the browser hands back.
 * Returns true when a code was exchanged. A dismissed browser (cancel /
 * dismiss result, or no code) returns false — the caller reports `cancelled`
 * and the screen stays put, silently. Without this exchange the session is
 * never established and the app just returns to a signed-out screen.
 */
const openProviderUrl = async (url: string | null | undefined): Promise<boolean> => {
  if (!url) return false;
  const result = await WebBrowser.openAuthSessionAsync(url, CALLBACK);
  if (result.type !== 'success') return false;
  const code = codeFromUrl(result.url);
  if (!code) return false;
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
  return true;
};

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
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true, ...bridgeRedirect() } });
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
      const { error } = await supabase.auth.signInWithOtp({ email: clean, options: { shouldCreateUser: true, ...bridgeRedirect() } });
      if (error) throw error;
      return;
    }

    const { error } = await supabase.auth.updateUser(
      { email: clean },
      ...(AUTH_BRIDGE_URL ? [{ emailRedirectTo: AUTH_BRIDGE_URL }] : []),
    );
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
        options: { shouldCreateUser: true, ...bridgeRedirect() },
      });
      if (otpError) throw otpError;
      return;
    }
    throw error;
  }, [refreshProfile]);

  const signInWithGoogle = useCallback(async (): Promise<LinkResult> => {
    const { data: current } = await supabase.auth.getUser();
    const anon = !!current.user?.is_anonymous;
    const call = anon
      ? () =>
          supabase.auth.linkIdentity({
            provider: 'google',
            options: { redirectTo: CALLBACK, skipBrowserRedirect: true },
          })
      : () =>
          supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: CALLBACK, skipBrowserRedirect: true },
          });
    try {
      const { data, error } = await call();
      if (error) throw error;
      const exchanged = await openProviderUrl(data.url);
      await refreshProfile();
      if (!exchanged) return { linked: anon, cancelled: true };
      return { linked: anon };
    } catch (e) {
      if (anon && linkConflict((e as Error).message)) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: CALLBACK, skipBrowserRedirect: true },
        });
        if (error) throw error;
        const exchanged = await openProviderUrl(data.url);
        await refreshProfile();
        if (!exchanged) return { linked: false, cancelled: true };
        return { linked: false, note: 'Signed in as your Google account. Guest favourites stayed on this device.' };
      }
      throw e;
    }
  }, [refreshProfile]);

  const signInWithApple = useCallback(async () => {
    let identityToken: string | null;
    try {
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });
      identityToken = cred.identityToken ?? null;
    } catch (e) {
      // Cancellation is not failure — return silently, no error text.
      if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return { linked: true };
      throw e;
    }
    if (!identityToken) throw new Error('Apple sign-in returned no token');
    const { data: current } = await supabase.auth.getUser();
    const anon = !!current.user?.is_anonymous;
    try {
      if (anon) {
        const { error } = await supabase.auth.linkIdentity({ provider: 'apple', token: identityToken });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: identityToken });
        if (error) throw error;
      }
      await refreshProfile();
      return { linked: anon };
    } catch (e) {
      if (anon && linkConflict((e as Error).message)) {
        const { error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: identityToken });
        if (error) throw error;
        await refreshProfile();
        return { linked: false, note: 'Signed in with your Apple ID. Guest favourites stayed on this device.' };
      }
      throw e;
    }
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
      signInWithGoogle,
      signInWithApple,
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
      signInWithGoogle,
      signInWithApple,
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
