import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

type Props = {
  count: number;
  active: number;
  onSelect: (index: number) => void;
};

const DOT = 6;
const PILL = 20;
/** Padding on each dot's hit box, which is what insets the dot inside it. */
const HIT_PAD = 6;
/** How far the pill has to travel off a dot before the dot reappears. */
const REVEAL = 4;
const SPRING = { damping: 32, stiffness: 350, mass: 1 };

/**
 * Dot pager for the coverflow carousel. One street-gold pill springs between
 * the dots instead of each dot growing in place — the same movement as the
 * tab bar's indicator and the segmented control: measured layouts, the first
 * measure placed with no animation, later changes retarget mid-flight.
 *
 * A dot fades out as the pill passes over it. The pill is painted first, so a
 * plain background colour would not hide the dot underneath it — later
 * siblings draw on top — and hiding the selected dot in React would break the
 * moment the pill is still travelling over it. So each dot reads the pill's
 * live position on the UI thread and fades itself, which means the bar always
 * covers the dot it is passing, wherever it happens to be.
 */
export function DotPager({ count, active, onSelect }: Props) {
  const [layouts, setLayouts] = useState<Record<number, number>>({});
  const pillX = useSharedValue(0);
  const placed = useRef(false);

  const targetX = layouts[active];

  useEffect(() => {
    if (targetX === undefined) return;
    if (!placed.current) {
      pillX.value = targetX;
      placed.current = true;
    } else {
      pillX.value = withSpring(targetX, SPRING);
    }
  }, [targetX, pillX]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
  }));

  if (count <= 0) return null;

  return (
    <View accessibilityRole="tablist" style={styles.dots}>
      <Animated.View pointerEvents="none" style={[styles.pill, pillStyle]} />
      {Array.from({ length: count }, (_, i) => (
        <Pressable
          key={i}
          accessibilityRole="tab"
          accessibilityState={{ selected: i === active }}
          accessibilityLabel={`Deck ${i + 1}`}
          hitSlop={8}
          onPress={() => onSelect(i)}
          onLayout={(e) => {
            const { x } = e.nativeEvent.layout;
            setLayouts((prev) => (prev[i] === x ? prev : { ...prev, [i]: x }));
          }}
          style={styles.hit}
        >
          <PagerDot x={layouts[i]} pillX={pillX} selected={i === active} />
        </Pressable>
      ))}
    </View>
  );
}

function PagerDot({
  x,
  pillX,
  selected,
}: {
  x?: number;
  pillX: SharedValue<number>;
  selected: boolean;
}) {
  const style = useAnimatedStyle(() => {
    // Before the first measure, fall back to the selected dot being hidden.
    if (x === undefined) return { opacity: selected ? 0 : 1 };
    // The pill's centre and the dot's centre share the same offset inside
    // their boxes, so how far apart they are is just |x - pillX|.
    const away = Math.abs(x - pillX.value);
    return {
      opacity: interpolate(
        away,
        [PILL / 2, PILL / 2 + REVEAL],
        [0, 1],
        Extrapolation.CLAMP,
      ),
    };
  });

  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create((theme) => ({
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    paddingVertical: theme.spacing.two,
  },
  hit: {
    padding: HIT_PAD,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: 3,
    backgroundColor: theme.colors.border,
  },
  /**
   * Sits behind the dots. Both offsets are measured from the row's padding
   * box: the dot sits HIT_PAD inside its hit box, which itself starts one
   * vertical padding below the row, and the pill is (PILL - DOT) / 2 wider
   * than the dot on each side — hence -1 on the left. The top is explicit
   * because an absolutely positioned view with no top lands below the row
   * instead of on the dot line.
   */
  pill: {
    position: 'absolute',
    left: HIT_PAD - (PILL - DOT) / 2,
    top: theme.spacing.two + HIT_PAD,
    width: PILL,
    height: DOT,
    borderRadius: 3,
    backgroundColor: theme.colors.street,
  },
}));
