import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { artFor, type DeckArtKey, type DeckToneName } from '@/decks/art';

import { LucideIcon, type ShowcaseIconName } from './ui/icon';
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
 * Fill, icon and stack treatment come from the deck's identity keys (slug /
 * tone / art_key) so a deck with its own card design needs a content file and a
 * registry entry, never a change here.
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
    <View style={styles.frame}>
      <CardStack depth={art.stackDepth} fan={art.fanDegrees} ink={ink} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${count ?? 'loading'}`}
        onPress={onPress}
        style={({ pressed }) => [styles.tile, { backgroundColor: bg }, pressed && styles.pressed]}
      >
        <LucideIcon name={icon} size={28} color={ink} />
        <View style={styles.copy}>
          <Text variant="smallBold" numberOfLines={2} style={{ color: ink }}>
            {title}
          </Text>
          <Text variant="caption" numberOfLines={1} style={[styles.count, { color: ink }]}>
            {count ?? '…'}
          </Text>
        </View>
        <View pointerEvents="none" style={[styles.dash, { borderColor: ink }]} />
      </Pressable>
    </View>
  );
}

/**
 * The deck's edges showing behind the face. Static for now — the animated
 * shuffle builds on this exact geometry, so stackDepth and fanDegrees are the
 * two numbers a future 3D treatment will animate rather than recompute.
 */
function CardStack({
  depth,
  fan,
  ink,
}: {
  depth: number;
  fan: number;
  ink: string;
}) {
  if (depth <= 0) return null;
  return (
    <>
      {Array.from({ length: depth }, (_, i) => {
        // Farther layers sit lower and lean further, so the deck reads as dealt.
        const lift = (depth - i) * 4;
        const tilt = (depth - i) * fan * (i % 2 === 0 ? 1 : -1);
        return (
          <View
            key={i}
            pointerEvents="none"
            style={[
              styles.layer,
              {
                bottom: -lift,
                opacity: 0.28 - i * 0.04,
                transform: [{ rotate: `${tilt}deg` }],
                borderColor: ink,
              },
            ]}
          />
        );
      })}
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  frame: {
    position: 'relative',
    // Fill whatever width the grid cell hands us, so a tile never leaves a
    // sliver of dead space beside it. Explicit rather than flex, because a
    // flex:1 child of an auto-height cell resolves its HEIGHT, not its width.
    width: '100%',
  },
  tile: {
    borderRadius: theme.radii.card,
    padding: theme.spacing.three,
    // Board §07 tiles are slightly taller than wide. Width comes from the grid
    // cell, so the tile sizes itself off that rather than guessing a height.
    aspectRatio: 0.88,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.two,
    overflow: 'hidden',
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
  layer: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: 8,
    bottom: 8,
    borderRadius: theme.radii.card,
    borderWidth: 1,
    borderBottomWidth: 0,
    backgroundColor: 'transparent',
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

export type { DeckArtKey };
