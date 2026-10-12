import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { deckMeta } from '@/components/storefront-grid-view';
import { LucideIcon, iconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { DECK_INKS, gradientFor } from '@/decks/art';
import type { DeckSummary } from '@/lib/decks';

type Props = {
  decks: DeckSummary[];
  onOpenDeck: (deck: DeckSummary) => void;
};

/**
 * Storefront list view — the concept's `.list`: one dense row per deck with a
 * 56×68 gradient swatch, the title, the pool line, and a FREE marker on the
 * right. The cheapest way to scan every deck, and the only view where the
 * price column earns its place.
 */
export function StorefrontListView({ decks, onOpenDeck }: Props) {
  return (
    <View style={styles.list}>
      {decks.map((deck) => {
        const ink = DECK_INKS[deck.tone] ?? '#FFF9E8';
        return (
          <Pressable
            key={deck.id}
            onPress={() => onOpenDeck(deck)}
            accessibilityRole="button"
            accessibilityLabel={`${deck.title}, ${deckMeta(deck)}`}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <LinearGradient
              colors={[...gradientFor(deck.tone)]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.swatch}
            >
              <LucideIcon name={iconName(deck.icon)} size={22} color={ink} />
            </LinearGradient>
            <View style={styles.copy}>
              <Text variant="bodyStrong" numberOfLines={1}>
                {deck.title}
              </Text>
              <Text variant="caption" muted numberOfLines={1}>
                {deckMeta(deck)}
              </Text>
            </View>
            <Text variant="smallBold" muted style={styles.free}>
              Free
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  list: {
    gap: theme.spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  swatch: {
    width: 56,
    height: 68,
    borderRadius: theme.radii.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  free: {
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
}));