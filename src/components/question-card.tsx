import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { LucideIcon } from './ui/icon';
import { Text } from './ui/text';

type DeckTone = 'street' | 'partner' | 'family' | 'friend' | 'muted';

type Props = {
  question: string;
  deckLabel?: string;
  deckTone?: DeckTone;
  index?: number;
  total?: number;
  isFavourite?: boolean;
  onToggleFavourite?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  nextLabel?: string;
  hideNavigation?: boolean;
};

/**
 * Board question card (ref2 §05) — deck chip + counter header,
 * Archivo title, favourite row, Previous/Next pills.
 */
export function QuestionCard({
  question,
  deckLabel,
  deckTone = 'partner',
  index,
  total,
  isFavourite = false,
  onToggleFavourite,
  onPrevious,
  onNext,
  prevDisabled = false,
  nextDisabled = false,
  nextLabel = 'Next',
  hideNavigation = false,
}: Props) {
  const showCounter = index !== undefined && total !== undefined;
  return (
    <View style={styles.wrapper}>
      <Card>
        <View style={styles.header}>
          {deckLabel ? <Badge label={deckLabel} tone={deckTone} icon="heart" /> : null}
          {showCounter ? (
            <Text variant="caption" muted>
              {index} / {total}
            </Text>
          ) : null}
        </View>
        <Text variant="title">{question}</Text>
        {onToggleFavourite ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isFavourite ? 'Remove from favourites' : 'Save to favourites'}
            accessibilityState={{ selected: isFavourite }}
            hitSlop={8}
            onPress={onToggleFavourite}
            style={styles.favourite}>
            <LucideIcon
              name="heart"
              size={18}
              color={isFavourite ? styles.faved.color : styles.unfaved.color}
              filled={isFavourite}
            />
            <Text variant="caption" muted={!isFavourite}>
              {isFavourite ? 'Favourited' : 'Favourite'}
            </Text>
          </Pressable>
        ) : null}
      </Card>
      {hideNavigation ? null : (
        <View style={styles.nav}>
          <View style={styles.prev}>
            <Button
              label="Previous"
              variant="outline"
              icon="chevron-left"
              fullWidth
              disabled={prevDisabled}
              onPress={onPrevious}
            />
          </View>
          <View style={styles.next}>
            <Button
              label={nextLabel}
              variant="primary"
              icon="chevron"
              iconPosition="right"
              fullWidth
              disabled={nextDisabled}
              onPress={onNext}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrapper: {
    gap: theme.spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  favourite: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  faved: {
    color: '#D85A30',
  },
  unfaved: {
    color: theme.colors.muted,
  },
  nav: {
    flexDirection: 'row',
    gap: 10,
  },
  prev: {
    flex: 1,
  },
  next: {
    flex: 2,
  },
}));
