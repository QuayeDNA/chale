import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { artFor, type DeckArtKey, type DeckToneName } from '@/decks/art';

import { LucideIcon, type ShowcaseIconName } from './ui/icon';
import { Skeleton } from './ui/skeleton';
import { Text } from './ui/text';

export type DeckTone = DeckToneName;

export type DeckTileProps = {
  title: string;
  /** Secondary line. Pass deckTotalCopy(deck) so the copy stays consistent. */
  count: string | null;
  icon?: ShowcaseIconName;
  tone?: DeckTone;
  /** Deck slug, when known — unlocks bespoke art from src/decks/art.ts. */
  slug?: string | null;
  artKey?: string;
  onPress: () => void;
};

/**
 * Board §07 deck tile: flat brand fill, icon top-left, title and pool count
 * bottom-left, and the dashed stroke inset from the edge.
 *
 * Fill and icon come from the deck's identity keys (slug / tone / art_key) so a
 * deck with its own card design needs a content file and a registry entry, never
 * a change here.
 *
 * Depth comes from TWO sources, neither of which is a drawn "stacked edge":
 *
 *  1. A real cast shadow on the outer shell, so the tile floats above the page.
 *  2. A single light-to-dark wash across the face — lit at the top, shaded at
 *     the bottom — which is what makes a flat fill read as a thick printed
 *     card. An earlier attempt drew outlined cards fanned out behind the face
 *     to fake thickness; on the one deck with dark ink (Fun & Silly) those
 *     hairlines read as scratches, so the fake edges are gone for good.
 *
 * The two Views are not redundant. `overflow: 'hidden'` clips a view's OWN
 * shadow on iOS, so the clipping lives on the inner Pressable and the shadow on
 * the outer shell, which has no clipping.
 *
 * The dashed inset is a real dashed border on a transparent overlay View — RN
 * has no dashed-background shorthand, and a second View keeps the fill clean
 * in both themes without per-platform branches.
 */
export function DeckTile({
  title,
  count,
  icon = 'sparkles',
  tone = 'deep',
  slug = null,
  artKey = 'default',
  onPress,
}: DeckTileProps) {
  const art = artFor({ slug, tone, art_key: artKey });
  const bg = art.fill ?? '#2B4BD8';
  const ink = art.ink ?? '#FFF9E8';

  return (
    <View style={styles.shell}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${count ?? 'loading'}`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.tile,
          { backgroundColor: bg },
          pressed && styles.pressed,
        ]}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.26)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.14)']}
          locations={[0, 0.52, 1]}
          style={styles.sheen}
        />
        <LucideIcon name={icon} size={28} color={ink} />
        <View style={styles.copy}>
          <Text variant="smallBold" numberOfLines={2} style={{ color: ink }}>
            {title}
          </Text>
          <Text variant="caption" numberOfLines={1} style={[styles.count, { color: ink }]}>
            {count ?? '…'}
          </Text>
        </View>
        {/*<View pointerEvents="none" style={[styles.dash, { borderColor: ink }]} />*/}
      </Pressable>
    </View>
  );
}

/**
 * Placeholder for a tile whose deck has not arrived yet.
 *
 * A full shimmering card, end to end — the same treatment as the big block in
 * the showcase's skeleton section. Guessing at the tile's interior (an icon
 * dot and two text stubs) was wrong: it invented a layout the data might not
 * confirm and left gaps the real tile would never have. The shell keeps the
 * aspect ratio, radius and shadow, so the grid does not reflow when the deck
 * lands.
 */
export function DeckTileSkeleton() {
  const { theme } = useUnistyles();
  return (
    <View
      style={styles.shell}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Skeleton width="100%" height="100%" radius={theme.radii.card} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  // Shadow only. No overflow here on purpose — see the note in the doc comment.
  shell: {
    // Board §07 tiles are slightly taller than wide. Width comes from the grid
    // cell, so the tile sizes itself off that rather than guessing a height.
    aspectRatio: 0.88,
    borderRadius: theme.radii.card,
    // A warm brown reads softer than pure black on the paper background.
    shadowColor: '#2B1A0F',
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  tile: {
    flex: 1,
    borderRadius: theme.radii.card,
    padding: theme.spacing.three,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.two,
    overflow: 'hidden',
  },
  // Lit at the top, shaded at the bottom: the thickness cue that the removed
  // stack layers were trying and failing to draw.
  sheen: {
    ...StyleSheet.absoluteFillObject,
  },
  dash: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 8,
    bottom: 8,
    borderRadius: theme.radii.card - 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.55,
  },
  // Pressed cards sink toward the page, so the shadow tightens with them.
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.95,
  },
  copy: {
    gap: 2,
  },
  count: {
    opacity: 0.85,
  },
}));

export type { DeckArtKey };
