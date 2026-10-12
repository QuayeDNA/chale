import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { DeckSheet } from '@/components/deck-sheet';
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
import { PREMIUM_DECKS } from '@/decks/storefront';
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
    const all: DeckSummary[] = decks.data ?? [];
    const needle = query.trim().toLowerCase();
    return all.filter((deck) => {
      if (filter === 'store') return false;
      if (filter !== 'all' && deck.relationship_type !== filter) return false;
      if (!needle) return true;
      return `${deck.title} ${deck.tagline ?? ''}`.toLowerCase().includes(needle);
    });
  }, [decks.data, filter, query]);

  // The rail must never point past its own list when filtering narrows it.
  const safeActive = visible.length === 0 ? 0 : Math.min(active, visible.length - 1);
  // Interacting with a deck opens the sheet rather than pushing the deck
  // route: the sheet is where the shopper decides HOW to play, so a push
  // would only ask the same question one screen later.
  const openDeck = (deck: DeckSummary) => setPeeked(deck);
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
        freeCount={decks.data ? decks.data.length : null}
        premiumCount={PREMIUM_DECKS.length}
      />
      <View style={styles.controls}>
        <SearchBar value={query} onChange={setQuery} placeholder="Search decks" />
        <SegmentedControl options={VIEW_OPTIONS} value={view} onChange={setView} />
      </View>
      <FilterChips options={FILTER_OPTIONS} value={filter} onChange={setFilter} bleed />
      {view === 'flow' ? (
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
      {visible.length === 0 ? (
        <Text variant="body" muted style={styles.empty}>
          No decks match that. Try another word.
        </Text>
      ) : null}
      {/* The shelf is only browsable when the shopper has not narrowed to a
          relationship or a search — a filtered grid should not quietly gain a
          shelf of packs that were filtered out of it. */}
      {!query.trim() && (filter === 'all' || filter === 'store') ? (
        <StorefrontShop />
      ) : null}
      <DeckSheet
        deck={peeked}
        samples={samples.data ?? []}
        onPlay={playDeck}
        onOpenChange={(open) => {
          if (!open) setPeeked(null);
        }}
      />
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
