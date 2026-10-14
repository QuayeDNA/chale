import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import { DECK_INKS, gradientFor, iconName, toneName } from '@/decks/art';
import type { DeckSummary } from '@/lib/decks';

import { LucideIcon } from './ui/icon';
import { Text } from './ui/text';

const FAN_WIDTH = 96;
const FAN_HEIGHT = 78;
const CARD_W = 50;
const CARD_H = 70;
const CARD_MID_H = 76;
/** How far each card after the first steps right, so the three overlap. */
const CARD_STEP = 23;
const OPEN_MS = 260;
const CLOSE_MS = 220;

/**
 * Where each card sits at rest and while the row is held. The concept spreads
 * the outside pair on hover; on a phone the press is the equivalent moment, so
 * the same numbers drive it.
 */
const FAN: { tilt: number; openTilt: number; openX: number }[] = [
  { tilt: -14, openTilt: -20, openX: -4 },
  { tilt: 0, openTilt: 0, openX: 0 },
  { tilt: 14, openTilt: 20, openX: 4 },
];

const RELATIONSHIP_WORD: Record<DeckSummary['relationship_type'], string> = {
  partner: 'partner',
  family: 'family',
  friend: 'friends',
};

/**
 * The whole catalogue behind one row.
 *
 * Home used to carry a two-by-two grid plus an "also explore" line, which made
 * it a second copy of /decks with two different card languages on screen at
 * once. Three fanned cards say the same thing in a fifth of the space and hand
 * browsing to the page that is actually built for it.
 *
 * The fan is drawn from the decks themselves rather than being decorative, so
 * what you see is what you are about to find — the first three partner decks,
 * each in its own fill.
 */
export function DeckBrowseRow({
  decks,
  onPress,
}: {
  decks: DeckSummary[];
  onPress: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [held, setHeld] = useState(false);
  // One animated value drives the whole fan: 0 at rest, 1 while held. React
  // Native's Animated rather than a worklet because the pose has to be
  // interpolated into a `deg` string, and stringifying an animation object is
  // what makes the native side throw.
  const [spread] = useState(() => new Animated.Value(0));

  const duration = reduceMotion ? 0 : held ? OPEN_MS : CLOSE_MS;
  const easing = held ? Easing.out(Easing.cubic) : Easing.in(Easing.quad);

  const animate = useCallback(() => {
    Animated.timing(spread, {
      toValue: held ? 1 : 0,
      duration,
      easing,
      useNativeDriver: true,
    }).start();
  }, [spread, held, duration, easing]);

  // Deferred a tick: setting state synchronously in an effect body cascades
  // renders (react-hooks/set-state-in-effect).
  useEffect(() => {
    const timer = setTimeout(animate, 0);
    return () => clearTimeout(timer);
  }, [animate]);

  // Partner decks, first three by the order the catalogue publishes them.
  const fan = decks.filter((d) => d.relationship_type === 'partner').slice(0, 3);

  // Only name the relationships that actually have decks behind them.
  const kinds: string[] = [];
  for (const deck of decks) {
    const word = RELATIONSHIP_WORD[deck.relationship_type];
    if (!kinds.includes(word)) kinds.push(word);
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Browse all decks. ${decks.length} decks`}
      onPress={onPress}
      onPressIn={() => setHeld(true)}
      onPressOut={() => setHeld(false)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.fan} pointerEvents="none">
        {fan.map((deck, i) => (
          <FanCard key={deck.id} deck={deck} index={i} spread={spread} />
        ))}
      </View>

      <View style={styles.copy}>
        {/* Nothing here truncates. "Browse all decks" is short and the
            relationship list is three words — a line that ellipsises is a
            caption telling you it ran out of room, and this row has room. */}
        <Text variant="title" style={styles.title}>
          Browse all decks
        </Text>
        <Text variant="caption" muted>
          {decks.length} decks · {kinds.join(', ')}
        </Text>
      </View>

      <LucideIcon name="chevron" size={20} />
    </Pressable>
  );
}

/**
 * One card of the fan. Its own component so each can run its own animated
 * style — a hook inside the map above would be a hooks violation.
 */
function FanCard({
  deck,
  index,
  spread,
}: {
  deck: DeckSummary;
  index: number;
  /** 0 at rest, 1 while the row is held. Animates between the two poses. */
  spread: Animated.Value;
}) {
  const pose = FAN[index] ?? FAN[1];
  const tone = toneName(deck.tone);

  const animated = useMemo(
    () => ({
      transform: [
        // `interpolate` with a deg output range keeps the value a real number
        // all the way through. Writing the animation into a template string —
        // `${withTiming(...)}deg` — stringifies the animation object, and the
        // native side then tries to parse that as an angle and dies in `stod`.
        { rotate: spread.interpolate({ inputRange: [0, 1], outputRange: [`${pose.tilt}deg`, `${pose.openTilt}deg`] }) },
        { translateX: spread.interpolate({ inputRange: [0, 1], outputRange: [0, pose.openX] }) },
      ],
    }),
    [spread, pose],
  );

  return (
    <Animated.View
      style={[
        styles.fanCard,
        { left: CARD_STEP * index, height: index === 1 ? CARD_MID_H : CARD_H },
        // The middle card sits on top of the pair it overlaps, which is what
        // makes it read as a fan rather than a row.
        index === 1 && styles.fanCardMid,
        animated,
      ]}
    >
      <LinearGradient
        colors={[...gradientFor(tone)]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fanWash}
      />
      <View style={styles.fanIcon}>
        <LucideIcon name={iconName(deck.icon)} size={18} color={DECK_INKS[tone] ?? '#FFF9E8'} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.four,
    paddingVertical: 14,
    // The left padding is a touch under the right so the fan, which bleeds to
    // its own left edge, lines up with the text beside it.
    paddingLeft: 14,
    paddingRight: theme.spacing.four,
    borderRadius: theme.radii.hero,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  rowPressed: {
    transform: [{ scale: 0.98 }],
  },
  fan: {
    position: 'relative',
    width: FAN_WIDTH,
    height: FAN_HEIGHT,
    flexShrink: 0,
  },
  // The shadow lives on this view and the gradient on a child, because a view
  // that clips its own content also clips its own shadow.
  fanCard: {
    position: 'absolute',
    bottom: 0,
    width: CARD_W,
    borderRadius: 13,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  fanCardMid: {
    zIndex: 2,
  },
  fanWash: {
    // Spelled out rather than spread from `StyleSheet.absoluteFillObject`,
    // which is a set of responsive variant values: spreading it puts several
    // unistyles values inside one registered style, which is the "style object
    // with 2 unistyles styles" warning.
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 13,
  },
  fanIcon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.34,
  },
}));
