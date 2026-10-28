import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { LucideIcon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

type Props = {
  freeCount: number | null;
  premiumCount: number | null;
};

/**
 * Storefront page header — title + tagline on the left, a free/coming-soon
 * count pill on the right. Counts come from the catalogue query; null means
 * the decks are still loading.
 */
export function StorefrontHeader({ freeCount, premiumCount }: Props) {
  const { theme } = useUnistyles();
  return (
    <View style={styles.header}>
      <View style={styles.top}>
        <Text variant="display">Decks</Text>
        <View style={styles.coin} accessibilityRole="text">
          <LucideIcon name="layers" size={14} color={theme.colors.ink} />
          <Text variant="smallBold">
            {freeCount ?? '…'} free · {premiumCount ?? '…'} coming soon
          </Text>
        </View>
      </View>
      <Text variant="body" muted>
        Pick a pack. Start a conversation.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: {
    gap: 2,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  coin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
}));
