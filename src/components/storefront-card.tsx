import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import { LucideIcon, type ShowcaseIconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

type Props = {
  title: string;
  /** Line under the title — "100 questions · Partners". */
  meta?: string | null;
  icon: ShowcaseIconName;
  /** Gradient stops from the deck's tone. */
  colors: readonly [string, string];
  /** Ink that stays legible on this gradient. */
  ink?: string;
  /** Label chip — POPULAR, PAID, etc. */
  tag?: string;
  /**
   * Whether this card is the selected one. Selected cards sit lifted; the
   * lift is a STATE change and springs, so it holds while selected and eases
   * back down when the selection moves elsewhere. It is deliberately not a
   * press effect — a tap both selects and releases within one touch, which
   * would lift and drop inside a single tap.
   */
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/** Lift distance while selected, matching the concept's translateY(-4px). */
const LIFT = 4;
const SELECT_SPRING = { damping: 18, stiffness: 260, mass: 0.7 };

/**
 * Storefront deck card — the gradient face shared by the coverflow, the grid
 * and the detail hero. Composition follows the storefront concept: radial
 * gradient, a soft ring detail bottom-right, an icon tile up top, title and
 * meta anchored to the bottom, with a tag chip up top-right.
 *
 * The concept's pointer-driven glare is deliberately NOT here. That highlight
 * belongs to the carousel's hover state, where the pointer drives it; a phone
 * has no hover, and on a static card it would be decoration that isn't in the
 * design. The only motion here is the selected lift.
 *
 * Kept presentation-only — every caller supplies its own geometry, so the same
 * face renders at coverflow (210×300), grid (aspect 7:10) and hero size.
 */
export function StorefrontCard({
  title,
  meta,
  icon,
  colors,
  ink = '#FFF9E8',
  tag,
  selected = false,
  onPress,
  style,
  accessibilityLabel,
}: Props) {
  const [from, to] = colors;

  const lift = useLift(selected);

  const rootStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -LIFT * lift.value }],
  }));

  return (
    <Animated.View style={[styles.root, style, rootStyle]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={accessibilityLabel ?? title}
        style={styles.face}
      >
        <LinearGradient
          colors={[from, to]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.wash}
          pointerEvents="none"
        />
        {/* Soft ring detail, bottom-right, echoing the concept's arc. */}
        <View style={styles.ring} pointerEvents="none" />
        <View style={styles.iconTile} pointerEvents="none">
          <LucideIcon name={icon} size={24} color={ink} />
        </View>
        {tag ? (
          <View style={styles.tag} pointerEvents="none">
            <Text variant="smallBold" style={styles.tagText}>
              {tag}
            </Text>
          </View>
        ) : null}
        <View style={styles.copy} pointerEvents="none">
          <Text variant="title" numberOfLines={2} style={{ color: ink }}>
            {title}
          </Text>
          {meta ? (
            <Text variant="caption" style={[styles.meta, { color: ink }]}>
              {meta}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

/**
 * Eases towards 1 while selected, 0 otherwise. Written as a plain function
 * rather than inline in the component because a shared-value writer must not
 * be wrapped in a callback (react-hooks/immutability), and the value may also
 * be driven from outside when a caller animates its own selection.
 */
function useLift(selected: boolean): SharedValue<number> {
  const lift = useSharedValue(selected ? 1 : 0);
  if (lift.value !== (selected ? 1 : 0)) {
    lift.value = withSpring(selected ? 1 : 0, SELECT_SPRING);
  }
  return lift;
}

const styles = StyleSheet.create((theme) => ({
  root: {
    position: 'relative',
    // The card owns its shape: portrait, like the concept's 210×300 face and
    // the 7:10 grid tile. Without this the root has no height of its own and
    // collapses to whatever the copy happens to need, which reads as a pill.
    // A caller passing explicit width/height overrides it.
    aspectRatio: 0.7,
  },
  face: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    padding: 18,
    justifyContent: 'space-between',
  },
  wash: {
    ...StyleSheet.absoluteFillObject,
  },
  ring: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 22,
    borderColor: 'rgba(255,255,255,0.10)',
    right: -60,
    bottom: -60,
  },
  iconTile: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    gap: 6,
  },
  meta: {
    opacity: 0.85,
  },
  tag: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: theme.radii.pill,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  tagText: {
    color: '#FFF9E8',
    fontSize: 10,
    letterSpacing: 0.8,
  },
}));