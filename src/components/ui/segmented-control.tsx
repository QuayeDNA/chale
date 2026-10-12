import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { LucideIcon, type ShowcaseIconName } from '@/components/ui/icon';

export type SegmentOption<T extends string> = {
  value: T;
  icon: ShowcaseIconName;
  label: string;
};

type Props<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

const SPRING = { damping: 32, stiffness: 350, mass: 1 };

/**
 * Icon-only segmented switcher — the view toggle for catalogue screens
 * (flow / grid / list). A single ink pill springs to the active segment,
 * the same movement as the tab bar's indicator: measured layouts, first
 * measure placed with no animation, later changes retarget mid-flight.
 */
export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const { theme } = useUnistyles();
  const [layouts, setLayouts] = useState<Record<string, { x: number; width: number }>>({});
  const pillX = useSharedValue(0);
  const pillWidth = useSharedValue(0);
  const placed = useRef(false);

  const target = layouts[value];

  useEffect(() => {
    if (!target) return;
    if (!placed.current) {
      pillX.value = target.x;
      pillWidth.value = target.width;
      placed.current = true;
    } else {
      pillX.value = withSpring(target.x, SPRING);
      pillWidth.value = withSpring(target.width, SPRING);
    }
  }, [target, pillX, pillWidth]);

  const pillStyle = useAnimatedStyle(() => ({
    width: pillWidth.value,
    transform: [{ translateX: pillX.value }],
  }));

  return (
    <View style={styles.group} accessibilityRole="radiogroup">
      {/* Width 0 until the first measure lands, so no flash. */}
      <Animated.View style={[styles.pill, pillStyle]} />
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              setLayouts((prev) => {
                const existing = prev[option.value];
                if (existing && existing.x === x && existing.width === width) return prev;
                return { ...prev, [option.value]: { x, width } };
              });
            }}
            style={styles.segment}
          >
            <LucideIcon
              name={option.icon}
              size={17}
              color={selected ? theme.colors.paper : theme.colors.muted}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    padding: 3,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
  },
  pill: {
    position: 'absolute',
    // Matches the group's padding so the pill hugs the segments.
    top: 3,
    bottom: 3,
    left: 0,
    backgroundColor: theme.colors.ink,
    borderRadius: 11,
  },
  segment: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
