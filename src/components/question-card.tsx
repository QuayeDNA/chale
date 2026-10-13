import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { CardMark } from './card-mark';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { LucideIcon, type ShowcaseIconName } from './ui/icon';
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
  /**
   * Empty collapses Previous to a square arrow-only button, which is what the
   * last card uses so "Finish — back home" gets the rest of the row.
   */
  prevLabel?: string;
  nextLabel?: string;
  /** Swapped for the home glyph when the session is being finished. */
  nextIcon?: ShowcaseIconName;
  deckIcon?: ShowcaseIconName;
  hideNavigation?: boolean;
  inPerson?: boolean;
};

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
  prevLabel = 'Previous',
  nextLabel = 'Next',
  nextIcon = 'chevron',
  deckIcon,
  hideNavigation = false,
  inPerson = false,
}: Props) {
  const showCounter = index !== undefined && total !== undefined;
  const prevIconOnly = !prevLabel;

  return (
    <View style={styles.wrapper}>
      <View style={styles.panel}>
        <CardMark icon={deckIcon} tint={markTint(deckTone)} size={MARK_SIZE} crop={MARK_CROP} />
        <View style={styles.header}>
          {deckLabel ? <Badge label={deckLabel} tone={deckTone} icon="heart" /> : null}
          {showCounter ? (
            <Text variant="body" muted style={styles.counter}>
              {index} / {total}
            </Text>
          ) : null}
        </View>
        <Text
          variant="bodyStrong"
          style={inPerson ? styles.questionInPerson : styles.question}
          numberOfLines={4}
        >
          {question}
        </Text>
        {onToggleFavourite ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isFavourite ? 'Saved to favourites' : 'Save this question'}
            accessibilityState={{ selected: isFavourite }}
            hitSlop={8}
            onPress={onToggleFavourite}
            style={[styles.favourite, isFavourite && styles.favouriteOn]}>
            <LucideIcon
              name="heart"
              size={20}
              color={isFavourite ? '#D85A30' : '#8A7562'}
              filled={isFavourite}
            />
            <Text variant="bodyStrong" style={styles.favouriteText}>
              {isFavourite ? 'Saved to favourites' : 'Save this question'}
            </Text>
          </Pressable>
        ) : null}
        {hideNavigation ? null : (
          <View style={styles.nav}>
            {/*
              Previous has two shapes and they are different elements, not one
              Button squeezed. The labelled one shares the row equally. The
              arrow-only one is a fixed square: giving the Button a zero-width
              wrapper is what painted its icon over Next, because a `fullWidth`
              (100%) child of an auto-sized parent has nothing to resolve
              against. A fixed square has a real width, so there is nothing to
              collapse and nothing to overlap.
            */}
            {prevIconOnly ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous question"
                accessibilityState={{ disabled: prevDisabled }}
                disabled={prevDisabled}
                onPress={onPrevious}
                style={({ pressed }) => [
                  styles.prevSquare,
                  prevDisabled && styles.prevSquareDisabled,
                  pressed && styles.prevSquarePressed,
                ]}>
                <LucideIcon name="chevron-left" size={22} color={ARROW_COLOR} />
              </Pressable>
            ) : (
              <View style={styles.prev}>
                <Button
                  label={prevLabel}
                  variant="inverseOutline"
                  icon="chevron-left"
                  fullWidth
                  disabled={prevDisabled}
                  onPress={onPrevious}
                />
              </View>
            )}
            <View style={styles.next}>
              <Button
                label={nextLabel}
                variant="inverse"
                icon={nextIcon}
                iconPosition="right"
                fullWidth
                disabled={nextDisabled}
                onPress={onNext}
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const MARK_SIZE = 168;
const MARK_CROP = 34;
/** Matches Button's `md` height, so the arrow square and Next sit flush. */
const NAV_HEIGHT = 52;
/** Same ink as the inverseOutline Button's border and glyph. */
const ARROW_COLOR = '#2B1A0F';

function markTint(tone: DeckTone) {
  return MARK_TINT[tone] ?? 'rgba(138, 117, 98, 0.16)';
}

const MARK_TINT: Record<DeckTone, string> = {
  partner: 'rgba(216, 90, 48, 0.18)',
  family: 'rgba(99, 153, 34, 0.18)',
  friend: 'rgba(212, 83, 126, 0.18)',
  street: 'rgba(176, 124, 0, 0.22)',
  muted: 'rgba(138, 117, 98, 0.16)',
};

const styles = StyleSheet.create((theme) => ({
  wrapper: {},
  panel: {
    overflow: 'hidden',
    borderRadius: theme.radii.hero,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: 20,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counter: {
    fontSize: 14,
    lineHeight: 18,
  },
  question: {
    fontSize: 27,
    lineHeight: 30,
    letterSpacing: -0.6,
    minHeight: 150,
    textAlignVertical: 'center',
    flexGrow: 1,
  },
  questionInPerson: {
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.7,
    minHeight: 190,
    textAlignVertical: 'center',
    flexGrow: 1,
  },
  favourite: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 12,
    borderRadius: theme.radii.pill,
  },
  favouriteOn: {
    backgroundColor: 'rgba(216, 90, 48, 0.10)',
  },
  favouriteText: {
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.muted,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  // Both shapes of Previous and Next use the same explicit basis of 0 with
  // minWidth 0, so a long label can never push its sibling out of the row.
  prev: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  // A real, fixed width: nothing for a child's 100% to be circular about.
  prevSquare: {
    width: NAV_HEIGHT,
    height: NAV_HEIGHT,
    flexGrow: 0,
    flexShrink: 0,
    borderRadius: theme.radii.card,
    borderWidth: 1.5,
    borderColor: ARROW_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevSquareDisabled: {
    opacity: 0.35,
  },
  prevSquarePressed: {
    opacity: 0.7,
  },
  next: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
  },
}));