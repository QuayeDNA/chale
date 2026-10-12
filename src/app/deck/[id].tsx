import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetOption, useSheetAction } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { Screen } from '@/components/screen';
import { usePlayMode, type PlayMode } from '@/hooks/use-play-mode';
import { artFor, deckCountCopy, toneName } from '@/decks/art';
import { listDecks, type DeckSummary } from '@/lib/decks';

/**
 * Board ref1 screen 4 "Select Deck": a swipeable spread of deck cards with a
 * dot pager. Tapping any home tile lands here already positioned on that deck,
 * so the tiles are a shortcut into the spread rather than a separate flow.
 *
 * Card depth, splay and face tilt are all derived from scrollX on the UI
 * thread — see DeckStackCard.
 *
 * The screen's only job is choosing a deck. How they play it is a separate
 * decision, so it lives in a sheet over the spread rather than as more
 * buttons underneath it — see PlayModeSheet.
 */

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<DeckSummary>);

/** Card width as a share of the screen, leaving neighbours peeking at the edges. */
const CARD_WIDTH_RATIO = 0.62;
const CARD_MAX_WIDTH = 260;
/**
 * Clear space either side of a card. The face tilts and its edges fan, so each
 * cell needs room of its own; without it the neighbours collide. The step is
 * card + twice the bleed, so the list never overlaps cards itself.
 */
const BLEED = 26;

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
  return <DeckSpread decks={decks.data} startIndex={startIndex} deckId={id} />;
}

function DeckSpread({
  decks,
  startIndex,
  deckId,
}: {
  decks: DeckSummary[];
  startIndex: number;
  deckId: string | undefined;
}) {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { mode, remember, ready, choose } = usePlayMode();
  const [sheetOpen, setSheetOpen] = useState(false);

  const cardWidth = Math.min(screenWidth * CARD_WIDTH_RATIO, CARD_MAX_WIDTH);
  // Card centres sit one card-plus-bleed apart, so the spread never overlaps
  // itself but a neighbour always peeks in from each screen edge.
  const step = cardWidth + BLEED * 2;

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

  // initialScrollIndex only applies on mount, so a deep link that lands while
  // the spread is already open (pushing the same route again from a tile) would
  // otherwise leave the carousel showing the previous deck.
  useEffect(() => {
    const index = decks.findIndex((d) => d.id === deckId);
    if (index < 0 || index === active) return;
    // Deferred a tick: calling setState synchronously in an effect body
    // cascades renders (react-hooks/set-state-in-effect).
    const timer = setTimeout(() => goTo(index), 0);
    return () => clearTimeout(timer);
  }, [active, deckId, decks, goTo]);

  const renderItem = useCallback(
    ({ item, index }: { item: DeckSummary; index: number }) => (
      <DeckStackCard
        deck={item}
        index={index}
        step={step}
        scrollX={scrollX}
        width={cardWidth}
        onPress={() => goTo(index)}
      />
    ),
    [cardWidth, goTo, scrollX, step],
  );

  const selected = decks[active] ?? decks[startIndex];
  const art = selected
    ? artFor({ slug: selected.slug, tone: toneName(selected.tone), art_key: selected.art_key })
    : null;

  /**
   * Pushing, not replacing: back from a session returns to the spread, which
   * is the natural undo if the wrong deck was picked.
   */
  const start = useCallback(
    (play: PlayMode) => {
      if (play === 'inperson') {
        router.push({ pathname: '/session', params: { pack: selected.id } });
      } else {
        // The deck travels to /start and gets pinned to the connection, so
        // "Deep Talks -> remote" still means Deep Talks. The title rides along
        // too: pairing is a commitment to a deck, so name it.
        router.push({
          pathname: '/start',
          params: { deck: selected.id, deckTitle: selected.title },
        });
      }
    },
    [router, selected],
  );

  const primaryLabel = mode === 'inperson' ? 'Start in person' : 'Send remotely';

  // The sheet is the only place a mode can be remembered: the CTA and its
  // override are one-shot starts that leave the preference exactly as it was.
  const commit = useCallback(
    (play: PlayMode, rememberIt: boolean) => {
      choose(play, rememberIt);
      start(play);
    },
    [choose, start],
  );

  return (
    <Screen align="start">
      <View style={styles.heading}>
        <Text variant="title">Choose a deck</Text>
        <Text variant="caption" muted>
          Each session draws {selected.session_length} questions at random.
        </Text>
      </View>

      {/* The spread runs edge to edge: Screen insets its content, which would
          otherwise stop the neighbouring cards before they reach the screen
          edge. The bleed above the padding is what makes them peek in. */}
      <View style={styles.carousel}>
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
          onMomentumScrollEnd={(e) =>
            setActive(Math.round(e.nativeEvent.contentOffset.x / step))
          }
          // Centres the first cell so the selected deck sits dead centre.
          contentContainerStyle={{ paddingHorizontal: (screenWidth - step) / 2 }}
          getItemLayout={(_, index) => ({ length: step, offset: step * index, index })}
        />
      </View>

      <DotPager count={decks.length} active={active} onSelect={goTo} />

      <View style={styles.actions}>
        {/* Nothing renders until the stored preference has been read, so the
            CTA never flashes the wrong mode on a cold start. */}
        {ready && (
          <Button
            label={mode ? primaryLabel : 'How do you want to play?'}
            onPress={() => (mode ? start(mode) : setSheetOpen(true))}
          />
        )}

        {/* Exactly one override, and only when there is something to override.
            A remembered mode must never trap the user in it. Choosing here
            applies to this deck only and deliberately leaves the preference
            alone. */}
        {mode && (
          <Pressable
            accessibilityRole="button"
            onPress={() => start(mode === 'inperson' ? 'remote' : 'inperson')}
            style={styles.override}
          >
            <Text variant="small" muted>
              {mode === 'inperson' ? 'Send it remotely instead' : 'Play in person instead'}
            </Text>
          </Pressable>
        )}

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

      <Sheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="How do you want to play?"
        caption={`${selected.title} · ${selected.session_length} questions a session`}
      >
        <PlayModeSheet
          deckTitle={selected.title}
          sessionLength={selected.session_length}
          remember={remember}
          onCommit={commit}
        />
      </Sheet>
    </Screen>
  );
}

/**
 * The sheet's body. Mounted only while the sheet is open (RN's Modal renders
 * nothing when closed), so it can own a draft of the remember flag without
 * resetting it between openings. It is seeded from the screen's already-loaded
 * value rather than reading storage again, so the box never renders unchecked
 * and then flips.
 */
function PlayModeSheet({
  deckTitle,
  sessionLength,
  remember,
  onCommit,
}: {
  deckTitle: string;
  sessionLength: number;
  remember: boolean;
  onCommit: (mode: PlayMode, remember: boolean) => void;
}) {
  const [rememberDraft, setRememberDraft] = useState(remember);
  const run = useSheetAction();

  const pick = (mode: PlayMode) => run(() => onCommit(mode, rememberDraft));

  return (
    <>
      <SheetOption
        icon="people"
        label="Just the two of us"
        hint={`One device, ${sessionLength} questions, you take turns.`}
        onPress={() => pick('inperson')}
      />
      <SheetOption
        icon="invite"
        label="Send it remotely"
        hint={`Get an invite code, then ${deckTitle} arrives a day at a time.`}
        onPress={() => pick('remote')}
      />
      <Checkbox
        checked={rememberDraft}
        onChange={setRememberDraft}
        label="Remember my choice"
        hint="Skips this next time. You can still change it any time."
      />
    </>
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
  // Cancels Screen's own horizontal padding so the carousel is full bleed.
  carousel: {
    marginHorizontal: -theme.spacing.four,
  },
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
  override: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
