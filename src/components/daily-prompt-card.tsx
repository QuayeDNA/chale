import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Button } from './ui/button';
import { Card } from './ui/card';
import { LucideIcon, type ShowcaseIconName } from './ui/icon';
import { Text } from './ui/text';

/**
 * Where today's remote question stands.
 *
 * Two presentations, and the split is the whole design: a day that is waiting
 * on you gets a Card at the top of home, a day that is idle gets one slim row
 * down with the other secondary affordances. Sizing by state count instead —
 * which is what a single "card, five copy variants" invites — gives "you have
 * no connection" the same 200pt hero as "their answer is waiting", and the top
 * of the screen stops meaning anything.
 *
 * Copy is board language (ref1 screens 11 and 12, and the reveal screen) and
 * lives in tables below so the whole day can be read and kept consistent at a
 * glance.
 */
export type ActiveDailyPromptState = 'unanswered' | 'reveal';
export type IdleDailyPromptState = 'no-connection' | 'not-drawn' | 'waiting';
export type DailyPromptState = ActiveDailyPromptState | IdleDailyPromptState;

/** Only these earn a Card. Everything else is a row. */
export function isActiveDailyState(state: DailyPromptState): state is ActiveDailyPromptState {
  return state === 'unanswered' || state === 'reveal';
}

type Copy = { icon: ShowcaseIconName; title: string; body: string; action: string; emphasis?: boolean };

const CARD_COPY: Record<ActiveDailyPromptState, Copy> = {
  unanswered: {
    icon: 'message',
    // The question itself is the headline here — there is nothing to describe
    // it with that the words do not already say.
    title: '',
    body: 'Waiting on you.',
    action: 'Answer it',
  },
  reveal: {
    icon: 'heart',
    title: 'Both answered!',
    body: 'Ready to see what your person wrote?',
    action: 'Reveal',
    // The reveal is the only state where something actually arrived, so it is
    // the only one that gets an inverted tile. Making every state equally loud
    // would mean the payoff lands like a footnote.
    emphasis: true,
  },
};

const ROW_COPY: Record<IdleDailyPromptState, { icon: ShowcaseIconName; label: string }> = {
  // Board screen 5 asks "Not close right now?" before offering the button, so
  // the row says the reason first and lets the tap be obvious. `people` rather
  // than `invite` because this row is the way into the Remote tab, not just
  // into the invite half of that screen.
  'no-connection': { icon: 'people', label: 'Play with someone far away' },
  'not-drawn': { icon: 'sparkles', label: 'Today’s question is ready' },
  waiting: { icon: 'clock', label: 'Waiting on them…' },
};

/**
 * The urgent half: the day is waiting on you. Rendered above the deck grid.
 */
export function DailyPromptCard({
  state,
  question,
  onAction,
}: {
  state: ActiveDailyPromptState;
  /** Only used by `unanswered`, where the question is the headline. */
  question?: string | null;
  onAction: () => void;
}) {
  const copy = CARD_COPY[state];

  return (
    <Card>
      <View style={styles.row}>
        <View
          style={[styles.tile, { backgroundColor: copy.emphasis ? INK : STREET }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <LucideIcon name={copy.icon} size={22} color={copy.emphasis ? STREET : INK} />
        </View>

        <View style={styles.copy}>
          <Text variant="smallBold" muted style={styles.eyebrow}>
            Today
          </Text>
          <Text variant="title" numberOfLines={3}>
            {state === 'unanswered' ? question : copy.title}
          </Text>
        </View>
      </View>

      <Text variant="body" muted>
        {copy.body}
      </Text>

      <Button label={copy.action} onPress={onAction} />
    </Card>
  );
}

/**
 * The idle half: nothing is due. Deliberately one line and no button — a row
 * that still needed a call to action would be a Card wearing a hat. Rendered
 * below the deck grid, which is also where promo, featured and paid-deck rows
 * will go, so the screen grows downward instead of getting busier.
 */
export function DailyPromptRow({
  state,
  onPress,
}: {
  state: IdleDailyPromptState;
  onPress: () => void;
}) {
  const copy = ROW_COPY[state];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={copy.label}
      onPress={onPress}
      style={({ pressed }) => [styles.idleRow, pressed && styles.idlePressed]}
    >
      <LucideIcon name={copy.icon} size={18} color={MUTED} />
      <Text variant="bodyStrong" style={styles.idleLabel} numberOfLines={1}>
        {copy.label}
      </Text>
      <LucideIcon name="chevron" size={18} color={MUTED} />
    </Pressable>
  );
}

// Fixed rather than themed, because the inverted gold-on-ink tile is the
// reveal's whole emphasis and has to read identically in light and dark. Muted
// is pinned for the same reason the row's chevron is: these are the two states
// where a themed colour would swing the loudness.
const STREET = '#F5B400';
const INK = '#2B1A0F';
const MUTED = '#8A7562';

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.three,
  },
  tile: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  idleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.three,
    minHeight: 56,
    paddingHorizontal: theme.spacing.three,
    borderRadius: theme.radii.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  idlePressed: {
    opacity: 0.7,
  },
  idleLabel: {
    flex: 1,
  },
}));