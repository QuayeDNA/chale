import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, RelationshipThemes, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

type SampleQuestion = {
  id: string;
  text: string;
  kind: 'text' | 'voice' | 'either';
};

export default function HomeScreen() {
  const router = useRouter();
  const { user, profile, isAnonymous } = useAuth();
  const [samples, setSamples] = useState<SampleQuestion[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('id, text, kind')
        .limit(3);
      if (!active) return;
      if (error) {
        setLoadFailed(true);
        return;
      }
      setSamples((data ?? []) as SampleQuestion[]);
    })();
    return () => {
      active = false;
    };
  }, []);

  const accent = RelationshipThemes.partner;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <ThemedView style={styles.hero}>
            <ThemedText type="code" style={styles.wordmark}>
              chale,
            </ThemedText>

            {user ? (
              <ThemedText type="subtitle" style={styles.title}>
                Hey{profile?.display_name ? `, ${profile.display_name}` : ''}
              </ThemedText>
            ) : (
              <ThemedText type="subtitle" style={styles.title}>
                A question a day{'\n'}with your person
              </ThemedText>
            )}

            <ThemedText themeColor="textSecondary" style={styles.tagline}>
              {isAnonymous
                ? 'Browse free for a while. When you start with your person, that’s when the account moment comes.'
                : 'Your connection is set up. Today’s question arrives soon.'}
            </ThemedText>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.sampleCard}>
            <ThemedText type="smallBold" style={{ color: accent.accent }}>
              Sample questions
            </ThemedText>
            {loadFailed ? (
              <ThemedText type="small" themeColor="textSecondary">
                Couldn’t reach the question library — check your connection and reload.
              </ThemedText>
            ) : samples.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                Loading…
              </ThemedText>
            ) : (
              samples.map((q) => (
                <ThemedView key={q.id} style={styles.sampleRow}>
                  <ThemedText type="code" style={styles.kindTag}>
                    {q.kind}
                  </ThemedText>
                  <ThemedText type="small" style={styles.sampleText}>
                    {q.text}
                  </ThemedText>
                </ThemedView>
              ))
            )}
          </ThemedView>

          <Pressable
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: accent.accent, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => router.push('/start')}>
            <ThemedText style={[styles.ctaText, { color: accent.accentText }]}>
              Start with your person
            </ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  hero: {
    gap: Spacing.three,
  },
  wordmark: {
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  title: {
    marginTop: Spacing.one,
  },
  tagline: {
    lineHeight: 22,
  },
  sampleCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  sampleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  kindTag: {
    fontSize: 10,
    textTransform: 'uppercase',
    paddingTop: 3,
  },
  sampleText: {
    flex: 1,
  },
  cta: {
    borderRadius: Spacing.five,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 16,
    fontWeight: 700,
  },
});