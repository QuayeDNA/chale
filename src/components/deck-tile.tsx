import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { LucideIcon, type ShowcaseIconName } from './ui/icon';
import { Text } from './ui/text';

export type DeckTone = 'love' | 'deep' | 'silly' | 'dreams' | 'family' | 'friends';

/**
 * Board §07 deck fills — fixed brand colors in both themes.
 * Paper text everywhere; board ink on the street tile.
 */
const DECK_TONES: Record<DeckTone, { bg: string; ink: string }> = {
  love: { bg: '#D85A30', ink: '#FFF9E8' },
  deep: { bg: '#2B4BD8', ink: '#FFF9E8' },
  silly: { bg: '#F5B400', ink: '#2B1A0F' },
  dreams: { bg: '#1E7A3C', ink: '#FFF9E8' },
  family: { bg: '#639922', ink: '#FFF9E8' },
  friends: { bg: '#D4537E', ink: '#FFF9E8' },
};

export function DeckTile({
  title,
  count,
  icon = 'sparkles',
  tone = 'deep',
  onPress,
}: {
  title: string;
  count: number | null;
  icon?: ShowcaseIconName;
  tone?: DeckTone;
  onPress: () => void;
}) {
  const { bg, ink } = DECK_TONES[tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${count === null ? 'loading' : `${count} questions`}`}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, { backgroundColor: bg }, pressed && styles.pressed]}
    >
      <LucideIcon name={icon} size={28} color={ink} />
      <View style={styles.copy}>
        <Text variant="smallBold" style={{ color: ink }}>
          {title}
        </Text>
        <Text variant="caption" style={[styles.count, { color: ink }]}>
          {count === null ? '…' : `${count} questions`}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  tile: {
    borderRadius: theme.radii.card,
    padding: theme.spacing.three,
    minHeight: 156,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.two,
  },
  pressed: {
    opacity: 0.85,
  },
  copy: {
    gap: 2,
  },
  count: {
    opacity: 0.85,
  },
}));
