import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { LucideIcon, type ShowcaseIconName } from '@/components/ui/icon';

/**
 * A deck's mark — the shape that signs every card belonging to it.
 *
 * Six identical rings made six different decks look like one product, and the
 * thing that already tells them apart was being drawn at 28px in the corner.
 * The deck's own icon is far better at that job: a heart over Love, a house
 * over Family, people over Friends. Drawn large enough to be a shape rather
 * than a symbol, and set half outside the card so the radius crops it, it
 * identifies the deck from its outline alone without spending another word.
 *
 * It is deliberately always absolutely positioned in a corner and never
 * interactive — it is decoration, so it carries no accessibility of its own
 * and the card's own label already names the deck.
 *
 * The circle survives as the fallback for a deck that arrives without an icon,
 * which is also what every surface rendered before this existed.
 */
export function CardMark({
  icon,
  tint,
  size = 168,
  crop = 34,
  edge = 'top-right',
  ringSize = 210,
  ringWidth = 28,
}: {
  /** The deck's own icon. Falls back to a plain ring when absent. */
  icon?: ShowcaseIconName;
  /** The wash colour: a relationship tint on paper, white on a deck fill. */
  tint: string;
  size?: number;
  /** How far the mark sits outside the card before the radius clips it. */
  crop?: number;
  /** Which corner it is set into. */
  edge?: 'top-right' | 'bottom-right';
  ringSize?: number;
  ringWidth?: number;
}) {
  const offset = {
    [edge === 'top-right' ? 'top' : 'bottom']: -crop,
    right: -crop,
  };

  return (
    <View pointerEvents="none" style={[styles.mark, offset]}>
      {icon ? (
        <LucideIcon name={icon} size={size} color={tint} />
      ) : (
        <View
          style={[
            styles.ring,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              borderWidth: ringWidth,
              borderColor: tint,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    position: 'absolute',
  },
  ring: {
    // The hairline reads as a stroke rather than an outline because it has no
    // fill of its own.
    backgroundColor: 'transparent',
  },
});