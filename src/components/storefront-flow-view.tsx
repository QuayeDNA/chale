import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { CoverflowCarousel } from '@/components/coverflow-carousel';
import { DotPager } from '@/components/dot-pager';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import type { DeckSummary } from '@/lib/decks';

type Props = {
  decks: DeckSummary[];
  active: number;
  onActiveChange: (index: number) => void;
  onOpenDeck: (deck: DeckSummary) => void;
};

/**
 * Storefront flow view — the concept's coverflow: the centred deck with its
 * neighbours receding either side, a dot pager, and the play / peek actions
 * for whichever deck is centred.
 */
export function StorefrontFlowView({ decks, active, onActiveChange, onOpenDeck }: Props) {
  const selected = decks[active] ?? decks[0];
  if (!selected) return null;

  return (
    <View style={styles.wrap}>
      <CoverflowCarousel
        decks={decks}
        active={active}
        onActiveChange={onActiveChange}
        onCenterPress={(index) => {
          // Tapping a neighbour brings it to the centre — the rail springs
          // there because this feeds the active index straight back in. Only
          // the card already in the centre is the one you meant to open.
          if (index === active) {
            const picked = decks[index];
            if (picked) onOpenDeck(picked);
          } else {
            onActiveChange(index);
          }
        }}
      />
      <DotPager count={decks.length} active={active} onSelect={onActiveChange} />
      <View style={styles.copy}>
        <Text variant="title">{selected.title}</Text>
        {selected.tagline ? (
          <Text variant="caption" muted style={styles.tagline}>
            {selected.tagline}
          </Text>
        ) : null}
      </View>
      <View style={styles.actions}>
        {/* Button takes no style prop, so the 1:2 split lives on wrappers. */}
        <View style={styles.peek}>
          <Button
            label="Peek"
            icon="layers"
            variant="secondary"
            size="md"
            onPress={() => onOpenDeck(selected)}
          />
        </View>
        <View style={styles.play}>
          <Button
            label="Play deck"
            icon="play"
            size="md"
            onPress={() => onOpenDeck(selected)}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  // The carousel runs edge to edge, so it cancels Screen's own padding.
  wrap: {
    marginHorizontal: -theme.spacing.four,
    gap: theme.spacing.two,
  },
  copy: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.four,
    paddingBottom: theme.spacing.two,
  },
  tagline: {
    textAlign: 'center'
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.two,
    paddingHorizontal: theme.spacing.four,
  },
  peek: {
    flex: 1,
  },
  play: {
    flex: 2,
  },
}));