import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { LucideIcon, iconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { PREMIUM_DECKS, type PremiumDeck } from '@/decks/storefront';

type Props = {
  decks?: PremiumDeck[];
};

const TILE_WIDTH = 150;
const TILE_GAP = 10;

/**
 * The "coming" shelf from the storefront concept: a featured banner for the
 * first pack and a horizontal run of tiles for the rest.
 *
 * Presentation only, deliberately. There is no checkout and no premium content
 * yet — a pack that cannot be opened must not pretend otherwise, so the price
 * reads as information rather than as a button. When the store lands this
 * section becomes the seam: entitlements decide whether a pack renders as a
 * tile or as the locked treatment, and the banner opens the same deck sheet.
 */
export function StorefrontShop({ decks = PREMIUM_DECKS }: Props) {
  if (decks.length === 0) return null;
  const [featured, ...rest] = decks;

  return (
    <View style={styles.shop}>
      <View style={styles.heading}>
        <Text variant="title">Premium packs</Text>
        <Text variant="caption" muted>
          {decks.length} coming
        </Text>
      </View>

      <View style={styles.featured}>
        <LinearGradient
          colors={['#6D4BFF', '#1B1240']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.featuredWash}
          pointerEvents="none"
        />
        {/* The concept draws this with an inset box-shadow; a bordered circle
            offset off the corner is the same read on native. */}
        <View style={styles.featuredRing} pointerEvents="none" />
        <Text variant="smallBold" style={styles.featuredLabel}>
          Featured · {featured.price}
        </Text>
        <Text variant="title" style={styles.featuredTitle}>
          {featured.title}
        </Text>
        <Text variant="small" style={styles.featuredCopy}>
          {featured.tagline} {featured.questionCount} questions for after dark.
        </Text>
        <View style={styles.goPill}>
          <LucideIcon name="play" size={12} color="#0D0C12" />
          <Text variant="smallBold" style={styles.goText}>
            Peek inside
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
          <PremiumTile key={deck.id} deck={deck} />
        ))}
      </ScrollView>
    </View>
  );
}

function PremiumTile({ deck }: { deck: PremiumDeck }) {
  return (
    <View
      accessibilityLabel={`${deck.title}, ${deck.price}, coming soon`}
      accessibilityState={{ disabled: true }}
      style={styles.tile}
    >
      <LinearGradient
        colors={[deck.c1, deck.c2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <View style={styles.tileCopy}>
        <Text variant="bodyStrong" style={styles.tileTitle}>
          {deck.title}
        </Text>
        <Text variant="caption" style={styles.tileMeta}>
          {deck.questionCount} questions
        </Text>
      </View>
      <View style={styles.tilePrice}>
        <LucideIcon name={iconName(deck.icon)} size={11} color="#FFF9E8" strokeWidth={2.5} />
        <Text variant="smallBold" style={styles.tilePriceText}>
          {deck.price}
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
    backgroundColor: '#1B1240',
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
    color: '#C9BEFF',
    fontSize: 10.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  featuredTitle: {
    color: '#FFF9E8',
    marginTop: 2,
  },
  featuredCopy: {
    color: '#C9C2E6',
    maxWidth: 220,
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
  tileTitle: {
    color: '#FFF9E8',
  },
  tileMeta: {
    color: 'rgba(255,249,232,0.8)',
  },
  tilePrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  tilePriceText: {
    color: '#FFF9E8',
    fontSize: 11,
  },
}));