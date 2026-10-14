import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { CardMark } from './card-mark';
import { artFor, gradientFor, iconName, toneName } from '@/decks/art';
import type { DeckSummary } from '@/lib/decks';

import { Button } from './ui/button';
import { Text } from './ui/text';

/** Same geometry as the resume tray's watermark at this card size. */
const MARK_SIZE = 210;
const MARK_CROP = 44;

/**
 * What to play next, in the slot the invite card used to hold.
 *
 * Two shapes of the same card. `continuing` is the reward for finishing a
 * deck via "Back home": the deck you just played, with the honest number of
 * questions its shuffle still holds. Without a completion it is the default
 * starting deck — the same card, one step quieter, so the slot always has a
 * job to do once the invite has been dismissed.
 *
 * A gradient deck card, like the resume tray, because it belongs to the
 * catalogue rather than to the day — the daily card above it is the one that
 * must read as "today", and this must not compete with it.
 */
export function NextUpCard({
  deck,
  freshLeft,
  continuing,
  onPress,
}: {
  deck: DeckSummary;
  /** Unheard questions left in the deck's current shuffle. */
  freshLeft: number;
  /** True when a completed deck is being continued, false for the default pick. */
  continuing: boolean;
  onPress: () => void;
}) {
  const art = artFor({
    slug: deck.slug,
    tone: toneName(deck.tone),
    art_key: deck.art_key,
  });
  const ink = art.ink ?? '#FFF9E8';
  const colors = gradientFor(toneName(deck.tone));

  const singleSitting = deck.question_count <= deck.session_length;
  const note = !continuing
    ? singleSitting
      ? `${deck.question_count} questions in one sitting`
      : `${deck.session_length} questions a session`
    : freshLeft === 0
      ? 'Every question heard — the next session is a fresh shuffle.'
      : `${freshLeft} fresh question${freshLeft === 1 ? '' : 's'} left in this shuffle.`;

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[...colors]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.wash}
        pointerEvents="none"
      />
      <CardMark
        icon={iconName(deck.icon)}
        tint="rgba(255, 255, 255, 0.13)"
        size={MARK_SIZE}
        crop={MARK_CROP}
        edge="bottom-right"
      />
      <View style={styles.body}>
        <Text variant="smallBold" style={[styles.eyebrow, { color: ink }]}>
          {continuing ? 'Keep going' : 'Start here'}
        </Text>
        <Text variant="title" numberOfLines={2} style={[styles.title, { color: ink }]}>
          {deck.title}
        </Text>
      </View>
      <View style={styles.footer}>
        <Text variant="small" numberOfLines={2} style={[styles.note, { color: ink }]}>
          {note}
        </Text>
        {/* Button drops `style` from its props, so a filling button needs a
            wrapper — same rule as the resume tray. */}
        <View style={styles.go}>
          <Button label={continuing ? 'Play next' : 'Play'} variant="paper" size="sm" onPress={onPress} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create(() => ({
  // 26pt radius and the min height mirror the daily card so the slot does not
  // change the shape of the top of the screen when the invite is dismissed.
  card: {
    minHeight: 172,
    borderRadius: 26,
    padding: 24,
    overflow: 'hidden',
    justifyContent: 'space-between',
    gap: 16,
  },
  wash: {
    ...StyleSheet.absoluteFillObject,
  },
  body: {
    gap: 4,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontSize: 11,
    lineHeight: 15,
    opacity: 0.85,
  },
  title: {
    fontSize: 22,
    lineHeight: 26,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  note: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.85,
  },
  go: {
    flexShrink: 0,
  },
}));
