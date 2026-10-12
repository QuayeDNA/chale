import { FlatList, Pressable, useWindowDimensions, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRef, useState } from 'react';

import { artFor, deckTotalCopy, iconName, toneName } from '@/decks/art';
import type { DeckSummary } from '@/lib/decks';
import type { SessionMeta } from '@/lib/session-store';

import { Button } from './ui/button';
import { Card } from './ui/card';
import { LucideIcon } from './ui/icon';
import { LoadingBar } from './ui/loading-bar';
import { Text } from './ui/text';

export type ResumableSession = SessionMeta & { deck: DeckSummary };

/** Five is the point at which the section stops being "the one you left". */
const MAX_VISIBLE = 5;
const GAP = 16;
/**
 * The fraction of the row one card does not take. That remainder is the peek —
 * without a card visibly trailing off the edge there is nothing saying you can
 * swipe, and the list just looks like a row that got cut off.
 */
const PEEK = 0.14;
/**
 * Fixed, because a carousel whose cards resize with their text is a carousel
 * whose snap points move under your thumb — the ragged edge line is what made
 * the first attempt look broken. This is the tallest card the content can
 * produce: Card padding 24 × 2, two 16 gaps, the title block at its 2-line
 * maximum (COPY_HEIGHT), the progress rail with its caption, and a 56 medium
 * Button. The slack between that and CARD_HEIGHT is absorbed by
 * `space-between` on the card, so a 1-line title spreads instead of sitting
 * short in a fixed box.
 */
const COPY_HEIGHT = 78;
const CARD_HEIGHT = 260;

/**
 * Half-finished in-person sessions, newest first.
 *
 * A carousel rather than one card because there can be several: a shared phone
 * can be halfway through Deep Talks and halfway through Fun & Silly at once,
 * and collapsing that to "the newest one" quietly loses the other. Each card
 * keeps its own discard, since discarding is about that deck, not the screen.
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
  const { theme } = useUnistyles();
  const { width } = useWindowDimensions();

  const listRef = useRef<FlatList<ResumableSession>>(null);
  const [page, setPage] = useState(0);

  const visible = sessions.slice(0, MAX_VISIBLE);
  if (visible.length === 0) return null;

  const available = width - theme.spacing.four * 2;
  // One session has nothing to scroll to, so it takes the whole row and the
  // section does not visibly reflow as sessions come and go.
  const cardWidth = visible.length > 1 ? Math.round((available - GAP) * (1 - PEEK)) : available;
  const step = cardWidth + GAP;

  // Clamped rather than reset in an effect: discarding a card must not need a
  // second render pass to stop the track pointing past its own end.
  const activePage = Math.min(page, visible.length - 1);

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Text variant="smallBold" muted style={styles.label}>
          Pick up where you left off
        </Text>

        {/* The track sits in the header rather than under the cards: it costs no
            extra height, and the peek already says which way the row goes. */}
        {visible.length > 1 ? (
          <View style={styles.track}>
            {visible.map((s, i) => (
              <Pressable
                key={s.packId}
                accessibilityRole="tab"
                accessibilityState={{ selected: i === activePage }}
                accessibilityLabel={`Session ${i + 1} of ${visible.length}, ${s.deck.title}`}
                onPress={() => {
                  setPage(i);
                  listRef.current?.scrollToOffset({ offset: step * i, animated: true });
                }}
                style={styles.trackHit}
              >
                <View style={[styles.dot, i === activePage && styles.dotActive]} />
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      <FlatList
        ref={listRef}
        data={visible}
        keyExtractor={(s) => s.packId}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        disableIntervalMomentum
        snapToInterval={step}
        getItemLayout={(_, i) => ({ length: step, offset: step * i, index: i })}
        onMomentumScrollEnd={(e) => {
          const next = Math.round(e.nativeEvent.contentOffset.x / step);
          if (next !== page && next >= 0 && next < visible.length) setPage(next);
        }}
        renderItem={({ item }) => (
          // The slot is the snap step and owns the trailing gap, so the Card
          // never touches its neighbour and the snap offset and the drawn gap
          // can never drift apart.
          <View style={{ width: step, paddingRight: GAP }}>
            <ResumeCard
              session={item}
              style={{ width: cardWidth, height: CARD_HEIGHT }}
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
  style,
  onContinue,
  onDiscard,
}: {
  session: ResumableSession;
  style: { width: number; height: number };
  onContinue: (packId: string) => void;
  onDiscard: (packId: string) => void;
}) {
  const art = artFor({
    slug: session.deck.slug,
    tone: toneName(session.deck.tone),
    art_key: session.deck.art_key,
  });

  return (
    <Card style={[styles.card, style]}>
      <View style={styles.top}>
        {/* The tile wears the deck's own fill, so each card reads as the same
            object as the tile it came from rather than a generic notice —
            which matters more here, where the cards sit side by side and have
            to be told apart at a glance. */}
        <View
          style={[styles.tile, { backgroundColor: art.fill ?? '#2B4BD8' }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <LucideIcon
            name={iconName(session.deck.icon)}
            size={22}
            color={art.ink ?? '#FFF9E8'}
          />
        </View>
        <View style={styles.copy}>
          {/* The deck title is the thing you actually recognise, so it is the
              largest text — the section label above already said the rest. */}
          <Text variant="title" numberOfLines={2}>
            {session.deck.title}
          </Text>
          <Text variant="caption" muted numberOfLines={1}>
            {deckTotalCopy(session.deck)}
          </Text>
        </View>
      </View>

      {/* Progress as a rail, not just a number: "7 of 20" has to be read, a
          filled bar is seen. LoadingBar in determinate mode is the same board
          geometry as the loading state, just carrying a different number. */}
      <View style={styles.progress}>
        <LoadingBar
          size="sm"
          progress={(session.index + 1) / session.total}
          accessibilityLabel={`${session.deck.title}, question ${session.index + 1} of ${session.total}`}
        />
        {/* The rail already announces the position, so this is the visual echo
            for everyone else rather than a second read-out. */}
        <Text variant="caption" muted accessibilityElementsHidden>
          Question {session.index + 1} of {session.total}
        </Text>
      </View>

      <View style={styles.actions}>
        <View style={styles.primary}>
          <Button label="Continue" onPress={() => onContinue(session.packId)} />
        </View>
        {/* A real 44pt target, but ghost so an irreversible action never
            competes with the one you almost always want. */}
        <Button
          label="Discard"
          variant="ghost"
          size="sm"
          onPress={() => onDiscard(session.packId)}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: {
    gap: theme.spacing.two,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.three,
  },
  label: {
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  // The visible dot is 6pt, so the touch target is padded out to a 22pt circle
  // around it rather than shipping an 6pt target.
  trackHit: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.border,
  },
  dotActive: {
    width: 18,
    borderRadius: 3,
    backgroundColor: theme.colors.street,
  },
  // space-between, not flex-start: with every card the same height, the slack
  // from a 1-line title lands between the blocks instead of pooling under the
  // button and leaving the card looking bottom-heavy.
  card: {
    justifyContent: 'space-between',
  },
  top: {
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
    minHeight: COPY_HEIGHT,
  },
  progress: {
    gap: theme.spacing.two,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.two,
  },
  // Button drops `style` from its props, so a filling button needs a wrapper.
  primary: {
    flex: 1,
  },
}));