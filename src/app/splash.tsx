import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/components/ui/text';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace('/welcome'), 1500);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.center}>
        <Text style={styles.crown}>♛</Text>
        <Text variant="display" style={styles.wordmark}>
          chale,
        </Text>
        <Text style={styles.tagline}>Better questions. Deeper chats.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.ink,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.three,
    padding: theme.spacing.five,
  },
  crown: {
    fontSize: 30,
    color: theme.colors.street,
  },
  wordmark: {
    fontSize: 56,
    lineHeight: 60,
    color: theme.colors.paper,
  },
  tagline: {
    fontFamily: 'SplineSans_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.paper,
    opacity: 0.8,
  },
}));
