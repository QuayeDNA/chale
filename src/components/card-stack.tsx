import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type EasingFunction,
  type EasingFunctionFactory,
  type SharedValue,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

/**
 * A deck of cards you move through, driven by ONE float.
 *
 * `p` is the position along the deck (1.0 = on card 1, 1.5 = halfway to card
 * 2). Every card derives its whole pose from `index - p` on the UI thread:
 *
 *   offset  0     the front card, flat and full size
 *   offset  > 0   still in the deck: smaller, lifted, fanned, shaded
 *   offset  < 0   already dealt: flies off to the left, turning and fading
 *
 * Because it is one float, three things come for free:
 *  - Buttons and swipes are the SAME animation. A drag writes `p` directly, so
 *    the dealt card tracks the finger 1:1, and release springs it on.
 *  - Going back is the same animation in reverse.
 *  - A new target mid-flight re-aims from wherever `p` is, so rapid taps glide.
 *
 * Cards are never mounted or unmounted DURING a move: the neighbours are
 * already there. Cards deeper in the deck than the first one behind are cheap
 * empty shells (they are mostly hidden anyway) and only fill in after a move
 * settles.
 */

export type StackPreset = {
  /** Milliseconds for a button-driven move. */
  duration: number;
  /** Cubic-bezier control points. */
  ease: readonly [number, number, number, number];
  /** How far a dealt card travels, as a fraction of the screen width. */
  shift: number;
  /** Degrees a dealt card turns on its way out. */
  tilt: number;
  /** Points each card behind sits lower than the one in front of it. */
  lift: number;
  /** Fraction each card behind shrinks by, per step back. */
  scale: number;
  /** How many cards are visible behind the front one. */
  depth: number;
  /** Darkening per step back (0–1), so the deck reads as depth. */
  shade: number;
  /** Alternating tilt, in degrees, of the cards waiting in the deck. */
  fan: number;
};

export const STACK_PRESETS: Record<'deal' | 'deeper' | 'written', StackPreset> = {
  // The one from the transition lab. A loose, fanned pile; the dealt card
  // flies further and spins more.
  deal: {
    duration: 500,
    ease: [0.22, 1, 0.36, 1],
    shift: 1.15,
    tilt: 15,
    lift: 30,
    scale: 0.07,
    depth: 2,
    shade: 0.08,
    fan: 3,
  },
  deeper: {
    duration: 520,
    ease: [0.22, 1, 0.36, 1],
    shift: 1,
    tilt: 9,
    lift: 22,
    scale: 0.05,
    depth: 3,
    shade: 0.07,
    fan: 0,
  },
  written: {
    duration: 460,
    ease: [0.22, 1, 0.36, 1],
    shift: 0.9,
    tilt: 7,
    lift: 24,
    scale: 0.06,
    depth: 1,
    shade: 0,
    fan: 0,
  },
};

export type StackPresetName = keyof typeof STACK_PRESETS;

/**
 * Multiplies every duration. Set to 4 while tuning to watch a move in slow
 * motion on a real device, and back to 1 before shipping.
 */
const TIME_SCALE = 1;
/** With reduced motion on, cards cross-fade this fast instead of travelling. */
const REDUCED_MS = 160;
/** How hard a flick carries: seconds of release velocity added to the drop. */
const FLICK = 0.22;
/** Resistance past the first or last card; 1 would be no resistance at all. */
const RUBBER = 0.3;
/** A card that mounts later eases in over this long. */
const MOUNT_MS = 240;
const EDGE_PAD = 8;

type Props = {
  /** The card that should be at the front. Changing it plays the move. */
  index: number;
  count: number;
  keyFor: (index: number) => string;
  renderCard: (index: number) => ReactNode;
  /**
   * Called when a swipe settles on a different card. The stack is controlled:
   * pass the new index back in as `index`.
   */
  onIndexChange?: (index: number) => void;
  /** Called once per move, as it starts. Good place for a haptic tick. */
  onStep?: (index: number) => void;
  preset?: StackPresetName | StackPreset;
};

/** Plain functions so the hooks lint does not flag the shared-value writes. */
function glideTo(
  p: SharedValue<number>,
  target: number,
  duration: number,
  easing: EasingFunction | EasingFunctionFactory,
  done: (i: number) => void,
) {
  p.value = withTiming(target, { duration, easing }, (finished) => {
    'worklet';
    if (finished) runOnJS(done)(target);
  });
}

function fadeIn(v: SharedValue<number>) {
  v.value = withTiming(1, { duration: MOUNT_MS });
}

function rubber(raw: number, max: number) {
  'worklet';
  if (raw < 0) return raw * RUBBER;
  if (raw > max) return max + (raw - max) * RUBBER;
  return raw;
}

type EasePts = readonly [number, number, number, number];

function beginStackDrag(
  dragging: SharedValue<boolean>,
  p: SharedValue<number>,
  base: SharedValue<number>,
) {
  'worklet';
  dragging.value = true;
  cancelAnimation(p);
  base.value = p.value;
}

function moveStackDrag(
  p: SharedValue<number>,
  base: SharedValue<number>,
  translationX: number,
  step: number,
  max: number,
) {
  'worklet';
  // Dividing by the step means the dealt card tracks the finger exactly: it
  // travels `shift` screen-widths per card.
  p.value = rubber(base.value - translationX / step, max);
}

function endStackDrag(
  p: SharedValue<number>,
  base: SharedValue<number>,
  dragging: SharedValue<boolean>,
  velocityX: number,
  step: number,
  max: number,
  durationMs: number,
  easePts: EasePts,
): number {
  'worklet';
  dragging.value = false;
  const from = Math.round(base.value);
  const projected = p.value - (velocityX / step) * FLICK;
  // One card per swipe, however hard the flick.
  const target = Math.max(
    0,
    Math.min(max, Math.max(from - 1, Math.min(from + 1, Math.round(projected)))),
  );
  const travel = Math.abs(target - p.value);
  p.value = withTiming(target, {
    duration: Math.max(220, durationMs * Math.min(1, travel + 0.15)),
    easing: Easing.bezier(easePts[0], easePts[1], easePts[2], easePts[3]),
  });
  // The destination returns to the gesture, which hands it to JS. Announcing
  // from in here through a module slot cannot work: the UI runtime keeps its
  // own copy of module state, so it would forever call the initial no-op
  // published before any effect ran.
  return target;
}

function finalizeStackDrag(
  p: SharedValue<number>,
  dragging: SharedValue<boolean>,
  max: number,
  easePts: EasePts,
): number {
  'worklet';
  // The system took the touch away mid-drag: settle on the nearest card.
  if (dragging.value) {
    dragging.value = false;
    const target = Math.max(0, Math.min(max, Math.round(p.value)));
    p.value = withTiming(target, {
      duration: 260,
      easing: Easing.bezier(easePts[0], easePts[1], easePts[2], easePts[3]),
    });
    return target;
  }
  // onEnd already reported: nothing new to tell JS.
  return -1;
}

export function CardStack({
  index,
  count,
  keyFor,
  renderCard,
  onIndexChange,
  onStep,
  preset = 'deal',
}: Props) {
  const cfg = typeof preset === 'string' ? STACK_PRESETS[preset] : preset;
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();

  const p = useSharedValue(index);
  /** `p` at the moment a drag took hold. */
  const base = useSharedValue(index);
  /** Whether a drag is in progress, so a plain tap never interrupts a move. */
  const dragging = useSharedValue(false);

  /** The card that is, or has finished becoming, the front one. */
  const [shown, setShown] = useState(index);
  const [frontH, setFrontH] = useState(0);
  /** Where `p` is headed, so a swipe's own echo does not restart its move. */
  const aimed = useRef(index);

  const onStepRef = useRef(onStep);
  const onIndexRef = useRef(onIndexChange);
  useEffect(() => {
    onStepRef.current = onStep;
    onIndexRef.current = onIndexChange;
  });

  const ease = useMemo(() => Easing.bezier(...cfg.ease), [cfg.ease]);
  const duration = (reduced ? REDUCED_MS : cfg.duration) * TIME_SCALE;

  useEffect(() => {
    if (__DEV__) {
      // If every move on a device looks instant, check this line first: with
      // "Remove animations" (or an animator scale of 0) on, the system asks
      // for reduced motion and the travel is replaced by a short cross-fade.
      console.log('[CardStack] reduced motion:', reduced);
    }
  }, [reduced]);

  // A move requested from outside: the buttons, the progress rail, a restore.
  useEffect(() => {
    if (aimed.current === index) return;
    aimed.current = index;
    onStepRef.current?.(index);
    glideTo(p, index, duration, ease, setShown);
  }, [index, duration, ease, p]);

  // A swipe has chosen its card. This closes over nothing but the state
  // dispatcher, so the gesture below can hold it in its closure and hand the
  // destination to JS with runOnJS — the same crossing glideTo uses for its
  // `done`. Mount the destination now: the timing lands a moment later.
  const reportSettle = useCallback((target: number) => {
    setShown(target);
  }, []);

  // `shown` moved without `index` moving yet: a swipe has landed. Do the rest
  // of the settle here on the JS thread — record it BEFORE telling the
  // parent, so the echoed `index` reads as already on its way rather than
  // starting a second move on top.
  useEffect(() => {
    if (shown === aimed.current) return;
    aimed.current = shown;
    onStepRef.current?.(shown);
    onIndexRef.current?.(shown);
  }, [shown]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!reduced)
        // Horizontal only. The stack sits in a scrolling screen, so a mostly
        // vertical drag must fail here and scroll the page instead.
        .activeOffsetX([-10, 10])
        .failOffsetY([-18, 18])
        .onStart(() => beginStackDrag(dragging, p, base))
        .onUpdate((e) => moveStackDrag(p, base, e.translationX, width * cfg.shift, count - 1))
        .onEnd((e) => {
          const target = endStackDrag(
            p,
            base,
            dragging,
            e.velocityX,
            width * cfg.shift,
            count - 1,
            duration,
            cfg.ease,
          );
          runOnJS(reportSettle)(target);
        })
        .onFinalize(() => {
          const target = finalizeStackDrag(p, dragging, count - 1, cfg.ease);
          if (target >= 0) runOnJS(reportSettle)(target);
        }),
    // Shared values are stable, the settle reporter never changes identity,
    // and every other argument is a number or plain data, so the native
    // handler re-attaches only when the layout or the deck itself changes.
    [base, count, cfg.ease, cfg.shift, dragging, duration, p, reduced, reportSettle, width],
  );

  const onFrontLayout = useCallback((e: LayoutChangeEvent) => {
    setFrontH(Math.round(e.nativeEvent.layout.height));
  }, []);

  // Both ends of any move in flight stay mounted, plus however many cards are
  // visible behind. At rest that is the dealt one, the front, and `depth` more.
  const lo = Math.max(0, Math.min(shown, index) - 1);
  const hi = Math.min(count - 1, Math.max(shown, index) + cfg.depth);
  const indices: number[] = [];
  for (let i = lo; i <= hi; i += 1) indices.push(i);

  const settled = shown === index;
  // Room under the stack for the deck edges, so they never touch what follows.
  const edgeRoom =
    Math.round(cfg.depth * Math.max(cfg.lift - (frontH * cfg.scale) / 2, 0)) + EDGE_PAD;

  return (
    <GestureDetector gesture={pan}>
      <View style={[styles.stack, { paddingBottom: edgeRoom }]} collapsable={false}>
        {indices.map((i) => {
          // Real content for the neighbours of the front card and for any card
          // a move is heading to. Everything deeper is an empty shell: it is
          // mostly hidden, and a QuestionCard each would be a lot to mount.
          const real = Math.abs(i - shown) <= 1 || i === index;
          return (
            <StackLayer
              key={keyFor(i)}
              index={i}
              p={p}
              width={width}
              cfg={cfg}
              reduced={reduced}
              inFlow={i === shown}
              active={settled && i === shown}
              onLayout={i === shown ? onFrontLayout : undefined}
            >
              {real ? renderCard(i) : <View style={[styles.ghost, { height: frontH }]} />}
            </StackLayer>
          );
        })}
      </View>
    </GestureDetector>
  );
}

const StackLayer = memo(function StackLayer({
  index,
  p,
  width,
  cfg,
  reduced,
  inFlow,
  active,
  onLayout,
  children,
}: {
  index: number;
  p: SharedValue<number>;
  width: number;
  cfg: StackPreset;
  reduced: boolean;
  inFlow: boolean;
  active: boolean;
  onLayout?: (e: LayoutChangeEvent) => void;
  children: ReactNode;
}) {
  const { shift, tilt, lift, scale, depth, shade, fan } = cfg;
  const mount = useSharedValue(0);
  useEffect(() => {
    fadeIn(mount);
  }, [mount]);

  const style = useAnimatedStyle(() => {
    const o = index - p.value;
    const m = mount.value;

    if (reduced) {
      // Cross-fade only: nothing travels, so nothing can be nauseating.
      return {
        zIndex: Math.abs(o) < 0.5 ? 30 : 10,
        opacity: Math.max(0, 1 - Math.abs(o)) * m,
        transform: [{ translateX: 0 }],
      };
    }

    let tx = 0;
    let ty = 0;
    let rot = 0;
    let sc = 1;
    let op = 1;
    let z = 30;

    if (o >= 0) {
      // Still in the deck.
      const t = Math.min(o, depth);
      sc = 1 - scale * t;
      ty = lift * t;
      // Alternating fan, easing to flat as the card comes to the front.
      rot = (index % 2 ? 1 : -1) * fan * Math.min(o, 1);
      op = o <= depth ? 1 : Math.max(0, 1 - (o - depth) * 2.5);
      z = 20 - Math.min(Math.round(o * 4), 16);
    } else {
      // Already dealt.
      const t = Math.min(-o, 1);
      tx = -t * width * shift;
      ty = -10 * t;
      rot = -t * tilt;
      sc = 1 - 0.03 * t;
      op = Math.max(0, 1 - t * 1.25);
    }

    return {
      zIndex: z,
      opacity: op * m,
      transform: [
        { translateX: tx },
        { translateY: ty + (1 - m) * 10 },
        { rotate: `${rot}deg` },
        { scale: sc },
      ],
    };
  });

  const shadeStyle = useAnimatedStyle(() => {
    const o = index - p.value;
    if (reduced || o <= 0 || shade === 0) return { opacity: 0 };
    const t = Math.min(o, depth + 1);
    return { opacity: Math.min(1, t) * shade + Math.max(0, t - 1) * shade * 1.2 };
  });

  return (
    <Animated.View
      style={[inFlow ? styles.flow : styles.layer, style]}
      onLayout={onLayout}
      // Only the settled front card can be touched or read by a screen reader.
      pointerEvents={active ? 'auto' : 'none'}
      accessibilityElementsHidden={!active}
      importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}
      // Drawn once, then moved as a texture.
      renderToHardwareTextureAndroid
      shouldRasterizeIOS
    >
      {children}
      <Animated.View pointerEvents="none" style={[styles.shade, shadeStyle]} />
    </Animated.View>
  );
});

const styles = StyleSheet.create((theme) => ({
  stack: {},
  flow: {
    position: 'relative',
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  // Darkens a card that is further back. Same radius as the card it covers.
  shade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: theme.radii.hero,
    backgroundColor: theme.colors.ink,
  },
  // Stands in for a card that is too deep in the deck to be worth rendering.
  ghost: {
    borderRadius: theme.radii.hero,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
}));