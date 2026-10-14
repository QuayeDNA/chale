import { useState } from 'react';
import { Pressable } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { LucideIcon } from './ui/icon';
import { Text } from './ui/text';

/** Worklet so the write is a UI-thread animation, never a render-phase side effect. */
function popHeart(pop: SharedValue<number>) {
  'worklet';
  // Overshoot and settle: small enough to read as a tick, not a bounce.
  pop.value = withSequence(
    withTiming(1.3, { duration: 110 }),
    withSpring(1, { damping: 9, stiffness: 320 }),
  );
}

/**
 * The save-this-question row, shared by every surface that shows a question
 * (in-person session today, the remote card next).
 *
 * Optimistic by design: the heart flips the instant the row is pressed,
 * before the network round-trip, and a tap while a press is in flight is
 * ignored — the failing mode used to be a greyed-out row that looked inert
 * on a slow connection, prompting the extra presses that raced each other
 * and wrote the wrong state.
 *
 * The pop is the confirmation the flip worked: a quick overshoot on the
 * heart, skipped entirely when reduced motion is on.
 */
export function FavouriteButton({
  isFavourite,
  onToggle,
}: {
  isFavourite: boolean;
  onToggle: () => void | Promise<void>;
}) {
  const { theme } = useUnistyles();
  const reduceMotion = useReducedMotion();
  const [busy, setBusy] = useState(false);
  /** Instant feedback, dropped as soon as the server's truth agrees. */
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const saved = optimistic ?? isFavourite;

  const pop = useSharedValue(1);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }],
  }));

  const press = async () => {
    if (busy) return;
    const next = !saved;
    setOptimistic(next);
    setBusy(true);
    if (next && !reduceMotion) popHeart(pop);
    try {
      await onToggle();
    } finally {
      setBusy(false);
      // Whatever the server settled on is the truth; the override only had
      // to bridge the round-trip.
      setOptimistic(null);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={saved ? 'Saved to favourites' : 'Save this question'}
      accessibilityState={{ selected: saved, disabled: busy }}
      disabled={busy}
      hitSlop={8}
      onPress={() => void press()}
      style={({ pressed }) => [
        styles.row,
        saved && { backgroundColor: 'rgba(216, 90, 48, 0.10)' },
        pressed && styles.pressed,
      ]}>
      <Animated.View style={heartStyle}>
        <LucideIcon
          name="heart"
          size={20}
          color={saved ? theme.relationship.partner.accent : theme.colors.muted}
          filled={saved}
        />
      </Animated.View>
      <Text
        variant="bodyStrong"
        style={[styles.label, { color: theme.colors.muted }]}
        numberOfLines={1}>
        {saved ? 'Saved to favourites' : 'Save this question'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: theme.radii.pill,
  },
  pressed: {
    opacity: 0.6,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
  },
}));
