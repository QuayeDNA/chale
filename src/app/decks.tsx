import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { DeckSheet } from '@/components/deck-sheet';
import { DecksSkeleton } from '@/components/decks-skeleton';
import { ErrorCard } from '@/components/error-card';
import { Screen } from '@/components/screen';
import { StorefrontGridView } from '@/components/storefront-grid-view';
import { StorefrontListView } from '@/components/storefront-list-view';
import { StorefrontShop } from '@/components/storefront-shop';
import { StorefrontFlowView } from '@/components/storefront-flow-view';
import { StorefrontHeader } from '@/components/storefront-header';
import { FilterChips, type ChipOption } from '@/components/ui/filter-chips';
import { SearchBar } from '@/components/ui/search-bar';
import {
  SegmentedControl,
  type SegmentOption,
} from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { drawSessionQuestions, listDecks, type DeckSummary } from '@/lib/decks';

export type StorefrontView = 'flow' | 'grid' | 'list';
export type StorefrontFilter = 'all' | 'partner' | 'family' | 'friend' | 'store';

const VIEW_OPTIONS: SegmentOption<StorefrontView>[] = [
  { value: 'flow', icon: 'layers', label: 'Flow' },
  { value: 'grid', icon: 'grid', label: 'Grid' },
  { value: 'list', icon: 'list', label: 'List' },
];

const FILTER_OPTIONS: ChipOption<StorefrontFilter>[] = [
  { value: 'all', label: 'All', tone: 'street' },
  { value: 'partner', label: 'Partners', tone: 'partner' },
  { value: 'family', label: 'Family', tone: 'family' },
  { value: 'friend', label: 'Friends', tone: 'friend' },
  { value: 'store', label: 'Shop', tone: 'muted' },
];

/**
 * All decks — the catalogue storefront. Rebuilt section by section from the
 * storefront concept: header + controls first, views (flow / grid / list),
 * premium shop, and the detail sheet land next.
 */
export default function DecksScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [view, setView] = useState<StorefrontView>('flow');
  const [filter, setFilter] = useState<StorefrontFilter>('all');
  const [active, setActive] = useState(0);
  const [peeked, setPeeked] = useState<DeckSummary | null>(null);
  const closingFor = useRef<ReturnType<typeof setTimeout> | null>(null);
  const decks = useQuery({ queryKey: ['decks'], queryFn: listDecks });

  // A peek, not a session: three questions drawn the same way a session draws
  // them, so the sheet shows the real content rather than mock copy. Keyed by
  // deck so switching decks swaps the samples.
  const samples = useQuery({
    queryKey: ['decks', peeked?.id, 'samples'],
    queryFn: () => drawSessionQuestions(peeked!.id, 3),
    enabled: !!peeked,
  });

  // Search and the relationship chips narrow one list; the carousel reads from
  // the same list, so a filtered rail only holds the decks that match.
  const visible = useMemo(() => {
    // Locked packs are a shelf, not a playable deck: keep them out of the
    // searchable grid so every card the shopper can open actually opens.
    const free: DeckSummary[] = (decks.data ?? []).filter((deck) => !deck.is_locked);
    const needle = query.trim().toLowerCase();
    return free.filter((deck) => {
      if (filter === 'store') return false;
      if (filter !== 'all' && deck.relationship_type !== filter) return false;
      if (!needle) return true;
      return `${deck.title} ${deck.tagline ?? ''}`.toLowerCase().includes(needle);
    });
  }, [decks.data, filter, query]);

  const freeCount = decks.data ? decks.data.filter((deck) => !deck.is_locked).length : null;
  const lockedDecks = (decks.data ?? []).filter((deck) => deck.is_locked);

  // The rail must never point past its own list when filtering narrows it.
  const safeActive = visible.length === 0 ? 0 : Math.min(active, visible.length - 1);
  // Interacting with a deck opens the sheet rather than pushing the deck
  // route: the sheet is where the shopper decides HOW to play, so a push
  // would only ask the same question one screen later.
  const openDeck = (deck: DeckSummary) => {
    // A close is already in flight (the shopper tapped a neighbour fast enough
    // to reopen before the sheet finished sliding); it must not steal this deck.
    if (closingFor.current) {
      clearTimeout(closingFor.current);
      closingFor.current = null;
    }
    setPeeked(deck);
  };

  /**
   * Closing is deferred, on purpose.
   *
   * On iOS the sheet stashes the pending action and only runs it once the
   * Modal reports it has finished dismissing, because starting a navigation
   * while a modal is still on screen drops it silently. That deferral lives in
   * the sheet, so whatever opened it has to outlive the dismissal too —
   * clearing `peeked` on the same frame `open` flips unmounts the sheet
   * mid-slide, `onDismiss` never fires, and tapping Start questions does
   * nothing at all. The wait is longer than the 220ms slide so the modal has
   * always reported back first.
   */
  const closeSheet = (open: boolean) => {
    if (open) return;
    if (closingFor.current) clearTimeout(closingFor.current);
    closingFor.current = setTimeout(() => {
      closingFor.current = null;
      setPeeked(null);
    }, 280);
  };

  // A sheet still on its way out when the screen goes away would otherwise set
  // state on an unmounted component.
  useEffect(
    () => () => {
      if (closingFor.current) clearTimeout(closingFor.current);
    },
    [],
  );

  const playDeck = (deck: DeckSummary, mode: 'inperson' | 'remote') => {
    if (mode === 'remote') {
      router.push({ pathname: '/start', params: { deck: deck.id, deckTitle: deck.title } });
      return;
    }
    router.push(`/session?pack=${deck.id}`);
  };

  return (
    <Screen align="start">
      <StorefrontHeader
        freeCount={freeCount}
        premiumCount={decks.data ? lockedDecks.length : null}
      />
      <View style={styles.controls}>
        <SearchBar value={query} onChange={setQuery} placeholder="Search decks" />
        <SegmentedControl options={VIEW_OPTIONS} value={view} onChange={setView} />
      </View>
      <FilterChips options={FILTER_OPTIONS} value={filter} onChange={setFilter} bleed />
      {/*
        Nothing to draw means a skeleton, never an empty catalogue. `isPending`
        covers the first load and a hard cache miss; the refetch cases keep the
        cards on screen rather than blanking a page the shopper can already read.
      */}
      {decks.isPending ? (
        <DecksSkeleton view={view} />
      ) : decks.isError ? (
        <ErrorCard
          icon="palette"
          title="Couldn't reach the catalogue"
          body="Every deck lives on the server, so there is nothing to browse until it answers."
          onRetry={() => void decks.refetch()}
        />
      ) : view === 'flow' ? (
        <StorefrontFlowView
          decks={visible}
          active={safeActive}
          onActiveChange={setActive}
          onOpenDeck={openDeck}
        />
      ) : view === 'grid' ? (
        <StorefrontGridView decks={visible} onOpenDeck={openDeck} />
      ) : view === 'list' ? (
        <StorefrontListView decks={visible} onOpenDeck={openDeck} />
      ) : null}
      {/*
        The no-match line is a judgement about the shopper's own filters, so it
        must not appear while the list is still on its way — an empty `visible`
        is also what a pending or failed query looks like.
      */}
      {!decks.isPending && !decks.isError && filter !== 'store' && visible.length === 0 ? (
        <Text variant="body" muted style={styles.empty}>
          No decks match that. Try another word.
        </Text>
      ) : null}
      {/* The shelf is only browsable when the shopper has not narrowed to a
          relationship or a search — a filtered grid should not quietly gain a
          shelf of packs that were filtered out of it. */}
      {!query.trim() && (filter === 'all' || filter === 'store') ? (
        <StorefrontShop decks={lockedDecks} />
      ) : null}
      {/*
        Mounted only once a deck is picked. Closed, it is still a component that
        reads AsyncStorage for the remembered play mode and measures the window,
        and that work lands in the middle of the navigation transition — on the
        exact frame the screen is trying to get on screen.
      */}
      {peeked ? (
        <DeckSheet
          deck={peeked}
          samples={samples.data ?? []}
          onPlay={playDeck}
          onOpenChange={closeSheet}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.two,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: theme.spacing.six,
    paddingHorizontal: theme.spacing.five,
  },
}));
