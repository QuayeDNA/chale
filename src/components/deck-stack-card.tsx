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
 * Board §05 "Deck Card" — a deck dealt as a small stack: the deck's own fill on
 * the face, and two edges peeking out behind it, offset down and to the left.
 * That layering IS the 3D read. There is no perspective transform, so it renders
 * identically on iOS and Android.
 *
 * "Orbit" comes from scroll, not gesture state. As a card leaves centre its
 * layers splay further apart and the face tips, so paging the carousel reads as
 * pulling a card out of a spread. Every value below is derived from one shared
 * scroll offset on the UI thread; the JS thread never participates.
 */

const LAYERS = 2;
const FACE_RADIUS = 24;
const LAYER_RADIUS = 22;

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
  const height = Math.round(width * 1.38);

  const progress = useCardProgress(scrollX, index, step);

  const faceStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const abs = Math.abs(p);
    return {
      transform: [
        { translateX: p * step * 0.44 },
        { rotate: `${p * 15}deg` },
        { scale: 1 - abs * 0.1 },
      ],
      opacity: 1 - abs * 0.45,
    };
  });

  return (
    <View style={[styles.slot, { width }]}>
      {Array.from({ length: LAYERS }, (_, i) => (
        <StackLayer key={i} layer={i} progress={progress} ink={ink} width={width} height={height} />
      ))}

      <Animated.View style={[styles.faceWrap, { width, height }, faceStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${deck.title}, ${deckTotalCopy(deck)}`}
          onPress={onPress}
          style={({ pressed }) => [
            styles.face,
            { backgroundColor: fill, shadowColor: fill },
            pressed && styles.pressed,
          ]}
        >
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

/** One card edge behind the face, splaying further as the card leaves centre. */
function StackLayer({
  layer,
  progress,
  ink,
  width,
  height,
}: {
  layer: number;
  progress: SharedValue<number>;
  ink: string;
  width: number;
  height: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const abs = Math.abs(progress.value);
    const fan = 8 + abs * 16; // dealt tight when centred, splayed in motion
    const reach = (layer + 1) * fan;
    return {
      transform: [
        { translateX: -reach },
        { translateY: reach * 0.72 },
        { rotate: `${-reach * 0.3}deg` },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.layer,
        { width, height, borderColor: ink, opacity: 0.5 - layer * 0.12 },
        animatedStyle,
      ]}
    />
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
    // Board deck card carries the lg shadow in its own fill colour.
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  pressed: {
    opacity: 0.9,
  },
  layer: {
    position: 'absolute',
    borderRadius: LAYER_RADIUS,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
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
