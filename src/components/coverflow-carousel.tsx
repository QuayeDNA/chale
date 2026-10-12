import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  clamp,
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
// Reanimated's own `runOnJS` is deprecated in favour of this one, which
// schedules the call on the React Native runtime instead of wrapping it.
import { scheduleOnRN } from 'react-native-worklets';
import { Defs, RadialGradient, Rect, Stop, Svg } from 'react-native-svg';
import { StyleSheet } from 'react-native-unistyles';

import { StorefrontCard } from '@/components/storefront-card';
import { deckTotalCopy, gradientFor, iconName, toneName } from '@/decks/art';
import type { DeckSummary } from '@/lib/decks';

/**
 * Coverflow carousel — performance pass.
 *
 * What changed, and why (see the notes delivered with this file):
 *
 *  1. Small catalogues mount every card once and never re-render on swipe.
 *     Windowing only kicks in past MOUNT_ALL_BELOW, and when it does the
 *     window is extended to the spring's TARGET the moment a flick is
 *     released, so the destination cards exist before the rail gets there.
 *  2. Every JS-side callback is stable. The pan gesture is no longer rebuilt
 *     whenever the parent re-renders (that re-attached the native handler
 *     mid-drag), and a drag's own settle no longer restarts the spring.
 *  3. ONE shared glare overlay, rasterised once, instead of an SVG remounted
 *     on whichever card became centred.
 *  4. Cards are GPU layers (renderToHardwareTextureAndroid / shouldRasterizeIOS)
 *     and no longer carry overflow:hidden + borderRadius, which forced an
 *     offscreen clip pass per card per frame under 3D transforms.
 *  5. Side cards' animated styles depend on `pos` only. Touch coordinates are
 *     no longer written during a swipe, so nothing but `pos` changes per frame.
 *  6. Cards are memoised and their derived props (meta, colours, icon) are
 *     computed once per deck rather than per render.
 */

const CARD_WIDTH = 210;
const CARD_HEIGHT = 300;
const NEIGHBOUR_STEP = 118;
const DEEPER_TUCK = 52;
const MAX_TILT = 46;
const MAX_DEPTH = 90;
const PERSPECTIVE = 1100;
const HIDE_PAST = 1.6;
const NEIGHBOUR_FADE = 0.82;
const MAX_TRACKED = 2.5;
const Z_TOP = 100;
const Z_STEP = 10;
/** Cards mounted either side of the centre/target when windowing is on. */
const WINDOW = 3;
/** At or below this many decks every card stays mounted: zero mount churn. */
const MOUNT_ALL_BELOW = 12;
const TAP_SLOP = 6;
const PRESS_TILT_X = 12;
const PRESS_TILT_Y = 16;
const PRESS_IN = { duration: 120 };
const PRESS_OUT = { damping: 22, stiffness: 180, mass: 0.6 };
const RADIUS = 24;
const SPRING = { damping: 26, stiffness: 220, mass: 0.9 };

type SV = SharedValue<number>;

function beginPress(
  pos: SV,
  start: SV,
  touchX: SV,
  touchY: SV,
  strength: SV,
  moved: SV,
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
  pos: SV,
  start: SV,
  touchX: SV,
  touchY: SV,
  strength: SV,
  moved: SV,
  translationX: number,
  translationY: number,
  count: number,
  x: number,
  y: number,
) {
  'worklet';
  pos.value = clamp(start.value - translationX / NEIGHBOUR_STEP, 0, count - 1);
  // Touch coordinates only matter while this is still a hold. Once the finger
  // is a swipe, writing them would re-run every glare/tilt mapper per frame
  // for a value nobody reads — so `pos` is the only thing that moves.
  if (moved.value === 0) {
    if (Math.abs(translationX) > TAP_SLOP || Math.abs(translationY) > TAP_SLOP) {
      moved.value = 1;
    } else {
      touchX.value = x;
      touchY.value = y;
    }
  }
  if (strength.value !== 1) strength.value = 1;
}

/**
 * The rail's settled index has to reach JS, but the handler that consumes it
 * closes over a ref, and a ref cannot be handed to a worklet from render. So
 * the latest handler lives in this module slot and the UI thread only ever
 * knows the name, never the ref behind it.
 */
let announce: (index: number) => void = () => {};

function announceFromRail(index: number) {
  'worklet';
  scheduleOnRN(announce, index);
}

function endDrag(pos: SV, velocityX: number, count: number) {
  'worklet';
  const projected = pos.value - (velocityX / NEIGHBOUR_STEP) * 0.35;
  const target = Math.max(0, Math.min(count - 1, Math.round(projected)));
  pos.value = withSpring(target, SPRING);
  // Tell JS the destination NOW, not when the spring lands, so the cards at
  // the far end are mounted before the rail arrives.
  announceFromRail(target);
}

/**
 * The stage measures itself into shared values the press tilt reads. Same rule
 * as above: they were handed to a hook earlier in the render, so they cannot be
 * written here — only passed along to a worklet.
 */
function measureStage(stageW: SV, stageH: SV, width: number, height: number) {
  'worklet';
  stageW.value = width;
  stageH.value = height;
}

function releasePress(strength: SV) {
  'worklet';
  strength.value = withSpring(0, PRESS_OUT);
}

function springTo(pos: SV, target: number) {
  'worklet';
  pos.value = withSpring(target, SPRING);
}

export type CoverflowCarouselProps = {
  decks: DeckSummary[];
  active?: number;
  onActiveChange?: (index: number) => void;
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
  const scale = Math.min(useWindowDimensions().width / 360, 1.1);
  const cardWidth = Math.round(CARD_WIDTH * scale);
  const cardHeight = Math.round(CARD_HEIGHT * scale);
  const reduced = useReducedMotion();

  const pos = useSharedValue(seed);
  const start = useSharedValue(seed);
  const stageW = useSharedValue(0);
  const stageH = useSharedValue(0);
  const touchX = useSharedValue(0);
  const touchY = useSharedValue(0);
  const strength = useSharedValue(0);
  const moved = useSharedValue(0);

  /**
   * Press tilt, computed ONCE per frame for the whole rail. The centred card
   * and the glare frame both read these; side cards just ignore them.
   */
  const tiltX = useDerivedValue(() => {
    if (reduced || stageH.value <= 0) return 0;
    const down = (touchY.value - stageH.value / 2) / stageH.value;
    return -down * PRESS_TILT_X * strength.value * (1 - moved.value);
  });
  const tiltY = useDerivedValue(() => {
    if (reduced || stageW.value <= 0) return 0;
    const across = (touchX.value - stageW.value / 2) / stageW.value;
    return across * PRESS_TILT_Y * strength.value * (1 - moved.value);
  });

  // --- stable JS-side callbacks ------------------------------------------
  const onActiveRef = useRef(onActiveChange);
  const onPressRef = useRef(onCenterPress);
  useEffect(() => {
    onActiveRef.current = onActiveChange;
    onPressRef.current = onCenterPress;
  });

  const windowed = count > MOUNT_ALL_BELOW;
  const [centre, setCentre] = useState(seed);
  const [target, setTarget] = useState(seed);

  /** The last index we told / were told about, so echoes do not re-spring. */
  const followed = useRef(active);

  const settle = useCallback((index: number) => {
    // Record BEFORE telling the parent. The parent will feed `index` back as
    // `active`; without this the effect below saw a "new" value and started a
    // second spring on top of the one already running, which is the stutter
    // at the end of every swipe.
    followed.current = index;
    setTarget(index);
    onActiveRef.current?.(index);
  }, []);

  // Publish it for the rail's worklet, which cannot be handed a ref.
  useEffect(() => {
    announce = settle;
  }, [settle]);

  const handlePress = useCallback(
    (index: number) => {
      if (moved.value) return;
      onPressRef.current?.(index);
    },
    [moved],
  );

  // JS only hears about the nearest card when it actually needs a window.
  useAnimatedReaction(
    () => (windowed ? Math.round(pos.value) : -1),
    (now, prev) => {
      if (now >= 0 && now !== prev) scheduleOnRN(setCentre, now);
    },
    [windowed],
  );

  useEffect(() => {
    if (active === undefined) return;
    if (followed.current === active) return;
    followed.current = active;
    const t = clampIndex(active, count);
    setTarget(t);
    springTo(pos, t);
  }, [active, count, pos]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
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
        .onEnd((e) => endDrag(pos, e.velocityX, count))
        .onFinalize(() => releasePress(strength)),
    // Every dependency is stable except `count`, so the native handler is only
    // re-attached when the deck list genuinely changes length.
    [count, moved, pos, start, strength, touchX, touchY],
  );

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      measureStage(stageW, stageH, width, height);
    },
    [stageH, stageW],
  );

  const lo = windowed ? Math.max(0, Math.min(centre, target) - WINDOW) : 0;
  const hi = windowed ? Math.min(count - 1, Math.max(centre, target) + WINDOW) : count - 1;
  const mounted = windowed ? decks.slice(lo, hi + 1) : decks;

  return (
    <View style={[styles.stage, { height: cardHeight + 44 }]} onLayout={onLayout}>
      <GestureDetector gesture={pan}>
        <View style={styles.stageInner} collapsable={false}>
          {mounted.map((deck, i) => (
            <CarouselCard
              key={deck.id}
              deck={deck}
              index={lo + i}
              pos={pos}
              tiltX={tiltX}
              tiltY={tiltY}
              width={cardWidth}
              height={cardHeight}
              onPressIndex={handlePress}
            />
          ))}
          {count > 0 ? (
            <Glare
              touchX={touchX}
              touchY={touchY}
              strength={strength}
              moved={moved}
              stageW={stageW}
              stageH={stageH}
              tiltX={tiltX}
              tiltY={tiltY}
              width={cardWidth}
              height={cardHeight}
            />
          ) : null}
        </View>
      </GestureDetector>
    </View>
  );
}

type CardProps = {
  deck: DeckSummary;
  index: number;
  pos: SV;
  tiltX: SV;
  tiltY: SV;
  width: number;
  height: number;
  onPressIndex: (index: number) => void;
};

const CarouselCard = memo(function CarouselCard({
  deck,
  index,
  pos,
  tiltX,
  tiltY,
  width,
  height,
  onPressIndex,
}: CardProps) {
  // Derived once per deck, not once per render.
  const art = useMemo(
    () => ({
      meta: `${deckTotalCopy(deck).replace(' questions', '')} questions · ${relationshipLabel(deck)}`,
      icon: iconName(deck.icon),
      colors: gradientFor(toneName(deck.tone)),
      label: `${deck.title}, ${deckTotalCopy(deck)}`,
    }),
    [deck],
  );
  const size = useMemo(() => ({ width, height }), [width, height]);
  const press = useCallback(() => onPressIndex(index), [onPressIndex, index]);

  const style = useAnimatedStyle(() => {
    const offset = index - pos.value;
    const dist = Math.abs(offset);
    const clamped = Math.min(dist, 1);

    const x =
      Math.sign(offset) * (clamped * NEIGHBOUR_STEP + Math.max(dist - 1, 0) * DEEPER_TUCK);
    const tilt = -Math.max(-1.1, Math.min(1.1, offset)) * MAX_TILT;
    const recede = 1 / (1 + (Math.min(dist, MAX_TRACKED) * MAX_DEPTH) / PERSPECTIVE);

    // Only the card at the centre leans under a finger.
    const lean = dist < 0.5 ? 1 : 0;

    return {
      zIndex: Z_TOP - Math.round(dist * Z_STEP),
      opacity: interpolate(dist, [0, 1, HIDE_PAST], [1, NEIGHBOUR_FADE, 0], Extrapolation.CLAMP),
      transform: [
        { perspective: PERSPECTIVE },
        { translateX: x },
        { rotateY: `${tilt}deg` },
        { rotateX: `${tiltX.value * lean}deg` },
        { rotateY: `${tiltY.value * lean}deg` },
        { scale: recede },
      ],
    };
  });

  return (
    <Animated.View
      style={[styles.card, size, style]}
      // Rasterise the face once; the per-frame transform/opacity then move a
      // texture instead of re-compositing a gradient + icon + text subtree.
      renderToHardwareTextureAndroid
      shouldRasterizeIOS
    >
      <StorefrontCard
        title={deck.title}
        meta={art.meta}
        icon={art.icon}
        colors={art.colors}
        style={size}
        onPress={press}
        accessibilityLabel={art.label}
      />
    </Animated.View>
  );
});

/**
 * One glare for the whole rail. It only ever shows on the centred card, and
 * the centred card is at the stage centre whenever a finger is held still, so
 * a single overlay pinned there does the job — no per-card mount, no SVG
 * remount when the centre changes. The gradient is drawn once and kept as a
 * GPU texture; the per-frame work is a translate and an opacity.
 */
const Glare = memo(function Glare({
  touchX,
  touchY,
  strength,
  moved,
  stageW,
  stageH,
  tiltX,
  tiltY,
  width,
  height,
}: {
  touchX: SV;
  touchY: SV;
  strength: SV;
  moved: SV;
  stageW: SV;
  stageH: SV;
  tiltX: SV;
  tiltY: SV;
  width: number;
  height: number;
}) {
  const spanW = width * 2;
  const spanH = height * 2;
  const radius = Math.min(spanW, spanH) / 2;
  const size = useMemo(() => ({ width, height }), [width, height]);
  const span = useMemo(() => ({ width: spanW, height: spanH }), [spanW, spanH]);

  // The frame follows the centred card's press tilt so the glare stays glued
  // to its face, and carries the fade.
  const frameStyle = useAnimatedStyle(() => ({
    opacity: strength.value * (1 - moved.value),
    transform: [
      { perspective: PERSPECTIVE },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
    ],
  }));

  const glareStyle = useAnimatedStyle(() => {
    const left = stageW.value / 2 - width / 2;
    const top = stageH.value / 2 - height / 2;
    const across = clamp((touchX.value - left) / width, 0, 1);
    const down = clamp((touchY.value - top) / height, 0, 1);
    return {
      transform: [{ translateX: across * width - width }, { translateY: down * height - height }],
    };
  });

  return (
    <Animated.View pointerEvents="none" style={[styles.glareFrame, size, frameStyle]}>
      <Animated.View
        style={[styles.glare, span, glareStyle]}
        renderToHardwareTextureAndroid
        shouldRasterizeIOS
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
    </Animated.View>
  );
});

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
  // No overflow:hidden / borderRadius here any more. StorefrontCard clips its
  // own face, and a rounded clip on a 3D-transformed, fading view is an
  // offscreen pass per card per frame.
  card: {
    position: 'absolute',
  },
  // The glare frame is the only clip, and it is only visible while pressed.
  glareFrame: {
    position: 'absolute',
    zIndex: Z_TOP + 20,
    borderRadius: RADIUS,
    overflow: 'hidden',
  },
  glare: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
}));