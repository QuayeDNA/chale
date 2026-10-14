// src/app/auth-callback.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ErrorCard } from '@/components/error-card';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { useAuth, type LinkVerifyType } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

/** What the callback route decided: exchanged, nothing to do, or failed. */
type CallbackOutcome = 'working' | 'done' | 'failed';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { verifyOtpLink } = useAuth();
  const params = useLocalSearchParams<{
    code?: string;
    token_hash?: string;
    type?: string;
    error?: string;
    error_description?: string;
  }>();
  const [err, setErr] = useState<string | null>(null);
  // Bumped by the error card's retry: re-runs the exchange once.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        if (params.error) throw new Error(params.error_description ?? params.error);
        if (params.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(params.code);
          if (error) throw error;
        } else if (params.token_hash && params.type) {
          await verifyOtpLink(params.token_hash, params.type as LinkVerifyType);
        } else {
          // OAuth-link return: the session never left the app, nothing to exchange.
          if (active) router.back();
          return;
        }
        if (active) router.replace('/home');
      } catch (e) {
        if (active) setErr((e as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, [router, verifyOtpLink, params.code, params.token_hash, params.type, params.error, params.error_description, attempt]);

  if (err) {
    return (
      <Screen>
        <ErrorCard
          title="That link didn't sign you in"
          body={err}
          onRetry={() => {
            setErr(null);
            setAttempt((n) => n + 1);
          }}
        />
        <View style={styles.back}>
          <Button label="Go back" variant="secondary" size="sm" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ActivityIndicator />
    </Screen>
  );
}

const styles = StyleSheet.create(() => ({
  // Button drops `style`, so the back-out needs a wrapper to sit on its own line.
  back: {
    alignSelf: 'flex-start',
  },
}));
