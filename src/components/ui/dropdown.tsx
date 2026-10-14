import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { LucideIcon, type ChaleIconName } from './icon';
import { Text } from './text';

export type DropdownItem = {
  key: string;
  label: string;
  icon?: ChaleIconName;
  destructive?: boolean;
  onPress: () => void;
};

type Rect = { x: number; y: number; width: number; height: number };
type Size = { width: number; height: number };

const EDGE = 12; // min distance from any screen edge / safe-area inset
const GAP = 6; // distance between trigger and menu

/**
 * Controlled dropdown — parent owns `open`, so the trigger can be anything.
 *
 * Placement is collision-aware:
 *  - opens below the trigger, flips above when there isn't room below
 *  - clamps horizontally so it never leaves the screen / safe area
 *  - if neither side fits, it takes the larger side and scrolls
 *  - closes itself on rotation / window resize (anchor would be stale)
 */
export function Dropdown({
  open,
  onOpenChange,
  trigger,
  items,
  align = 'right',
  label,
  minWidth = 200,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  label?: string;
  minWidth?: number;
}) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  const triggerRef = useRef<View>(null);
  const pendingAction = useRef<(() => void) | null>(null);
  const lastDims = useRef({ screenW, screenH });

  const [anchor, setAnchor] = useState<Rect | null>(null);
  const [menu, setMenu] = useState<Size | null>(null);
  const progress = useSharedValue(0);

  /* ----------------------------- measure trigger ---------------------------- */
  useEffect(() => {
    if (!open) {
      setAnchor(null);
      setMenu(null);
      return;
    }
    triggerRef.current?.measureInWindow((x, y, width, height) =>
      setAnchor({ x, y, width, height }),
    );
  }, [open]);

  /* ------------------------ close on rotation / resize ---------------------- */
  useEffect(() => {
    const prev = lastDims.current;
    if (prev.screenW !== screenW || prev.screenH !== screenH) {
      lastDims.current = { screenW, screenH };
      if (open) onOpenChange(false);
    }
  }, [screenW, screenH, open, onOpenChange]);

  /* -------------------------------- placement ------------------------------- */
  const maxMenuW = screenW - insets.left - insets.right - EDGE * 2;

  let left = 0;
  let top = 0;
  let maxHeight = 0;
  let side: 'below' | 'above' = 'below';

  if (anchor) {
    const spaceBelow = screenH - insets.bottom - EDGE - (anchor.y + anchor.height) - GAP;
    const spaceAbove = anchor.y - insets.top - EDGE - GAP;
    maxHeight = Math.max(spaceBelow, spaceAbove);

    if (menu) {
      const minX = insets.left + EDGE;
      const maxX = Math.max(minX, screenW - insets.right - EDGE - menu.width);
      const rawX = align === 'left' ? anchor.x : anchor.x + anchor.width - menu.width;
      left = Math.min(Math.max(rawX, minX), maxX);

      const fitsBelow = menu.height <= spaceBelow;
      const fitsAbove = menu.height <= spaceAbove;
      side = fitsBelow ? 'below' : fitsAbove ? 'above' : spaceBelow >= spaceAbove ? 'below' : 'above';
      top = side === 'below' ? anchor.y + anchor.height + GAP : anchor.y - GAP - menu.height;
    }
  }

  const ready = !!anchor && !!menu;

  /* -------------------------------- animation ------------------------------- */
  useEffect(() => {
    if (ready) {
      progress.value = withTiming(1, {
        duration: reduceMotion ? 0 : 150,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      progress.value = 0;
    }
  }, [ready, reduceMotion, progress]);

  const dir = side === 'below' ? -1 : 1;
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 8 * dir }],
  }));

  const onMenuLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setMenu((prev) =>
      prev && Math.abs(prev.width - width) < 0.5 && Math.abs(prev.height - height) < 0.5
        ? prev
        : { width, height },
    );
  }, []);

  /* --------------------------------- actions -------------------------------- */
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  // iOS can't start another modal/navigation while this one is dismissing,
  // so defer the item's action until the Modal has fully gone.
  const select = useCallback(
    (item: DropdownItem) => {
      if (Platform.OS === 'ios') {
        pendingAction.current = item.onPress;
        onOpenChange(false);
      } else {
        onOpenChange(false);
        item.onPress();
      }
    },
    [onOpenChange],
  );

  const handleDismiss = useCallback(() => {
    const fn = pendingAction.current;
    pendingAction.current = null;
    fn?.();
  }, []);

  /* --------------------------------- render --------------------------------- */
  return (
    <>
      <View ref={triggerRef} collapsable={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={label ?? 'Open menu'}
          onPress={() => onOpenChange(!open)}
        >
          {trigger}
        </Pressable>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={close}
        onDismiss={handleDismiss}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss menu"
          onPress={close}
          style={styles.scrim}
        />

        {anchor && (
          <Animated.View
            accessibilityRole="menu"
            accessibilityViewIsModal
            onLayout={onMenuLayout}
            pointerEvents={ready ? 'auto' : 'none'}
            style={[
              styles.menu,
              { left, top, maxHeight, minWidth: Math.min(minWidth, maxMenuW), maxWidth: maxMenuW },
              animatedStyle,
            ]}
          >
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              style={styles.scroll}
              contentContainerStyle={styles.content}
            >
              {items.map((item, i) => (
                <MenuItem
                  key={item.key}
                  item={item}
                  onSelect={select}
                  divider={i > 0 && !!item.destructive && !items[i - 1].destructive}
                />
              ))}
            </ScrollView>
          </Animated.View>
        )}
      </Modal>
    </>
  );
}

const MenuItem = memo(function MenuItem({
  item,
  onSelect,
  divider,
}: {
  item: DropdownItem;
  onSelect: (item: DropdownItem) => void;
  divider: boolean;
}) {
  const { theme } = useUnistyles();
  return (
    <>
      {divider && <View style={styles.divider} />}
      <Pressable
        accessibilityRole="menuitem"
        accessibilityLabel={item.label}
        onPress={() => onSelect(item)}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        {item.icon && (
          <LucideIcon
            name={item.icon}
            size={20}
            color={item.destructive ? theme.status.danger : undefined}
          />
        )}
        <Text
          variant="smallBold"
          numberOfLines={1}
          style={[styles.label, item.destructive ? styles.destructive : styles.rowLabel]}
        >
          {item.label}
        </Text>
      </Pressable>
    </>
  );
});

const styles = StyleSheet.create((theme) => ({
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  menu: {
    position: 'absolute',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 24,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
    borderRadius: 15,
  },
  content: {
    padding: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  rowPressed: { backgroundColor: theme.colors.border },
  label: { flexShrink: 1 },
  rowLabel: { color: theme.colors.ink },
  destructive: { color: theme.status.danger },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
    marginVertical: 4,
    marginHorizontal: 10,
  },
}));