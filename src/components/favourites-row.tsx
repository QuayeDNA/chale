import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { gradientFor } from '@/decks/art';

import { LucideIcon } from './ui/icon';
import { Text } from './ui/text';

/**
 * A way into the saved questions.
 *
 * Favourites are a library, not a catalogue, so this row has no cards in it —
 * just a way in and a count. It sits on ink rather than paper: the dashboard is
 * otherwise a run of cream surfaces, and the saved-questions shelf is the one
 * thing on it that belongs to you rather than to today, so it earns the same
 * dark treatment as the resume tray.
 *
 * It renders whether or not anything is saved — the row is also how a
 * first-time user finds out the feature exists, and the empty screen behind it
 * explains itself.
 */
export function FavouritesRow({
  count,
  onPress,
}: {
  count: number;
  onPress: () => void;
}) {

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        count === 0
          ? 'Your favourites. Nothing saved yet.'
          : `Your favourites, ${count} saved`
      }
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {/* The wash is a child of the tile, not a sibling: a view that clips its
          own contents also clips them to its own radius, and the tile needs
          both the clip and the gradient inside the same box. */}
      <View style={styles.tile} pointerEvents="none">
        <LinearGradient
          colors={[...gradientFor('love')]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tileWash}
        />
        <LucideIcon name="heart" size={22} color="#FFF9E8" />
      </View>

      <View style={styles.copy}>
        <Text variant="bodyStrong" style={styles.title}>
          Your favourites
        </Text>
        <Text variant="caption" style={styles.sub}>
          {count === 0
            ? 'Heart a question and it waits for you'
            : `${count} question${count === 1 ? '' : 's'} saved`}
        </Text>
      </View>

      <LucideIcon name="chevron" size={20} color={CHEVRON} />
    </Pressable>
  );
}

/** On ink the muted token is too close to the surface to read; this is the
 *  dimmed cream the resume tray's labels use. */
const CHEVRON = '#BFAE92';
const SUB = '#D8CDB8';

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.three,
    paddingVertical: theme.spacing.three,
    paddingLeft: theme.spacing.three,
    paddingRight: theme.spacing.four,
    borderRadius: theme.radii.hero,
    backgroundColor: theme.colors.ink,
    overflow: 'hidden',
  },
  pressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.92,
  },
  tile: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.chip,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // Absolute rather than a wrapper, so the gradient and the icon can share one
  // box instead of the icon needing a sibling of its own.
  tileWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    color: theme.colors.paper,
  },
  sub: {
    color: SUB,
  },
}));