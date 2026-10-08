import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, useWindowDimensions, View } from 'react-native';
import Animated, {
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import { DeckStackCard } from '@/components/deck-stack-card';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Screen } from '@/components/screen';
import { artFor, deckCountCopy, toneName } from '@/decks/art';
import { listDecks, type DeckSummary } from '@/lib/decks';

/**
 * Board ref1 screen 4 "Select Deck": a swipeable spread of deck cards with a
 * dot pager. Tapping any home tile lands here already positioned on that deck,
 * so the tiles are a shortcut into the spread rather than a separate flow.
 *
 * Card depth, splay and face tilt are all derived from scrollX on the UI
 * thread — see DeckStackCard.
 */

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<DeckSummary>);

/** Card width as a share of the screen, leaving neighbours peeking at the edges. */
const CARD_WIDTH_RATIO = 0.68;
const CARD_MAX_WIDTH = 300;

export default function DeckScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const decks = useQuery({ queryKey: ['decks'], queryFn: listDecks });

  if (!decks.data?.length) {
    return (
      <Screen align="start">
        <Text variant="body" muted>
          {decks.error ? 'Couldn’t load decks.' : 'Loading decks…'}
        </Text>
      </Screen>
    );
  }

  // Mounted only once the data exists, so initialScrollIndex and the active
  // deck's state both initialise against a real list.
  const startIndex = Math.max(
    0,
    decks.data.findIndex((d) => d.id === id),
  );
  return <DeckSpread decks={decks.data} startIndex={startIndex} />;
}

function DeckSpread({ decks, startIndex }: { decks: DeckSummary[]; startIndex: number }) {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();

  const cardWidth = Math.min(screenWidth * CARD_WIDTH_RATIO, CARD_MAX_WIDTH);
  // Card centres sit one card-plus-a-peek apart, so the spread overlaps.
  const step = cardWidth * 1.08;

  const scrollX = useSharedValue(startIndex * step);
  const listRef = useAnimatedRef<FlatList<DeckSummary>>();
  const [active, setActive] = useState(startIndex);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(decks.length - 1, index));
      setActive(clamped);
      scrollTo(listRef, clamped * step, 0, true);
    },
    [decks.length, listRef, step],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: DeckSummary; index: number }) => (
      <DeckStackCard
        deck={item}
        index={index}
        step={step}
        scrollX={scrollX}
        width={cardWidth}
        onPress={() => router.push({ pathname: '/session', params: { pack: item.id } })}
      />
    ),
    [cardWidth, router, scrollX, step],
  );

  const selected = decks[active] ?? decks[startIndex];
  const art = selected
    ? artFor({ slug: selected.slug, tone: toneName(selected.tone), art_key: selected.art_key })
    : null;

  return (
    <Screen align="start">
      <View style={styles.heading}>
        <Text variant="title">Choose a deck</Text>
        <Text variant="caption" muted>
          Each session draws {selected.session_length} questions at random.
        </Text>
      </View>

      <AnimatedFlatList
        ref={listRef}
        data={decks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        decelerationRate="fast"
        disableIntervalMomentum
        initialScrollIndex={startIndex}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => setActive(Math.round(e.nativeEvent.contentOffset.x / step))}
        contentContainerStyle={{ paddingHorizontal: (screenWidth - cardWidth) / 2 }}
        getItemLayout={(_, index) => ({ length: step, offset: step * index, index })}
      />

      <DotPager count={decks.length} active={active} onSelect={goTo} />

      <View style={styles.actions}>
        <Button
          label="Just the two of us"
          onPress={() => router.push({ pathname: '/session', params: { pack: selected.id } })}
        />
        <Button
          label="Start remote session"
          variant="outline"
          onPress={() => router.push('/start')}
        />
        <View style={styles.detailRow}>
          <View
            style={[
              styles.detailChip,
              { backgroundColor: art?.fill ?? 'transparent', borderColor: art?.ink },
            ]}
          >
            <Text variant="caption" style={{ color: art?.ink }}>
              {deckCountCopy(selected)}
            </Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}

function DotPager({
  count,
  active,
  onSelect,
}: {
  count: number;
  active: number;
  onSelect: (index: number) => void;
}) {
  if (count <= 0) return null;
  return (
    <View accessibilityRole="tablist" style={styles.dots}>
      {Array.from({ length: count }, (_, i) => (
        <Pressable
          key={i}
          accessibilityRole="tab"
          accessibilityState={{ selected: i === active }}
          accessibilityLabel={`Deck ${i + 1}`}
          hitSlop={6}
          onPress={() => onSelect(i)}
          style={styles.dotHit}
        >
          <View style={[styles.dot, i === active && styles.dotActive]} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  heading: {
    gap: 2,
    alignItems: 'center',
    paddingTop: theme.spacing.two,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.three,
  },
  dotHit: {
    padding: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  dotActive: {
    width: 22,
    backgroundColor: theme.colors.street,
  },
  actions: {
    gap: theme.spacing.two,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: theme.spacing.two,
  },
  detailChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.three,
    paddingVertical: 6,
  },
}));
