import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Screen } from '@/components/screen';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.crown}>♛</Text>
        <Text variant="display" style={styles.wordmark}>
          chale,
        </Text>
        <Text variant="title" style={styles.tagline}>
          Real questions. Better conversations.
        </Text>
      </View>
      <Button label="Get started" onPress={() => router.replace('/home')} />
      <Button
        label="Browse questions"
        variant="outline"
        onPress={() => router.push('/home')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  hero: {
    alignItems: 'center',
    gap: theme.spacing.three,
    paddingVertical: theme.spacing.five,
  },
  crown: {
    fontSize: 30,
    color: theme.colors.street,
  },
  wordmark: {
    fontSize: 48,
    lineHeight: 52,
  },
  tagline: {
    textAlign: 'center',
  },
}));
