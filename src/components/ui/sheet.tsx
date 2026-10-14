import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';

import { LucideIcon, type ShowcaseIconName } from './icon';
import { Text } from './text';

const SheetActionContext = createContext<(action: () => void) => void>(() => {});

/** Slide up into place, slide back down out of it. */
const OPEN_MS = 300;
const CLOSE_MS = 220;
/**
 * The Modal must outlive the exit slide. React tears a `visible={false}` Modal
 * down on the very frame `open` flips, so without this grace the close is an
 * instant vanish — the slide-down never gets a frame to play in.
 */
const UNMOUNT_GRACE_MS = 90;
/** Extra travel so the sheet clears the bottom edge instead of stopping on it. */
const TRAVEL_PAD = 32;

/**
 * Inside a Sheet, wrap anything that navigates in run() so iOS waits for the
 * modal to finish dismissing first — starting a navigation while a modal is
 * still on screen silently drops it.
 */
export function useSheetAction() {
  return useContext(SheetActionContext);
}

/**
 * Bottom sheet — the right container for a short, binary decision made while
 * the user is still looking at the thing they decided on. A full screen would
 * throw away the deck spread behind it and burn a route transition on two
 * options.
 *
 * Built on the same transparent Modal + scrim + onRequestClose pattern as
 * Dropdown, so it inherits the already-solved z-index behaviour instead of
 * fighting the card behind it.
 *
 * Controlled: the parent owns `open`. `onDismiss` defers the caller's action
 * until the modal has fully gone, because iOS cannot start a navigation while
 * this one is still dismissing.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  caption,
  scroll = false,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  caption?: string;
  /**
   * Wraps the body in a scroll view capped at 92% of the screen. For a sheet
   * whose content can outgrow a short screen — a long list, or sample cards
   * that scroll sideways — so it never runs off the top.
   */
  scroll?: boolean;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const pendingAction = useRef<(() => void) | null>(null);
  const [mounted, setMounted] = useState(open);
  const [sheetHeight, setSheetHeight] = useState(0);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, {
      duration: reduceMotion ? 0 : open ? OPEN_MS : CLOSE_MS,
      easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
    });
  }, [open, reduceMotion, progress]);

  // Deferred a tick: setting state synchronously in an effect body cascades
  // renders (react-hooks/set-state-in-effect).
  useEffect(() => {
    const wait = open ? 0 : reduceMotion ? 0 : CLOSE_MS + UNMOUNT_GRACE_MS;
    const timer = setTimeout(() => setMounted(open), wait);
    return () => clearTimeout(timer);
  }, [open, reduceMotion]);

  const travel = sheetHeight > 0 ? sheetHeight + TRAVEL_PAD : windowHeight;

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  /** Runs `action` after the modal is fully gone. Safe to call whether or not
   * it is deferred — onDismiss only fires on iOS, where the deferral is
   * needed, so Android runs it immediately. */
  const run = useCallback((action: () => void) => {
    if (Platform.OS === 'ios') {
      pendingAction.current = action;
      onOpenChange(false);
    } else {
      onOpenChange(false);
      action();
    }
  }, [onOpenChange]);

  const handleDismiss = useCallback(() => {
    const fn = pendingAction.current;
    pendingAction.current = null;
    fn?.();
  }, []);

  // The sheet travels its own height, not a fixed nudge, so it always clears
  // the bottom edge whatever its content measures.
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * travel }],
  }));

  const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}
      onDismiss={handleDismiss}
    >
      <Animated.View style={[styles.scrim, scrimStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          onPress={close}
          style={styles.fill}
        />
      </Animated.View>

      <Animated.View
        accessibilityViewIsModal
        onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}
        style={[styles.sheet, { paddingBottom: insets.bottom + 12 }, sheetStyle]}
      >
        <View style={styles.grabber} />
        <View style={styles.header}>
          <Text variant="title">{title}</Text>
          {!!caption && (
            <Text variant="caption" muted style={styles.caption}>
              {caption}
            </Text>
          )}
        </View>
        <SheetActionContext.Provider value={run}>
          {scroll ? (
            <ScrollView
              style={styles.scroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {children}
            </ScrollView>
          ) : (
            children
          )}
        </SheetActionContext.Provider>
      </Animated.View>
    </Modal>
  );
}

/**
 * A full-width row inside a Sheet: icon, title, sub-line, chevron. Sized to
 * the 44pt touch floor by the padding, so it needs no fixed height.
 */
export function SheetOption({
  icon,
  label,
  hint,
  onPress,
}: {
  icon: ShowcaseIconName;
  label: string;
  hint?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
    >
      <View style={styles.optionIcon}>
        <LucideIcon name={icon} size={22} color="#2B1A0F" />
      </View>
      <View style={styles.optionCopy}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {label}
        </Text>
        {!!hint && (
          <Text variant="caption" muted numberOfLines={2}>
            {hint}
          </Text>
        )}
      </View>
      <LucideIcon name="chevron" size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  fill: { ...StyleSheet.absoluteFillObject },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.overlay,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: theme.spacing.three,
    paddingHorizontal: theme.spacing.four,
    paddingTop: theme.spacing.two,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radii.hero,
    borderTopRightRadius: theme.radii.hero,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 24,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
  },
  header: { gap: 2 },
  caption: { marginTop: 2 },
  // 92% of the screen, like the concept's sheet, so a tall body scrolls
  // instead of pushing the header off the top.
  scroll: {
    maxHeight: '92%',
  },
  scrollContent: {
    gap: theme.spacing.three,
    paddingBottom: theme.spacing.four,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.three,
    paddingVertical: theme.spacing.three,
  },
  optionPressed: { opacity: 0.6 },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.chip,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.street,
  },
  optionCopy: { flex: 1, gap: 2 },
}));