import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { LucideIcon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { DECK_INKS, gradientFor } from '@/decks/art';
import type { DeckSummary } from '@/lib/decks';

type Props = {
  decks: DeckSummary[];
};

const TILE_WIDTH = 150;
const TILE_GAP = 10;

/**
 * The "coming soon" shelf: a featured banner for the first locked pack and a
 * horizontal run of tiles for the rest. The packs come from the database like
 * every other deck, so the shelf is empty until the locked seed has run.
 *
 * Presentation only, deliberately. There is no checkout and no premium content
 * yet — a pack that cannot be opened must not pretend otherwise, so the pill
 * says Locked rather than imitating a button. When the store lands this section
 * becomes the seam: entitlements decide whether a pack renders here or joins
 * the playable catalogue.
 */
export function StorefrontShop({ decks }: Props) {
  if (decks.length === 0) return null;
  const [featured, ...rest] = decks;
  const featuredInk = DECK_INKS[featured.tone] ?? '#FFF9E8';

  return (
    <View style={styles.shop}>
      <View style={styles.heading}>
        <Text variant="title">Coming soon</Text>
        <Text variant="caption" muted>
          {decks.length} locked {decks.length === 1 ? 'pack' : 'packs'}
        </Text>
      </View>

      <View style={styles.featured}>
        <LinearGradient
          colors={gradientFor(featured.tone)}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.featuredWash}
          pointerEvents="none"
        />
        {/* The concept draws this with an inset box-shadow; a bordered circle
            offset off the corner is the same read on native. */}
        <View style={styles.featuredRing} pointerEvents="none" />
        <Text variant="smallBold" style={[styles.featuredLabel, { color: featuredInk }]}>
          Featured · Locked
        </Text>
        <Text variant="title" style={[styles.featuredTitle, { color: featuredInk }]}>
          {featured.title}
        </Text>
        <Text variant="small" style={[styles.featuredCopy, { color: featuredInk }]}>
          {featured.tagline ? `${featured.tagline} ` : ''}
          {featured.question_count} questions.
        </Text>
        <View style={styles.goPill}>
          <LucideIcon name="lock" size={12} color="#0D0C12" />
          <Text variant="smallBold" style={styles.goText}>
            Locked
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tiles}
        contentContainerStyle={styles.tilesRow}
      >
        {rest.map((deck) => (
          <LockedTile key={deck.id} deck={deck} />
        ))}
      </ScrollView>
    </View>
  );
}

function LockedTile({ deck }: { deck: DeckSummary }) {
  const ink = DECK_INKS[deck.tone] ?? '#FFF9E8';

  return (
    <View
      accessibilityLabel={`${deck.title}, coming soon. ${deck.tagline ?? ''} ${deck.question_count} questions.`}
      accessibilityState={{ disabled: true }}
      style={styles.tile}
    >
      <LinearGradient
        colors={gradientFor(deck.tone)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <View style={styles.tileCopy}>
        <Text variant="bodyStrong" style={{ color: ink }}>
          {deck.title}
        </Text>
        <Text variant="caption" style={[styles.tileMeta, { color: ink }]}>
          {deck.question_count} questions
        </Text>
      </View>
      <View style={styles.tileBadge}>
        <LucideIcon name="lock" size={11} color="#FFF9E8" strokeWidth={2.5} />
        <Text variant="smallBold" style={styles.tileBadgeText}>
          Coming soon
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  shop: {
    gap: theme.spacing.two,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  featured: {
    gap: theme.spacing.one,
    padding: theme.spacing.four,
    borderRadius: theme.radii.hero,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  featuredWash: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 26,
    borderColor: 'rgba(255,255,255,0.12)',
    right: -30,
    top: -30,
  },
  featuredLabel: {
    fontSize: 10.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.75,
  },
  featuredTitle: {
    marginTop: 2,
  },
  featuredCopy: {
    maxWidth: 220,
    opacity: 0.8,
  },
  goPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.two,
    alignSelf: 'flex-start',
    marginTop: theme.spacing.two,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: theme.radii.chip,
    backgroundColor: '#F3F0E8',
  },
  goText: {
    color: '#0D0C12',
  },
  tiles: {
    // Tiles run past the page padding so the next one peeks in.
    marginHorizontal: -theme.spacing.four,
    // Same trap as the filter chips: React Native's default ScrollView
    // flexGrow: 1 lets the row absorb leftover height in a column, so the
    // space under it grew as the shelf got shorter.
    flexGrow: 0,
    flexShrink: 0,
  },
  tilesRow: {
    paddingHorizontal: theme.spacing.four,
    gap: TILE_GAP,
  },
  tile: {
    width: TILE_WIDTH,
    minHeight: 110,
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    overflow: 'hidden',
  },
  tileCopy: {
    gap: 2,
  },
  tileMeta: {
    opacity: 0.8,
  },
  tileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  tileBadgeText: {
    color: '#FFF9E8',
    fontSize: 11,
  },
}));
