import { useEffect, useMemo, useRef, useState } from 'react';
import { View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  clamp,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Defs, RadialGradient, Rect, Stop, Svg } from 'react-native-svg';
import { StyleSheet } from 'react-native-unistyles';

import { StorefrontCard } from '@/components/storefront-card';
import { deckTotalCopy, gradientFor, iconName, toneName } from '@/decks/art';
import type { DeckSummary } from '@/lib/decks';

/**
 * Coverflow carousel — the deck rail where the centred card sits flat and its
 * two neighbours swing away in 3D.
 *
 * Cards float in 3D: the centred one sits flat and full size, its two
 * neighbours swing away in rotateY and recede in scale, and anything past
 * them is gone. Depth, tilt, fade and the "cards nearer the centre are
 * on top" ordering are all derived from ONE shared float (the position along
 * the deck rail) on the UI thread, so a drag reads as a continuous sweep
 * rather than a series of steps.
 *
 * The rail is a float rather than a scroll offset because coverflow cards are
 * NOT laid out side by side — they are stacked and positioned by hand, so
 * there is nothing to scroll. Dragging moves the float directly; releasing
 * springs it to the nearest card, and a fast flick carries more than one.
 *
 * Only a window of cards around the centre is mounted. A card past 1.6 steps
 * is invisible, so a catalogue that grows to sixty decks must not cost sixty
 * mounted gradients and animated styles — the window is the whole point of
 * keeping this cheap as the library fills up.
 *
 * The concept's pointer glare becomes a press-and-hold one: a phone has no
 * hover, so the highlight lives for as long as a finger is down and eases away
 * on release. It belongs to the centred card only — in the concept both the
 * glare and the tilt are written to the centred card alone.
 */

const CARD_WIDTH = 210;
const CARD_HEIGHT = 300;
/** Lateral gap between the centred card and its immediate neighbour. */
const NEIGHBOUR_STEP = 118;
/** Each further neighbour tucks in behind the one before it. */
const DEEPER_TUCK = 52;
/** RotateY at full side position, degrees. */
const MAX_TILT = 46;
/** Recede at full side position, as a perspective divide. */
const MAX_DEPTH = 90;
const PERSPECTIVE = 1100;
/** Cards further from the centre than this are gone entirely. */
const HIDE_PAST = 1.6;
/** Opacity of a card sitting one step off centre, so the rail still reads as depth. */
const NEIGHBOUR_FADE = 0.82;
const MAX_TRACKED = 2.5;
/** Topmost stack level, and how much a card drops per step of distance. */
const Z_TOP = 100;
const Z_STEP = 10;
/** Cards mounted either side of the centre. One spare step of slack. */
const WINDOW = 2;
/** How far a finger must travel before a touch stops counting as a tap. */
const TAP_SLOP = 6;
/** Press-driven tilt at the far edge of the stage, degrees, from the concept. */
const PRESS_TILT_X = 12;
const PRESS_TILT_Y = 16;
/** How fast the glare blooms and lets go. */
const PRESS_IN = { duration: 120 };
const PRESS_OUT = { damping: 22, stiffness: 180, mass: 0.6 };
const RADIUS = 24;

const SPRING = { damping: 26, stiffness: 220, mass: 0.9 };

/**
 * Gesture worklets, kept at module scope and taking the shared values as
 * arguments. The gesture callbacks below would otherwise capture values that
 * the hooks lint rules treat as hook arguments (react-hooks/immutability);
 * passing them in keeps every write inside a plain worklet function.
 */
function beginPress(
  pos: SharedValue<number>,
  start: SharedValue<number>,
  touchX: SharedValue<number>,
  touchY: SharedValue<number>,
  strength: SharedValue<number>,
  moved: SharedValue<number>,
  x: number,
  y: number,
) {
  'worklet';
  start.value = pos.value;
  moved.value = 0;
  touchX.value = x;
  touchY.value = y;
  strength.value = withTiming(1, PRESS_IN);
}

function moveDrag(
  pos: SharedValue<number>,
  start: SharedValue<number>,
  touchX: SharedValue<number>,
  touchY: SharedValue<number>,
  strength: SharedValue<number>,
  moved: SharedValue<number>,
  translationX: number,
  translationY: number,
  count: number,
  x: number,
  y: number,
) {
  'worklet';
  pos.value = clamp(start.value - translationX / NEIGHBOUR_STEP, 0, count - 1);
  touchX.value = x;
  touchY.value = y;
  // Held at full while the finger moves: the glide should not flicker.
  strength.value = 1;
  if (
    moved.value === 0 &&
    (Math.abs(translationX) > TAP_SLOP || Math.abs(translationY) > TAP_SLOP)
  ) {
    moved.value = 1;
  }
}

function endDrag(
  pos: SharedValue<number>,
  velocityX: number,
  count: number,
  onActiveChange?: (index: number) => void,
) {
  'worklet';
  // A flick carries further than the card it started on, so the velocity
  // decides how many cards the spring travels to.
  const projected = pos.value - (velocityX / NEIGHBOUR_STEP) * 0.35;
  const target = Math.max(0, Math.min(count - 1, Math.round(projected)));
  pos.value = withSpring(target, SPRING);
  if (onActiveChange) runOnJS(onActiveChange)(target);
}

function releasePress(strength: SharedValue<number>) {
  'worklet';
  strength.value = withSpring(0, PRESS_OUT);
}

/** Spring the rail to a card. Module scope for the same reason as above. */
function springTo(pos: SharedValue<number>, target: number) {
  'worklet';
  pos.value = withSpring(target, SPRING);
}

export type CoverflowCarouselProps = {
  decks: DeckSummary[];
  /**
   * The card that should be centred. Dragging reports the settled index
   * through onActiveChange; changing this springs the rail to that card, so
   * the dot track can drive the deck without a swipe.
   */
  active?: number;
  /** Fires when a card settles as the centred one. */
  onActiveChange?: (index: number) => void;
  /** Fires when a card is tapped. */
  onCenterPress?: (index: number) => void;
};

function relationshipLabel(deck: DeckSummary): string {
  const rel = deck.relationship_type;
  if (rel === 'partner') return 'Partners';
  if (rel === 'family') return 'Family';
  if (rel === 'friend') return 'Friends';
  return 'Decks';
}

export function CoverflowCarousel({
  decks,
  active,
  onActiveChange,
  onCenterPress,
}: CoverflowCarouselProps) {
  const count = decks.length;
  const seed = clampIndex(active ?? 0, count);
  // The card keeps the concept's 7:10 face at every width — CARD_WIDTH and
  // CARD_HEIGHT are already that ratio, so one uniform scale holds it.
  const scale = Math.min(useWindowDimensions().width / 360, 1.1);
  const cardWidth = Math.round(CARD_WIDTH * scale);
  const cardHeight = Math.round(CARD_HEIGHT * scale);

  /** Position along the rail, as a float index. 1.5 = halfway between two. */
  const pos = useSharedValue(seed);
  /** Rail position at the moment the finger went down. */
  const start = useSharedValue(seed);
  /** Stage size, for turning a touch into a point on the centred card. */
  const stageW = useSharedValue(0);
  const stageH = useSharedValue(0);
  /** Finger position over the stage, and how hard the glare is lit. */
  const touchX = useSharedValue(0);
  const touchY = useSharedValue(0);
  const strength = useSharedValue(0);
  /**
   * Whether the current touch has travelled far enough to stop counting as a
   * tap. A card's Pressable reports its own tap, and when the rail hands a
   * gesture back to the scroll view — or simply has a finger travelling across
   * it — that Pressable still sees a release and would select the card the
   * user only meant to glance at or tilt.
   */
  const moved = useSharedValue(0);

  /**
   * Which card is centred, on the JS thread. It follows the rail through an
   * animated reaction rather than being read off the shared value during
   * render, which is what froze the paint order before. React only re-renders
   * when the nearest whole card changes, so a fast swipe costs one render per
   * card crossed.
   */
  const [windowAt, setWindowAt] = useState(seed);
  useAnimatedReaction(
    () => Math.round(pos.value),
    (now, prev) => {
      if (prev !== null && now !== prev) runOnJS(setWindowAt)(now);
    },
  );

  /**
   * A rail move requested from outside — the dot track, a filter narrowing the
   * list, a deck deep link — springs the rail to that card. The last index we
   * followed is remembered in a ref rather than state so a drag's own
   * settle (which reports through onActiveChange) does not restart the
   * spring it just began.
   */
  const followed = useRef(active);
  useEffect(() => {
    if (active === undefined) return;
    if (followed.current === active) return;
    followed.current = active;
    springTo(pos, clampIndex(active, count));
  }, [active, count, pos]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        // The rail lives inside the page's scroll view, so it has to claim the
        // gesture early — press-and-hold has to feel alive under a finger that
        // barely moves. An earlier attempt made activation directional
        // (activeOffsetX) and failed the gesture once the finger strayed
        // vertically; both left a dead zone where nothing responded, and the
        // release was then read as a tap on the card. Directional arbitration
        // between a rail and a parent scroll view needs a ref to that scroll
        // view, which this does not have.
        .minDistance(4)
        .onBegin((e) => beginPress(pos, start, touchX, touchY, strength, moved, e.x, e.y))
        .onUpdate((e) =>
          moveDrag(
            pos,
            start,
            touchX,
            touchY,
            strength,
            moved,
            e.translationX,
            e.translationY,
            count,
            e.x,
            e.y,
          ),
        )
        .onEnd((e) => endDrag(pos, e.velocityX, count, onActiveChange))
        .onFinalize(() => releasePress(strength)),
    [count, moved, onActiveChange, pos, start, strength, touchX, touchY],
  );

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    stageW.value = width;
    stageH.value = height;
  };

  const centre = clampIndex(windowAt, count);
  const from = Math.max(0, centre - WINDOW);
  const to = Math.min(count - 1, centre + WINDOW);
  const windowed = decks.slice(from, to + 1);

  return (
    <View style={[styles.stage, { height: cardHeight + 44 }]} onLayout={onLayout}>
      <GestureDetector gesture={pan}>
        <View style={styles.stageInner} collapsable={false}>
          {windowed.map((deck, i) => (
            <CarouselCard
              key={deck.id}
              deck={deck}
              index={from + i}
              centred={from + i === centre}
              pos={pos}
              stageW={stageW}
              stageH={stageH}
              touchX={touchX}
              touchY={touchY}
              strength={strength}
              width={cardWidth}
              height={cardHeight}
              onPress={() => {
                if (moved.value) return;
                onCenterPress?.(from + i);
              }}
            />
          ))}
        </View>
      </GestureDetector>
    </View>
  );
}

function CarouselCard({
  deck,
  index,
  centred,
  pos,
  stageW,
  stageH,
  touchX,
  touchY,
  strength,
  width,
  height,
  onPress,
}: {
  deck: DeckSummary;
  index: number;
  centred: boolean;
  pos: SharedValue<number>;
  stageW: SharedValue<number>;
  stageH: SharedValue<number>;
  touchX: SharedValue<number>;
  touchY: SharedValue<number>;
  strength: SharedValue<number>;
  width: number;
  height: number;
  onPress?: () => void;
}) {
  const reduced = useReducedMotion();

  const style = useAnimatedStyle(() => {
    // Distance from the centre of the rail, signed.
    const offset = index - pos.value;
    const dist = Math.abs(offset);
    const clamped = Math.min(dist, 1);

    // The first neighbour sits one full step away; every neighbour after that
    // tucks in by a smaller amount, so the rail compresses into the distance
    // instead of marching off screen.
    const x =
      Math.sign(offset) * (clamped * NEIGHBOUR_STEP + Math.max(dist - 1, 0) * DEEPER_TUCK);

    // The centred card stays flat; the tilt is capped just past one step so
    // distant cards never turn edge-on and vanish.
    const tilt = -Math.max(-1.1, Math.min(1.1, offset)) * MAX_TILT;

    // Emulate translateZ by dividing through the perspective, the same way a
    // real translateZ would foreshorten under this perspective.
    const recede = 1 / (1 + (Math.min(dist, MAX_TRACKED) * MAX_DEPTH) / PERSPECTIVE);

    // The concept leans the card away from the pointer, at most ±12° in and
    // ±16° across, and only on the centred card. Fading it with the press is
    // what makes it settle back when the finger lifts.
    let pressTiltX = 0;
    let pressTiltY = 0;
    if (centred && !reduced && stageW.value > 0 && stageH.value > 0) {
      const across = (touchX.value - stageW.value / 2) / stageW.value;
      const down = (touchY.value - stageH.value / 2) / stageH.value;
      pressTiltX = -down * PRESS_TILT_X * strength.value;
      pressTiltY = across * PRESS_TILT_Y * strength.value;
    }

    return {
      // The concept settles the paint order every frame from the live distance
      // to the centre, so the card nearest the centre is always on top even
      // mid-drag. Reading this during render froze the order between
      // re-renders, which is what let neighbours paint over the centred card.
      zIndex: Z_TOP - Math.round(dist * Z_STEP),
      opacity: interpolate(
        dist,
        [0, 1, HIDE_PAST],
        [1, NEIGHBOUR_FADE, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        { perspective: PERSPECTIVE },
        { translateX: x },
        { rotateY: `${tilt}deg` },
        { rotateX: `${pressTiltX}deg` },
        { rotateY: `${pressTiltY}deg` },
        { scale: recede },
      ],
    };
  });

  return (
    <Animated.View style={[styles.card, { width, height }, style]}>
      <StorefrontCard
        title={deck.title}
        meta={`${deckTotalCopy(deck).replace(' questions', '')} questions · ${relationshipLabel(deck)}`}
        icon={iconName(deck.icon)}
        colors={gradientFor(toneName(deck.tone))}
        style={{ width, height }}
        onPress={onPress}
        accessibilityLabel={`${deck.title}, ${deckTotalCopy(deck)}`}
      />
      {centred ? (
        <Glare
          touchX={touchX}
          touchY={touchY}
          strength={strength}
          stageW={stageW}
          stageH={stageH}
          width={width}
          height={height}
        />
      ) : null}
    </Animated.View>
  );
}

/**
 * The concept's pointer glare, rebuilt for a finger. A radial wash rides the
 * touch point for as long as it is held and eases out on release, clipped to
 * the card by its wrapper's radius. It is a real RadialGradient rather than a
 * plain view because expo-linear-gradient only draws linear ramps, and a
 * linear blob reads as a smear instead of a glow.
 *
 * The wash is drawn at twice the card's size with its centre pinned to the
 * touch, then clipped by the card. A blob sized to the card itself cannot
 * travel — its travel range is the difference between the two sizes, which is
 * almost nothing — and sizing it to something small would lose the broad falloff
 * the concept gets from its pointer-centred radial covering the whole face.
 */
function Glare({
  touchX,
  touchY,
  strength,
  stageW,
  stageH,
  width,
  height,
}: {
  touchX: SharedValue<number>;
  touchY: SharedValue<number>;
  strength: SharedValue<number>;
  stageW: SharedValue<number>;
  stageH: SharedValue<number>;
  width: number;
  height: number;
}) {
  const spanW = width * 2;
  const spanH = height * 2;
  // userSpaceOnUse with a pixel radius keeps the falloff a true circle. The
  // default objectBoundingBox units would stretch it into an ellipse.
  const radius = Math.min(spanW, spanH) / 2;

  const style = useAnimatedStyle(() => {
    // The card is centred in the stage, so its top-left corner is the stage's
    // centre less half the card. Dividing by the card turns the touch into a
    // point on its own face.
    const left = stageW.value / 2 - width / 2;
    const top = stageH.value / 2 - height / 2;
    const across = clamp((touchX.value - left) / width, 0, 1);
    const down = clamp((touchY.value - top) / height, 0, 1);

    return {
      opacity: strength.value,
      // Sliding by a whole card width puts the wash's centre on the touch for
      // the full range of the face, rather than only at one fixed spot.
      transform: [
        { translateX: across * width - width },
        { translateY: down * height - height },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.glare, { width: spanW, height: spanH }, style]}
    >
      <Svg width={spanW} height={spanH}>
        <Defs>
          <RadialGradient
            id="chaleCoverflowGlare"
            gradientUnits="userSpaceOnUse"
            cx={spanW / 2}
            cy={spanH / 2}
            r={radius}
          >
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.34} />
            <Stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0.14} />
            <Stop offset="0.75" stopColor="#FFFFFF" stopOpacity={0.03} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={spanW} height={spanH} fill="url(#chaleCoverflowGlare)" />
      </Svg>
    </Animated.View>
  );
}

function clampIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return Math.max(0, Math.min(count - 1, index));
}

const styles = StyleSheet.create(() => ({
  stage: {
    width: '100%',
    overflow: 'hidden',
  },
  stageInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    // Clips the glare to the face. The card draws its own radius inside, so
    // the two must agree.
    borderRadius: RADIUS,
    overflow: 'hidden',
  },
  glare: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
}));
