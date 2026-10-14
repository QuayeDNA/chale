import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { LucideIcon } from '@/components/ui/icon';
import { LoadingBar } from '@/components/ui/loading-bar';
import { Text } from '@/components/ui/text';

type Props = {
  index: number;
  total: number;
};

/**
 * How far through the deck you are.
 *
 * The question card also carries a "12 / 20", and that is deliberate rather
 * than duplicated: the card's number tells you which question you are looking
 * at, this one tells you how much is left, and the rail between them is the
 * only thing on the page you read without reading any words.
 *
 * It borrows the app's own progress bar rather than drawing a plain view, with
 * its label overridden — the component announces itself as "Loading" otherwise,
 * which is not true of anything on this screen.
 */
export function SessionProgress({ index, total }: Props) {
  const { theme } = useUnistyles();
  const safeTotal = Math.max(total, 1);
  const done = Math.min(Math.max(index, 0), safeTotal);
  const percent = Math.round((done / safeTotal) * 100);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text variant="caption" muted>
          Question {done} of {total}
        </Text>
        <Text variant="caption" muted>
          {percent}%
        </Text>
      </View>
      <LoadingBar
        size="sm"
        progress={done / safeTotal}
        fill={theme.colors.ink}
        track={theme.colors.border}
        accessibilityLabel={`Question ${done} of ${total}, ${percent}% through the deck`}
      />
    </View>
  );
}

/**
 * The one instruction that makes an in-person session work. Two people, one
 * phone, no typing — without this the screen looks like it has forgotten to
 * offer an answer box, and somebody will look for one.
 */
export function SessionHint() {
  return (
    <View style={styles.hint}>
      <LucideIcon name="mic" size={16} color={styles.hintIcon.color} />
      <Text variant="caption" muted style={styles.hintText}>
        Read it out loud, then take turns. Nobody types here; the phone just keeps the
        questions coming.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrap: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.two,
    paddingHorizontal: theme.spacing.one,
  },
  hintIcon: {
    color: theme.colors.muted,
    // Optically centres the glyph on the first line of the wrapped caption.
    marginTop: 1,
  },
  hintText: {
    flex: 1,
  },
}));