import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, RelationshipThemes, Spacing } from '@/constants/theme';

export default function StartScreen() {
  const router = useRouter();
  const accent = RelationshipThemes.partner;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle" style={styles.title}>
            Start with your person
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.body}>
            This is where you’ll create a connection: generate an invite link, or join with
            someone else’s code. Account setup happens right here — not at app launch.
          </ThemedText>
          <ThemedText type="smallBold" style={{ color: accent.accent }}>
            Coming up next — pairing flow
          </ThemedText>
        </ThemedView>

        <ThemedText
          type="link"
          style={styles.back}
          onPress={() => router.back()}>
          ← Back home
        </ThemedText>
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
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
    gap: Spacing.four,
  },
  card: {
    gap: Spacing.three,
  },
  title: {
    marginBottom: Spacing.one,
  },
  body: {
    lineHeight: 22,
  },
  back: {
    textAlign: 'center',
  },
});