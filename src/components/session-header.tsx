import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { LucideIcon, type ShowcaseIconName } from './ui/icon';
import { Text } from './ui/text';

/**
 * The in-person session's bar: where you are, and the way back.
 *
 * Two people share this phone. The deck title is the heading because it is the
 * thing you are both inside of, and the line under it says which of the two
 * rooms is happening — "In person · together" is deliberately the opposite of
 * the remote page's date, so nobody has to remember which app state they are in
 * when a question comes round again.
 *
 * The button is a 42pt circle, not a 44pt square: a back arrow is the one
 * control on this page that must never look like a card, and a ring reads as
 * chrome rather than content.
 *
 * The deck's own tile sits beside the name, so the two people holding the
 * phone can tell at a glance which deck they are halfway through without
 * reading the title.
 */
export function SessionHeader({
  title,
  subtitle = 'In person · together',
  onBack,
  icon,
  colors,
  ink,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  /** The deck's glyph and plate, or nothing for a screen with no deck. */
  icon?: ShowcaseIconName;
  colors?: readonly [string, string];
  ink?: string;
}) {
  return (
    <View style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to the deck"
        hitSlop={8}
        onPress={onBack}
        style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
      >
        <LucideIcon name="chevron-left" size={20} color={styles.icon.color} />
      </Pressable>
      {icon ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.tile}
        >
          {colors ? (
            <LinearGradient
              colors={colors as [string, string]}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tileWash}
            />
          ) : null}
          <LucideIcon name={icon} size={20} color={ink ?? '#FFF9E8'} />
        </View>
      ) : null}
      <View style={styles.copy}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="caption" muted numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.three,
    minHeight: 44,
  },
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: {
    opacity: 0.7,
  },
  // Clips the wash to the tile, so the gradient is a child rather than a
  // sibling — a sibling positioned absolutely would fill the whole bar.
  tile: {
    width: 42,
    height: 42,
    borderRadius: theme.radii.chip,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileWash: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  icon: {
    color: theme.colors.ink,
  },
}));