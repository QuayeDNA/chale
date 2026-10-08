import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import { artFor, deckTotalCopy, iconName, toneName } from '@/decks/art';
import type { DeckSummary } from '@/lib/decks';

import { LucideIcon } from './ui/icon';
import { Text } from './ui/text';

/**
 * Board §05 "Deck Card" — a deck dealt as a single thick card: the deck's own
 * fill on the face, lit at the top and shaded at the bottom so the flat fill
 * reads as printed card stock. There is no perspective transform, so it renders
 * identically on iOS and Android.
 *
 * There are deliberately NO drawn edges behind the face. The first version fanned
 * two outlined cards out behind it for thickness; on the one deck with dark ink
 * (Fun & Silly) those hairlines read as scratches rather than card edges, so the
 * fake stack is gone from both this card and DeckTile. Depth is now the cast
 * shadow plus the light-to-dark wash, which behave identically on every deck.
 *
 * "Orbit" comes from scroll, not gesture state. As a card leaves centre it lifts,
 * tips and dims, so paging the carousel reads as pulling a card out of a spread.
 * Every value below is derived from one shared scroll offset on the UI thread;
 * the JS thread never participates.
 *
 * The face is NEVER translated sideways. The list has already placed it; adding
 * a lateral shove pushed every card into its neighbour's slot and was the cause
 * of the "cards are overlaying" bug. The slot is the full scroll step, leaving
 * BLEED of clear room either side for the tip to move in.
 */

const FACE_RADIUS = 24;

/**
 * Clear room above and below the face inside its own cell.
 *
 * The cell used to be exactly card-height, which clipped the three things that
 * make the card look raised: the tip (a rotated rect is taller than its width
 * suggests), the lift off centre, and the drop shadow under the bottom edge.
 * The face centres itself in the slack, so nothing needs to know the numbers.
 */
const CARD_SLACK = 20;

/** Face height as a share of its width. Board deck cards are portrait. */
const CARD_RATIO = 1.38;

export type DeckStackCardProps = {
  deck: DeckSummary;
  index: number;
  /** Distance between adjacent card centres — also the scroll snap interval. */
  step: number;
  scrollX: SharedValue<number>;
  width: number;
  onPress: () => void;
};

/** -1 .. 1 across the pager, 0 when this card is centred. */
function useCardProgress(scrollX: SharedValue<number>, index: number, step: number) {
  return useDerivedValue(() =>
    interpolate(
      scrollX.value,
      [index * step - step, index * step, index * step + step],
      [-1, 0, 1],
      Extrapolation.CLAMP,
    ),
  );
}

function DeckStackCardImpl({ deck, index, step, scrollX, width, onPress }: DeckStackCardProps) {
  const art = artFor({ slug: deck.slug, tone: toneName(deck.tone), art_key: deck.art_key });
  const fill = art.fill ?? '#2B4BD8';
  const ink = art.ink ?? '#FFF9E8';
  // The face is portrait; the slot that holds it is taller still.
  const faceHeight = Math.round(width * CARD_RATIO);
  const slotHeight = faceHeight + CARD_SLACK * 2;

  const progress = useCardProgress(scrollX, index, step);

  const faceStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const abs = Math.abs(p);
    return {
      transform: [
        // No translateX. The list already placed this card; shoving it sideways
        // as well is what piled cards on top of each other.
        { translateY: -abs * 6 },
        { rotate: `${p * 9}deg` },
        { scale: 1 - abs * 0.08 },
      ],
      opacity: 1 - abs * 0.5,
    };
  });

  // The slot is the full scroll step, not the face width: the extra bleed on
  // each side is the room the face tip needs to move in without touching the
  // card beside it. CARD_SLACK does the same job vertically, so the shadow and
  // the off-centre lift are never cropped.
  return (
    <View style={[styles.slot, { width: step, height: slotHeight }]}>
      <Animated.View style={[styles.faceWrap, { width, height: faceHeight }, faceStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${deck.title}, ${deckTotalCopy(deck)}`}
          onPress={onPress}
          style={({ pressed }) => [
            styles.face,
            { backgroundColor: fill },
            pressed && styles.pressed,
          ]}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.26)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.16)']}
            locations={[0, 0.5, 1]}
            style={styles.sheen}
          />
          <LucideIcon name={iconName(deck.icon)} size={40} color={ink} />
          <View style={styles.faceCopy}>
            <Text variant="title" numberOfLines={2} style={{ color: ink }}>
              {deck.title}
            </Text>
            <Text variant="caption" style={[styles.faceCount, { color: ink }]}>
              {deckTotalCopy(deck)}
            </Text>
            {deck.tagline ? (
              <Text variant="caption" numberOfLines={2} style={[styles.faceTagline, { color: ink }]}>
                {deck.tagline}
              </Text>
            ) : null}
          </View>
          <View style={[styles.selectPill, { backgroundColor: ink }]}>
            <Text variant="smallBold" style={{ color: fill }}>
              Select
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export const DeckStackCard = memo(DeckStackCardImpl);

const styles = StyleSheet.create((theme) => ({
  slot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceWrap: {
    position: 'absolute',
  },
  face: {
    flex: 1,
    borderRadius: FACE_RADIUS,
    padding: theme.spacing.four,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.three,
    overflow: 'hidden',
    // Same warm brown the tiles use. A warm shadow reads softer than pure black
    // on the paper background, and one shadow colour keeps every deck alike.
    shadowColor: '#2B1A0F',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  // Lit at the top, shaded at the bottom — the thickness cue.
  sheen: {
    ...StyleSheet.absoluteFillObject,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.95,
  },
  faceCopy: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: 4,
  },
  faceCount: {
    opacity: 0.9,
  },
  faceTagline: {
    opacity: 0.75,
  },
  selectPill: {
    alignSelf: 'stretch',
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
