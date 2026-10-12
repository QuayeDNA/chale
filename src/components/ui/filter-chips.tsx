import { Pressable, ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Badge, type BadgeTone } from '@/components/ui/badge';

export type ChipOption<T extends string> = {
  value: T;
  label: string;
  /** Color-codes the chip in the Badge tone language. Defaults to muted. */
  tone?: BadgeTone;
};

type Props<T extends string> = {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /**
   * Breaks out of the screen padding so the row scrolls edge to edge,
   * like the deck carousel. Leave off when nested inside a card.
   */
  bleed?: boolean;
};

/**
 * Single-select filter chips in a horizontal scroll row. The chip itself IS a
 * Badge — the Pressable only supplies the 44pt hit target, and `unselected`
 * gives the quiet surface state a resting chip needs. So the chips and the
 * showcase badges can never drift apart. 44pt targets throughout.
 */
export function FilterChips<T extends string>({ options, value, onChange, bleed }: Props<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.base, bleed && styles.bleed]}
      contentContainerStyle={[styles.row, bleed && styles.rowPad]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            style={styles.chip}
          >
            {/* The Pressable above already announces the label and state, so
                the badge inside is decoration for assistive tech. */}
            <Badge
              label={option.label}
              tone={option.tone ?? 'muted'}
              size="md"
              unselected={!selected}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  // React Native gives every ScrollView `flexGrow: 1, flexShrink: 1`. Inside a
  // column — which is what Screen's content is — flexGrow makes the row eat
  // whatever vertical space is left over, so the gap below the chips grew every
  // time a filter left fewer items on screen. Pin the row to its content.
  base: {
    flexGrow: 0,
    flexShrink: 0,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  // Cancels Screen's own horizontal padding so the row is full bleed;
  // rowPad keeps the first/last chips aligned with the page content.
  bleed: {
    marginHorizontal: -theme.spacing.four,
  },
  rowPad: {
    paddingHorizontal: theme.spacing.four,
  },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
  },
}));
