import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';

import { DeckSpread } from '@/components/deck-spread';
import { Text } from '@/components/ui/text';
import { Screen } from '@/components/screen';
import { listDecks } from '@/lib/decks';

/**
 * Board ref1 screen 4 "Select Deck". A thin shell: the query resolves the deck
 * list, then the shared DeckSpread takes over. Tapping any home tile lands
 * here already positioned on that deck, so the tiles are a shortcut into the
 * spread rather than a separate flow.
 */
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
