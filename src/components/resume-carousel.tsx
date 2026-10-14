import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Pressable,
  useWindowDimensions,
  View,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { StyleSheet } from 'react-native-unistyles';

import { CardMark } from './card-mark';
import { artFor, gradientFor, iconName, toneName } from '@/decks/art';
import type { DeckSummary } from '@/lib/decks';
import type { SessionMeta } from '@/lib/session-store';

import { Button } from './ui/button';
import { LucideIcon, type ShowcaseIconName } from './ui/icon';
import { Text } from './ui/text';

export type ResumableSession = SessionMeta & { deck: DeckSummary };

/** Five is the point at which the section stops being "the one you left". */
const MAX_VISIBLE = 5;
/** Gap between cards. */
const GAP = 12;
/**
 * The mockup's card is 178pt wide inside a ~400pt rail. It is deliberately
 * wider than that here: at the mockup's density a phone showed the cards as a
 * column of small chips rather than as a hand of cards, and the rail's whole
 * point is that it reads as a hand. Scaling from the reference keeps that
 * density on a 320pt phone and a 430pt one instead of pinning one number.
 */
const REFERENCE_RAIL = 400;
const REFERENCE_CARD = 216;
const MIN_CARD = 168;
const MAX_CARD = 232;
/** The tray bleeds a little past the page gutter, like the concept's -6px. */
const TRAY_BLEED = 6;
/**
 * Inside that bleed the rail is inset by 6 again, which lands the cards and the
 * tray heading exactly on the page gutter. Anything else and the tray's contents
 * sit at a different indent from the greeting above it.
 */
const RAIL_INSET = 6;
/** Matches the concept's ring geometry: r21, strokeWidth 4, so C is the dash. */
const RING_R = 21;
const RING_C = 2 * Math.PI * RING_R;
const DISCARD_MS = 220;
/**
 * Two lines of title, reserved whether or not the title needs them. Without it
 * a deck with a one-line name produces a shorter card than its neighbour, and
 * the tray stops looking like a hand of cards dealt side by side.
 */
const TITLE_HEIGHT = 40;

/**
 * The tray card is narrow, so the watermark is smaller than the storefront's and
 * parked less far out of the corner — at this width a bigger crop would clip it
 * down to a sliver.
 */
const MARK_SIZE = 210;
const MARK_CROP = 44;

const RELATIONSHIP_CHIP: Record<DeckSummary['relationship_type'], string> = {
  partner: 'Partners',
  family: 'Family',
  friend: 'Friends',
};

/** "2 days ago" — the question copy's second half, and the only reason the
 * session's age is worth showing at all. */
function timeAgo(from: number): string {
  const mins = Math.max(0, Math.round((Date.now() - from) / 60_000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.round(days / 7);
  return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
}

/**
 * Half-finished in-person sessions, newest first.
 *
 * A carousel rather than one card because there can be several: a shared phone
 * can be halfway through Deep Talks and halfway through Fun & Silly at once,
 * and collapsing that to "the newest one" quietly loses the other. Each card
 * keeps its own discard, since discarding is about that deck, not the screen.
 *
 * The ink tray is the point. This is the only dark surface on the home screen,
 * and it is dark because these games belong to you rather than to the catalogue
 * — the deck grid is going to sit right below it, and two things that mean
 * different things must not look the same.
 */
export function ResumeCarousel({
  sessions,
  onContinue,
  onDiscard,
}: {
  sessions: ResumableSession[];
  onContinue: (packId: string) => void;
  onDiscard: (packId: string) => void;
}) {
  const { width } = useWindowDimensions();

  const visible = sessions.slice(0, MAX_VISIBLE);
  if (visible.length === 0) return null;

  // Width of the space the cards actually live in: the page, widened by the
  // tray bleed, less the inset that puts them back on the gutter.
  const rail = width + TRAY_BLEED * 2 - RAIL_INSET;

  /**
   * One card is the same width as every other card. Stretching a lone card to
   * the rail made it double in size the moment the second session was discarded,
   * and a session one tap from re-entering does not need the extra room.
   */
  const cardWidth = Math.min(
    MAX_CARD,
    Math.max(MIN_CARD, Math.round((rail * REFERENCE_CARD) / REFERENCE_RAIL)),
  );

  /**
   * The snap step is the card plus the gap, nothing else. Anything wider puts
   * air between cards that no gap property accounts for, which is exactly what
   * a step derived from a "peek fraction" does.
   */
  const step = cardWidth + GAP;

  return (
    <View style={styles.tray}>
      <View style={styles.head}>
        <Text variant="title" style={styles.headTitle} numberOfLines={1}>
          Pick up where you left off
        </Text>
        <Text variant="caption" style={styles.headCount}>
          {visible.length === 1
            ? '1 in progress'
            : `${visible.length} in progress`}
        </Text>
      </View>

      <FlatList
        data={visible}
        keyExtractor={(s) => s.packId}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        disableIntervalMomentum
        snapToInterval={step}
        getItemLayout={(_, i) => ({ length: step, offset: step * i, index: i })}
        // The slot is the card plus the gap, so the gap is drawn by the slot
        // and the snap offset is the same number by construction. The insets
        // put the first card on the page gutter and let the last one still
        // scroll fully into view.
        contentContainerStyle={{ paddingLeft: RAIL_INSET, paddingRight: RAIL_INSET }}
        style={styles.rail}
        renderItem={({ item, index }) => (
          <View style={{ width: cardWidth, marginRight: GAP }}>
            <ResumeCard
              session={item}
              cardWidth={cardWidth}
              tilt={index % 2 === 0 ? -1.2 : 1}
              onContinue={onContinue}
              onDiscard={onDiscard}
            />
          </View>
        )}
      />
    </View>
  );
}

function ResumeCard({
  session,
  cardWidth,
  tilt,
  onContinue,
  onDiscard,
}: {
  session: ResumableSession;
  /** The single card fills the rail; the rest share it. */
  cardWidth: number;
  /** Alternating tilt, so the rail reads as a hand of cards rather than a grid. */
  tilt: number;
  onContinue: (packId: string) => void;
  onDiscard: (packId: string) => void;
}) {
  const art = artFor({
    slug: session.deck.slug,
    tone: toneName(session.deck.tone),
    art_key: session.deck.art_key,
  });
  const ink = art.ink ?? '#FFF9E8';
  const progress = Math.min(1, (session.index + 1) / session.total);

  return (
    <TrayCard
      width={cardWidth}
      colors={gradientFor(toneName(session.deck.tone))}
      icon={iconName(session.deck.icon)}
      tilt={tilt}
      onDiscard={() => onDiscard(session.packId)}
    >
      {(discard) => (
        <>
          <View style={styles.rtop}>
            <Chip label={RELATIONSHIP_CHIP[session.deck.relationship_type]} ink={ink} />
            <Chip label="In person" ink={ink} />
          </View>

          <View style={styles.ring}>
            <Svg width={48} height={48} style={styles.ringSvg} pointerEvents="none">
              <Circle
                cx={24}
                cy={24}
                r={RING_R}
                stroke="rgba(0,0,0,0.22)"
                strokeWidth={4}
                fill="none"
              />
              <Circle
                cx={24}
                cy={24}
                r={RING_R}
                stroke={ink}
                strokeWidth={4}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C * (1 - progress)}
                // Start the arc at twelve o'clock rather than three.
                transform="rotate(-90 24 24)"
              />
            </Svg>
            <View style={styles.ringIn}>
              <LucideIcon name={iconName(session.deck.icon)} size={18} color={ink} />
            </View>
          </View>

          <Text variant="title" numberOfLines={2} style={[styles.title, { color: ink }]}>
            {session.deck.title}
          </Text>
          <Text variant="small" numberOfLines={2} style={[styles.progress, { color: ink }]}>
            Question {session.index + 1} of {session.total} · {timeAgo(session.startedAt)}
          </Text>

          <View style={styles.bar}>
            <View
              style={[styles.barFill, { width: `${progress * 100}%`, backgroundColor: ink }]}
            />
          </View>

          <View style={styles.actions}>
            <View style={styles.go}>
              <Button
                label="Continue"
                variant="paper"
                size="sm"
                onPress={() => onContinue(session.packId)}
              />
            </View>
            <DiscardButton ink={ink} onPress={discard} />
          </View>
        </>
      )}
    </TrayCard>
  );
}

/**
 * The deck-filled card itself: the gradient wash, the off-corner ring and the
 * tilt. Split out so the discard animation can wrap the surface, and it hands
 * the body its own discard trigger — a press has to run the leave animation
 * before the session is actually dropped, or the rail reflows under the thumb.
 */
function TrayCard({
  width,
  colors,
  icon,
  tilt,
  onDiscard,
  children,
}: {
  width: number;
  colors: readonly [string, string];
  icon: ShowcaseIconName;
  tilt: number;
  onDiscard: () => void;
  children: (discard: () => void) => React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  // Deliberately React Native's Animated rather than a Reanimated worklet: the
  // leave animation only fades and scales, both of which run on the native
  // driver, so there is no reason to put it on the UI thread. The worklet
  // version had to hop back to JS with runOnJS to reach onDiscard, and that
  // round trip is the only thing between a tap and the session being dropped.
  const [leaving] = useState(() => new Animated.Value(0));

  const animated = useMemo(
    () => ({
      // `leaving` runs 0 -> 1 as the card goes, so the resting value of the
      // progress has to be FULLY OPAQUE. Reading the value straight through
      // renders every card at opacity 0.
      opacity: leaving.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0],
      }),
      transform: [
        { rotate: `${tilt}deg` },
        {
          scale: leaving.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.8],
          }),
        },
      ],
    }),
    [leaving, tilt],
  );

  const discard = useCallback(() => {
    Animated.timing(leaving, {
      toValue: 1,
      duration: reduceMotion ? 0 : DISCARD_MS,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
      // Only drop the session once the card is actually gone. A cancelled
      // animation means something interrupted the tap, and quietly discarding
      // the game then would be the wrong answer.
    }).start(({ finished }) => {
      if (finished) onDiscard();
    });
  }, [leaving, onDiscard, reduceMotion]);

  return (
    // Animated.View, not View: the leave animation writes an interpolated
    // transform, and only an Animated view will take one.
    <Animated.View style={[styles.card, { width }, animated]}>
      <LinearGradient
        colors={[...colors]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.wash}
        pointerEvents="none"
      />
      <CardMark
        icon={icon}
        tint="rgba(255, 255, 255, 0.13)"
        size={MARK_SIZE}
        crop={MARK_CROP}
        edge="bottom-right"
      />
      <View style={styles.cardBody}>{children(discard)}</View>
    </Animated.View>
  );
}

function DiscardButton({ ink, onPress }: { ink: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Discard this session"
      onPress={onPress}
      style={({ pressed }) => [styles.discard, pressed && styles.discardPressed]}
    >
      <LucideIcon name="close" size={15} color={ink} />
    </Pressable>
  );
}

function Chip({ label, ink }: { label: string; ink: string }) {
  return (
    <View style={styles.chip}>
      <Text variant="smallBold" style={[styles.chipLabel, { color: ink }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  // Bleeds wider than the page content so the tray is the only full-bleed
  // surface here, which is what makes it read as a tray the cards sit in
  // rather than another section. RAIL_INSET pulls the cards back onto the page
  // gutter so the tray's contents line up with everything above it.
  tray: {
    marginHorizontal: -TRAY_BLEED,
    paddingVertical: 18,
    borderRadius: 30,
    backgroundColor: theme.colors.ink,
    // A rail that bleeds has to clip, or a card scrolling out of it is visible
    // against the paper.
    overflow: 'hidden',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.spacing.three,
    paddingLeft: RAIL_INSET + 14,
    paddingRight: theme.spacing.four,
    marginBottom: theme.spacing.two,
  },
  headTitle: {
    flexShrink: 1,
    fontSize: 17,
    lineHeight: 22,
    color: theme.colors.paper,
  },
  headCount: {
    color: '#BFAE92',
  },
  // FlatList inherits flexGrow: 1, which inside the tray's column would let the
  // rail stretch to whatever height is going spare.
  rail: {
    flexGrow: 0,
  },
  card: {
    minHeight: 268,
    borderRadius: 22,
    padding: 14,
    overflow: 'hidden',
    marginVertical: 6
  },
  wash: {
    ...StyleSheet.absoluteFillObject,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'space-between',
    // Clears the absolute chip row (14pt down, ~20pt tall) so the progress
    // ring never sits underneath it.
    paddingTop: 40,
  },
  rtop: {
    position: 'absolute',
    top: 14,
    // Inset from the card's own padding, not from its edge, so the chips stay
    // aligned with the title below them.
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chip: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipLabel: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  ring: {
    width: 48,
    height: 48,
  },
  ringSvg: {
    ...StyleSheet.absoluteFillObject,
  },
  ringIn: {
    position: 'absolute',
    top: 7,
    left: 7,
    right: 7,
    bottom: 7,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    lineHeight: 20,
    // Reserved, not measured: a one-line title must not produce a shorter card
    // than the deck beside it, or the tray stops looking like cards dealt side
    // by side.
    height: TITLE_HEIGHT,
    marginTop: 12,
  },
  progress: {
    fontSize: 11.5,
    lineHeight: 15,
    opacity: 0.85,
    marginTop: 4,
  },
  bar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginTop: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: 4,
    borderRadius: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  // Button drops `style` from its props, so a filling button needs a wrapper.
  go: {
    flex: 1,
  },
  discard: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardPressed: {
    opacity: 0.6,
  },
}));
