import { View } from 'react-native';

import { StorefrontCard } from '@/components/storefront-card';
import { iconName } from '@/components/ui/icon';
import { ResponsiveGrid } from '@/components/ui/responsive-grid';
import { DECK_INKS, gradientFor } from '@/decks/art';
import type { DeckSummary } from '@/lib/decks';

type Props = {
  decks: DeckSummary[];
  onOpenDeck: (deck: DeckSummary) => void;
};

/** "100 questions · Partners", the meta line every storefront face carries. */
export function deckMeta(deck: DeckSummary): string {
  if (deck.relationship_type === 'family') return `${deck.question_count} questions · Family`;
  if (deck.relationship_type === 'friend') return `${deck.question_count} questions · Friends`;
  return `${deck.question_count} questions · Partners`;
}

/**
 * Storefront grid view — the concept's two-column tile wall. The same
 * StorefrontCard face the coverflow uses, at grid geometry: the card's own
 * aspect ratio gives the height, so the grid only has to supply the columns.
 */
export function StorefrontGridView({ decks, onOpenDeck }: Props) {
  return (
    <ResponsiveGrid minColumnWidth={150} gap={14}>
      {decks.map((deck) => (
        <View key={deck.id}>
          <StorefrontCard
            title={deck.title}
            meta={deckMeta(deck)}
            icon={iconName(deck.icon)}
            colors={gradientFor(deck.tone)}
            ink={DECK_INKS[deck.tone] ?? '#FFF9E8'}
            onPress={() => onOpenDeck(deck)}
          />
        </View>
      ))}
    </ResponsiveGrid>
  );
}