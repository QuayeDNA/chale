import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { FlatList, useWindowDimensions, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export type SpotlightPage = {
  key: string;
  /** Short screen-reader name for the page, used in the pager label. */
  label: string;
  /**
   * The page's card. When the pager has settled on a shared height it passes
   * `{ flex: 1 }` here, and the card is expected to stretch — that is what
   * keeps every tenant of the slot exactly the same size.
   */
  render: (style?: ViewStyle) => ReactNode;
};

/**
 * Home's top-of-screen pager: one full-width card at a time, swipeable with
 * dots and a gentle auto-advance.
 *
 * This borrows the catalogue rail's swipe idiom without mounting its 3D
 * coverflow. These cards are heterogeneous full-width actions (an invite next
 * to a deck recommendation), so a paging list is the honest control: exact
 * page widths, platform paging behaviour, and no GPU-heavy transforms for two
 * cards that simply need to sit side by side.
 *
 * Every page renders at the tallest page's height. The cards hold different
 * amounts of copy, and without this the slot visibly breathes as you swipe —
 * the recommendation reads as "small" next to the invite. Measurement is
 * two-pass: natural heights first, then all items pinned to the max and each
 * card stretched to fill. A single page renders without chrome — no dots, no
 * timer — because a pager around one card is decoration pretending to be
 * navigation.
 */
export function SpotlightCarousel({
  pages,
  startIndex = 0,
  autoIntervalMs = 7000,
}: {
  pages: SpotlightPage[];
  /** Which page is showing when this pager mounts. */
  startIndex?: number;
  autoIntervalMs?: number;
}) {
  const { theme } = useUnistyles();
  const reduceMotion = useReducedMotion();
  const listRef = useRef<FlatList<SpotlightPage> | null>(null);
  // Screen's content gutter is the page padding on both sides: the pager lives
  // inside that content, so each page is the window less both gutters.
  const pageWidth = Math.max(
    0,
    useWindowDimensions().width - theme.spacing.four * 2,
  );
  const clampedStart =
    pages.length === 0 ? 0 : Math.min(Math.max(startIndex, 0), pages.length - 1);
  const [index, setIndex] = useState(clampedStart);
  const [touching, setTouching] = useState(false);
  const [heights, setHeights] = useState<Record<string, number>>({});

  useEffect(() => {
    if (pages.length < 2 || reduceMotion || touching || pageWidth <= 0) return;
    const timer = setInterval(() => {
      const next = (index + 1) % pages.length;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setIndex(next);
    }, autoIntervalMs);
    return () => clearInterval(timer);
  }, [autoIntervalMs, index, pageWidth, pages.length, reduceMotion, touching]);

  if (pages.length === 0) return null;
  if (pages.length === 1) return <>{pages[0].render(undefined)}</>;

  // Only pin once every current page has reported a natural height; until then
  // each item sizes to its content so there is always something real to read.
  const measured = pages.filter((page) => (heights[page.key] ?? 0) > 0);
  const sharedHeight =
    measured.length === pages.length
      ? Math.max(...pages.map((page) => heights[page.key]))
      : undefined;

  const updateIndex = (x: number) => {
    setIndex(Math.min(Math.max(Math.round(x / pageWidth), 0), pages.length - 1));
    setTouching(false);
  };

  const measure = (key: string, height: number) => {
    setHeights((prev) => (prev[key] === height ? prev : { ...prev, [key]: height }));
  };

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel={`Featured, ${pages[index]?.label ?? 'card'} ${index + 1} of ${pages.length}`}
    >
      <FlatList
        ref={listRef}
        data={pages}
        keyExtractor={(page) => page.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        initialScrollIndex={clampedStart}
        getItemLayout={(_, i) => ({ length: pageWidth, offset: pageWidth * i, index: i })}
        onScrollBeginDrag={() => setTouching(true)}
        onScrollEndDrag={(e) => updateIndex(e.nativeEvent.contentOffset.x)}
        onMomentumScrollEnd={(e) => updateIndex(e.nativeEvent.contentOffset.x)}
        renderItem={({ item }) => (
          <View
            style={{ width: pageWidth, height: sharedHeight }}
            onLayout={(e) => measure(item.key, e.nativeEvent.layout.height)}
          >
            {item.render(sharedHeight ? styles.fill : undefined)}
          </View>
        )}
      />
      <View
        style={styles.dots}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {pages.map((page, i) => (
          <View
            key={page.key}
            style={[
              styles.dot,
              { backgroundColor: i === index ? theme.colors.ink : theme.colors.border },
              i === index && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create(() => ({
  fill: {
    flex: 1,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.55,
  },
  dotActive: {
    width: 18,
    opacity: 1,
  },
}));
