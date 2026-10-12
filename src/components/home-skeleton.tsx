import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Skeleton, SkeletonRow } from './ui/skeleton';

/**
 * Loading shapes for the home screen.
 *
 * Each one is the geometry of the section it stands in for, not a generic set
 * of bars: the daily card is the same 172pt slab whatever state it is about to
 * land in, and the tray keeps its ink surface so the page does not jump a
 * screenful when the data arrives. The skeleton is also what makes the
 * relationship between the sections legible before anything has loaded — you
 * can see there is a card, a rail of games and two rows coming.
 */
export function DailyCardSkeleton() {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.daily}
    >
      <View style={styles.dailyTop}>
        <Skeleton width={92} height={9} radius={5} />
        <Skeleton width={9} height={9} radius={5} />
      </View>
      <View style={styles.dailyBody}>
        <Skeleton width="86%" height={20} radius={8} />
        <Skeleton width="62%" height={20} radius={8} />
        <Skeleton width="48%" height={11} radius={6} />
      </View>
      <Skeleton width={104} height={40} radius={20} />
    </View>
  );
}

/**
 * The tray in its resting geometry: the dark surface, a heading placeholder and
 * two cards. Skeletons inside an ink tray are the cream border token, which is
 * already the light value — no inverted palette needed.
 */
export function ResumeTraySkeleton() {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.tray}
    >
      <View style={styles.trayHead}>
        <Skeleton width={196} height={13} radius={7} />
        <Skeleton width={58} height={10} radius={5} />
      </View>
      <View style={styles.trayRail}>
        {[0, 1].map((i) => (
          <Skeleton key={i} width={196} height={268} radius={22} style={styles.trayCard} />
        ))}
      </View>
    </View>
  );
}

export function BrowseRowSkeleton() {
  return <SkeletonRow height={106} radius={24} />;
}

/**
 * The favourites shelf is an ink surface, so its placeholder is too — the same
 * SkeletonRow, restated on ink rather than paper. A cream placeholder for a
 * dark row would flash the whole section light for a frame.
 */
export function FavouritesRowSkeleton() {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.favRow}
    >
      <Skeleton width={44} height={44} radius={12} />
      <View style={styles.favCopy}>
        <Skeleton width="58%" height={13} radius={7} />
        <Skeleton width="38%" height={10} radius={5} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  // Matches DailyPromptCard's slab exactly: same height, same radius, same
  // padding. A placeholder that is a different shape is a jump on arrival.
  daily: {
    minHeight: 172,
    borderRadius: 26,
    padding: theme.spacing.four,
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dailyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.two,
  },
  dailyBody: {
    gap: theme.spacing.two,
  },
  tray: {
    marginHorizontal: -6,
    paddingVertical: 18,
    borderRadius: 30,
    backgroundColor: theme.colors.ink,
  },
  trayHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: theme.spacing.two,
  },
  trayRail: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 6,
  },
  trayCard: {
    borderRadius: 22,
  },
  favRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.three,
    height: 74,
    paddingLeft: theme.spacing.three,
    paddingRight: theme.spacing.four,
    borderRadius: theme.radii.hero,
    backgroundColor: theme.colors.ink,
  },
  favCopy: {
    flex: 1,
    gap: theme.spacing.two,
  },
}));
