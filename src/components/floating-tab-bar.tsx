import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import {
  TAB_BAR_BOTTOM_GAP,
  TAB_BAR_ITEM_HEIGHT,
  TAB_BAR_PADDING,
} from './tab-bar-context';
import { LucideIcon, type ChaleIconName } from './ui/icon';
import { Text } from './ui/text';

type TabRoute = { key: string; name: string };

const SPRING = { damping: 32, stiffness: 350, mass: 1 };

/**
 * Floating board tab bar — detached pill container with a single
 * street-gold indicator that springs to the selected tab.
 * Wired as Tabs `tabBar`, so selection comes from `state.index`
 * (never the injected accessibility props that broke the
 * per-button version).
 */
export function FloatingTabBar({
  state,
  navigation,
  tabs,
}: {
  state: { index: number; routes: TabRoute[] };
  navigation: {
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => {
      defaultPrevented?: boolean;
    };
    navigate: (name: string) => void;
  };
  tabs: { name: string; title: string; icon: ChaleIconName }[];
}) {
  const insets = useSafeAreaInsets();
  const { theme } = useUnistyles();
  const [layouts, setLayouts] = useState<Record<string, { x: number; width: number }>>({});
  const pillX = useSharedValue(0);
  const pillWidth = useSharedValue(0);
  const placed = useRef(false);

  const target = layouts[state.routes[state.index]?.key ?? ''];

  useEffect(() => {
    if (!target) return;
    if (!placed.current) {
      // First measure: appear under the initial tab, no animation.
      pillX.value = target.x;
      pillWidth.value = target.width;
      placed.current = true;
    } else {
      // Retargets mid-flight, so skipped tabs slide through smoothly.
      pillX.value = withSpring(target.x, SPRING);
      pillWidth.value = withSpring(target.width, SPRING);
    }
  }, [target, pillX, pillWidth]);

  const pillStyle = useAnimatedStyle(() => ({
    width: pillWidth.value,
    transform: [{ translateX: pillX.value }],
  }));

  return (
    <View style={[styles.bar, { bottom: insets.bottom + TAB_BAR_BOTTOM_GAP }]}>
      {/* Width 0 until the first measure lands, so no flash. */}
      <Animated.View style={[styles.pill, pillStyle]} />
      {state.routes.map((route, index) => {
        const meta = tabs.find((t) => t.name === route.name);
        if (!meta) return null;
        const selected = index === state.index;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={meta.title}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!selected && !event.defaultPrevented) {
                // No-op if the native module isn't in this build yet.
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                navigation.navigate(route.name);
              }
            }}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              setLayouts((prev) => {
                const existing = prev[route.key];
                if (existing && existing.x === x && existing.width === width) return prev;
                return { ...prev, [route.key]: { x, width } };
              });
            }}
            style={styles.item}
          >
            <LucideIcon
              name={meta.icon}
              size={24}
              color={selected ? theme.colors.ink : theme.colors.muted}
            />
            <Text variant="caption" style={selected ? styles.labelSelected : styles.label}>
              {meta.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.surface,
    borderRadius: 28,
    paddingHorizontal: TAB_BAR_PADDING,
    paddingVertical: TAB_BAR_PADDING,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  pill: {
    position: 'absolute',
    // Matches the bar's vertical padding so the pill hugs the items.
    top: TAB_BAR_PADDING,
    bottom: TAB_BAR_PADDING,
    left: 0,
    // Board ref1: active tab is a street-gold pill with ink content.
    backgroundColor: theme.colors.street,
    borderRadius: 20,
  },
  item: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minHeight: TAB_BAR_ITEM_HEIGHT,
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  label: {
    color: theme.colors.muted,
    fontFamily: 'SplineSans_600SemiBold',
    fontSize: 12,
  },
  labelSelected: {
    color: theme.colors.ink,
    fontFamily: 'SplineSans_600SemiBold',
    fontSize: 12,
  },
}));
