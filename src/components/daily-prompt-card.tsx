import { useEffect } from 'react';
import type { ViewStyle } from 'react-native';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import { Button } from './ui/button';
import { LucideIcon } from './ui/icon';
import { Text } from './ui/text';

/**
 * Where today's remote question stands — ONE card, five volumes.
 *
 * The redesign moves the boundary. It used to sit between "a Card" and "a slim
 * row", which meant the shape told you how urgent the day was and the top of
 * the screen changed height every time you came back. It now sits between
 * filled and paper: waiting-on-you and reveal-ready are ink and gold with a
 * pulsing dot, and the other three are the same box in paper. Same geometry,
 * same place, different loudness — so the eye learns one spot to look and the
 * card never moves under it.
 *
 * Copy is table-driven so the whole day can be read and kept consistent.
 */
export type DailyPromptState =
  | 'unanswered'
  | 'reveal'
  | 'not-drawn'
  | 'waiting'
  | 'no-connection'
  | 'invite-pending';

/**
 * How loud each state is. `ink` and `gold` are filled and pulse; `paper` and
 * `soft` are the same surface box with a quiet or outlined call to action;
 * `dash` is the empty state, so it is an outline with no fill at all.
 */
type Tone = 'ink' | 'gold' | 'paper' | 'soft' | 'dash';

type Copy = {
  tone: Tone;
  /** Small caps eyebrow. This is the state name, always. */
  eyebrow: string;
  /** The 21px line. Only `unanswered` reads the real question. */
  question?: string | null;
  /** The 12px line under the question: who moved, and when. */
  note: string;
  action: string;
};

const COPY: Record<DailyPromptState, Copy> = {
  unanswered: {
    tone: 'ink',
    eyebrow: 'Waiting on you',
    note: 'They answered first. Yours is still open.',
    action: 'Answer now',
  },
  reveal: {
    tone: 'gold',
    eyebrow: 'Reveal ready',
    question: 'You both answered. See what each of you said.',
    note: 'Everything is waiting on the other side of this.',
    action: 'Reveal together',
  },
  'not-drawn': {
    tone: 'paper',
    eyebrow: 'Today',
    question: 'No question drawn yet today.',
    note: 'Answer apart, reveal together.',
    action: 'Draw one',
  },
  waiting: {
    tone: 'soft',
    eyebrow: 'Waiting on them',
    question: 'You answered. They have until midnight.',
    note: 'We will tell you the moment they do.',
    // No notification exists yet, so this opens the thread where their answer
    // would land rather than pretending to ping them.
    action: 'Open the thread',
  },
  'no-connection': {
    tone: 'dash',
    eyebrow: 'Daily question',
    question: 'Invite your partner to answer one question a day, from anywhere.',
    note: 'No partner linked yet.',
    action: 'Invite partner',
  },
  /**
   * An invite has been sent but not accepted. This is NOT the same as having
   * no partner: the code exists and the ball is in their court, so telling
   * someone to invite a partner they already invited is the kind of small
   * wrongness that makes people stop trusting a screen.
   *
   * `soft`, because it means the same thing as `waiting` — you are waiting on
   * another person. `dash` stays reserved for nothing having happened at all.
   */
  'invite-pending': {
    tone: 'soft',
    eyebrow: 'Waiting for them',
    question: 'Your invite is out. They join with the code you sent.',
    note: 'Nothing starts until they do.',
    action: 'Show my code',
  },
};

/**
 * Fixed rather than themed. These five volumes are the whole design, and a
 * themed fill would change how loud each one is between light and dark — the
 * paper states would stop being the quiet ones on one theme.
 */
const INK = '#2B1A0F';
const PAPER = '#FBF3DF';
const STREET = '#F5B400';
const SURFACE = '#FFF9E8';
const BORDER = '#EDE0BE';
const DASH = '#C9B88F';
const MUTED = '#8A7562';

export function DailyPromptCard({
  state,
  question,
  onAction,
  onHide,
  style,
}: {
  state: DailyPromptState;
  /** Only used by `unanswered`, where the question is the headline. */
  question?: string | null;
  onAction: () => void;
  /**
   * When given, a quiet "Hide" chip joins the eyebrow in the top row — the way
   * to dismiss a state without losing the card's single real action.
   */
  onHide?: () => void;
  /** Pager fill, so tenants of one slot share a height. */
  style?: ViewStyle;
}) {
  const copy = COPY[state];
  const filled = copy.tone === 'ink' || copy.tone === 'gold';

  return (
    <View style={[styles.card, tone(copy.tone), style]}>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.eyebrowRow}>
            <PulseDot color={foreground(copy.tone)} pulse={filled} />
            <Text variant="smallBold" style={[styles.eyebrow, { color: foreground(copy.tone) }]}>
              {copy.eyebrow}
            </Text>
          </View>
          {onHide ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Hide this card"
              hitSlop={8}
              onPress={onHide}
              style={({ pressed }) => [styles.hideChip, pressed && styles.hideChipPressed]}>
              <LucideIcon name="eye" size={14} color={MUTED} />
              <Text variant="caption" style={styles.hideLabel}>
                Hide
              </Text>
            </Pressable>
          ) : null}
        </View>

        <Text
          variant="title"
          numberOfLines={3}
          style={[styles.question, { color: foreground(copy.tone) }]}
        >
          {state === 'unanswered' ? question : copy.question}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text
          variant="small"
          numberOfLines={2}
          style={[styles.note, { color: foreground(copy.tone) }]}
        >
          {copy.note}
        </Text>
        <Button
          label={copy.action}
          icon="chevron"
          iconPosition="right"
          size="sm"
          variant={actionVariant(copy.tone)}
          onPress={onAction}
        />
      </View>
    </View>
  );
}

/**
 * The concept pulses only the loud states. A quiet card that pulses reads as
 * urgent, which would undo the loud/quiet split this component exists to make.
 */
function PulseDot({ color, pulse }: { color: string; pulse: boolean }) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 0 });
    if (pulse && !reduceMotion) {
      opacity.value = withRepeat(
        withTiming(0.25, { duration: 800, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      );
    }
  }, [opacity, pulse, reduceMotion]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.dot, { backgroundColor: color }, dotStyle]}
    />
  );
}

function tone(t: Tone): ViewStyle {
  switch (t) {
    case 'ink':
      return { backgroundColor: INK, borderWidth: 0 };
    case 'gold':
      return { backgroundColor: STREET, borderWidth: 0 };
    case 'paper':
      return { backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER };
    case 'soft':
      return { backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER };
    case 'dash':
      return {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: DASH,
        borderStyle: 'dashed',
      };
  }
}

function foreground(t: Tone): string {
  // Only the ink card inverts; gold is already dark-on-yellow.
  return t === 'ink' ? PAPER : INK;
}

function actionVariant(t: Tone): 'primary' | 'inverse' | 'inverseOutline' {
  // The card's call to action is the opposite of the card. Street on ink, ink
  // on gold and paper, an outline on the two quietest states.
  if (t === 'ink') return 'primary';
  if (t === 'soft' || t === 'dash') return 'inverseOutline';
  return 'inverse';
}

const styles = StyleSheet.create((theme) => ({
  // 26pt radius and 172pt min height are the concept's, and the min height is
  // what keeps the box the same size in all five states — the card must not
  // jump when the day changes.
  card: {
    minHeight: 172,
    borderRadius: 26,
    padding: theme.spacing.four,
    justifyContent: 'space-between',
    gap: theme.spacing.three,
  },
  body: {
    gap: theme.spacing.two,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.two,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.two,
  },
  // A ghost chip, not a button: it retires the state, and retiring a state must
  // never look as loud as the card's one real action. Pill + 1px dash border
  // borrows the card's own quiet language; pressed just dims.
  hideChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: DASH,
  },
  hideChipPressed: {
    opacity: 0.6,
  },
  hideLabel: {
    color: MUTED,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontSize: 11,
    lineHeight: 15,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  question: {
    fontSize: 21,
    lineHeight: 25,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.three,
  },
  note: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.72,
  },
}));
