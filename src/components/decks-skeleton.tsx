import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ResponsiveGrid } from '@/components/ui/responsive-grid';
import { Skeleton, SkeletonRow } from '@/components/ui/skeleton';

import type { StorefrontView } from '@/app/decks';

/**
 * Loading shapes for the catalogue, one per view.
 *
 * Each is the geometry of the thing it stands in for, so the page does not
 * reflow when the real decks land: the flow reserves the stage's height, the
 * grid holds its aspect ratio, and the list holds its row height. A spinner
 * would be shorter than all three and would move everything below it.
 *
 * These mirror `home-skeleton.tsx` deliberately — same idea, same Skeleton
 * primitive — so loading looks the same wherever it appears.
 */
export function DecksSkeleton({ view }: { view: StorefrontView }) {
  if (view === 'grid') return <GridSkeleton />;
  if (view === 'list') return <ListSkeleton />;
  return <FlowSkeleton />;
}

function FlowSkeleton() {
  return (
    <View style={styles.flow}>
      {/* The stage is a fixed height in the real view, so this is too. */}
      <Skeleton height={STAGE_HEIGHT} radius={STAGE_RADIUS} />
      <View style={styles.flowCopy}>
        <Skeleton height={22} width="62%" radius={8} />
        <Skeleton height={14} width="84%" radius={7} />
      </View>
      <View style={styles.flowActions}>
        <View style={styles.peekSlot}>
          <Skeleton height={52} radius={26} />
        </View>
        <View style={styles.playSlot}>
          <Skeleton height={52} radius={26} />
        </View>
      </View>
    </View>
  );
}

function GridSkeleton() {
  return (
    <ResponsiveGrid minColumnWidth={150} gap={14}>
      {[0, 1, 2, 3].map((i) => (
        <CardSkeleton key={i} />
      ))}
    </ResponsiveGrid>
  );
}

function CardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width={ICON_TILE} height={ICON_TILE} radius={15} />
      <View style={styles.cardCopy}>
        <Skeleton height={16} width="78%" radius={7} />
        <Skeleton height={12} width="52%" radius={6} />
      </View>
    </View>
  );
}

function ListSkeleton() {
  return (
    <View style={styles.list}>
      {[0, 1, 2].map((i) => (
        <SkeletonRow key={i} height={LIST_ROW_HEIGHT} radius={18} leading={LIST_SWATCH} />
      ))}
    </View>
  );
}

/** Stage height in the flow view: the card plus its vertical allowance. */
const STAGE_HEIGHT = 344;
const STAGE_RADIUS = 24;
const ICON_TILE = 46;
const LIST_ROW_HEIGHT = 68;
const LIST_SWATCH = 56;

const styles = StyleSheet.create((theme) => ({
  flow: {
    gap: theme.spacing.three,
  },
  flowCopy: {
    alignItems: 'center',
    gap: theme.spacing.two,
  },
  flowActions: {
    flexDirection: 'row',
    gap: theme.spacing.three,
  },
  // The 1:2 split the real buttons use, so the skeleton reserves the same
  // widths and nothing below it moves when they arrive.
  peekSlot: {
    flex: 1,
  },
  playSlot: {
    flex: 2,
  },
  card: {
    // StorefrontCard's own ratio, so a cell is already its final height.
    aspectRatio: 0.7,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: 14,
    justifyContent: 'space-between',
  },
  cardCopy: {
    gap: theme.spacing.two,
  },
  list: {
    gap: theme.spacing.two,
  },
}));
