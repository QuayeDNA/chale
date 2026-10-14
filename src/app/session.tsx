import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { ErrorCard } from '@/components/error-card';
import { LoadingBar } from '@/components/ui/loading-bar';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Screen } from '@/components/screen';
import { QuestionCard } from '@/components/question-card';
import { QuestionCardSkeleton } from '@/components/question-card-skeleton';
import { SessionHint, SessionProgress } from '@/components/session-progress';
import { SessionHeader } from '@/components/session-header';
import { DECK_INKS, gradientFor, iconName, toneName } from '@/decks/art';
import { getDeck, loadPoolQuestions } from '@/lib/decks';
import { isFavourite, toggleFavourite } from '@/lib/favourites';
import { clearSession, loadSession, saveSession } from '@/lib/session-store';
import {
  advanceCursor,
  isTailSession,
  markCompleted,
  prepareSeed,
  sessionSlice,
  shuffleFor,
} from '@/lib/shuffle-store';

const SESSION_KEY = 'session';

/**
 * An in-person session, resumable.
 *
 * The draw lives in the query cache and is mirrored to AsyncStorage, so backing
 * out of the screen no longer throws the session away — coming back lands on
 * the same question. *Which* questions come is deterministic: the device-local
 * seed shuffles the deck once and each session consumes the next slice of that
 * shuffle (see `src/lib/shuffle-store.ts`), so sessions never repeat inside a
 * cycle and no id ledger is needed.
 */
export default function SessionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme } = useUnistyles();
  const { pack } = useLocalSearchParams<{ pack: string }>();
  /** +1 = moving forward, -1 = back, 0 = first paint. Drives the slide. */
  const [dir, setDir] = useState<0 | 1 | -1>(0);

  const deck = useQuery({
    queryKey: ['decks', pack],
    queryFn: () => getDeck(pack!),
    enabled: !!pack,
  });

  // The deck's own session_length decides the draw size, so the board's "20 a
  // session" copy and the actual number of questions can never drift apart.
  const sessionLength = deck.data?.session_length ?? 20;

  const session = useQuery({
    queryKey: [SESSION_KEY, pack],
    queryFn: async () => {
      const saved = await loadSession(pack!);
      if (saved) return saved;
      const pool = await loadPoolQuestions(pack!);
      const { seed, cursor, reshuffled } = await prepareSeed(pack!, pool.length, sessionLength);
      const questions = sessionSlice(shuffleFor(seed, pool), cursor, sessionLength);
      const fresh = {
        packId: pack!,
        questions,
        index: 0,
        startedAt: Date.now(),
        reshuffled,
        isTail: isTailSession(pool.length, questions.length, sessionLength),
        poolSize: pool.length,
        freshAfter: Math.max(0, pool.length - (cursor + 1) * sessionLength),
      };
      await saveSession(fresh);
      return fresh;
    },
    enabled: !!pack && !!deck.data,
  });

  const list = session.data?.questions ?? [];
  // The position is read, not held: the query is the single source of truth, so
  // a restored session needs no effect to sync a local index up to it.
  const index = session.data?.index ?? 0;
  const current = list[index];
  const last = index >= list.length - 1;

  const fav = useQuery({
    queryKey: ['favourites', 'is', current?.id],
    queryFn: () => isFavourite(current!.id),
    enabled: !!current,
  });

  /** Moves the position, keeping the cache and storage in step. */
  const goTo = useCallback(
    async (next: number) => {
      const prev = session.data;
      if (!prev) return;
      setDir(next > prev.index ? 1 : -1);
      const updated = { ...prev, index: next };
      queryClient.setQueryData([SESSION_KEY, pack], updated);
      await saveSession(updated);
    },
    [pack, queryClient, session.data],
  );

  /**
   * "Back home" — the quiet ending. Consumes this slice of the shuffle, marks
   * the pack completed (the Home recommendation card's signal), and clears
   * resumption: replace, not push, so Back can't return to a finished session.
   * Next entry into this pack starts at the next slice.
   */
  const goHome = useCallback(async () => {
    await advanceCursor(pack!, sessionLength);
    await markCompleted(pack!);
    await clearSession(pack!);
    queryClient.removeQueries({ queryKey: [SESSION_KEY, pack] });
    router.replace('/home');
  }, [pack, sessionLength, queryClient, router]);

  /**
   * "Draw the next 20" — the momentum ending. Same consumption, but the next
   * slice is dealt in place and the round continues on screen.
   */
  const drawNext = useCallback(async () => {
    setDir(1);
    await advanceCursor(pack!, sessionLength);
    // Clearing the slot is what keeps the fresh draw from resuming instead.
    await clearSession(pack!);
    // resetQueries, not remove: it drops the cached draw AND refetches the
    // mounted query, so the next card appears instead of an empty screen.
    await queryClient.resetQueries({ queryKey: [SESSION_KEY, pack] });
  }, [pack, sessionLength, queryClient]);

  /**
   * Abandons the round without ending the visit: the cursor is untouched, so
   * the refetch draws the SAME slice of the shuffle again.
   */
  const restart = useCallback(async () => {
    setDir(0);
    await clearSession(pack!);
    await queryClient.resetQueries({ queryKey: [SESSION_KEY, pack] });
  }, [pack, queryClient]);

  return (
    <Screen
      align="start"
      header={
        <SessionHeader
          title={deck.data?.title ?? 'Session'}
          onBack={() => router.back()}
          {...(deck.data
            ? {
                icon: iconName(deck.data.icon),
                colors: gradientFor(toneName(deck.data.tone)),
                ink: DECK_INKS[toneName(deck.data.tone)],
              }
            : {})}
        />
      }
    >
      {session.isPending ? (
        <View style={styles.loading}>
          <LoadingBar
            size="sm"
            indeterminate
            fill={theme.colors.ink}
            track={theme.colors.border}
          />
          <QuestionCardSkeleton inPerson />
        </View>
      ) : session.isError ? (
        <ErrorCard
          icon="info"
          title="Couldn't draw questions"
          body="The deck loaded, but drawing your questions failed."
          onRetry={() => void session.refetch()}
        />
      ) : !current ? (
        <ErrorCard
          icon="info"
          title="No questions in this deck"
          body="Nothing came back to play, so there is nothing to show."
          onRetry={() => void session.refetch()}
        />
      ) : (
        <>
          <SessionProgress index={index + 1} total={list.length} />
          {/* A new card is dealt in the direction of travel: the slide is the
              pass-the-phone gesture made visible. Keyed by question so every
              card mounts fresh with its own entry offset. */}
          <CardSlide key={current.id} direction={dir}>
            <QuestionCard
              question={current.text}
              deckLabel={deck.data?.title}
              deckTone={deck.data?.relationship_type}
              deckIcon={deck.data ? iconName(deck.data.icon) : undefined}
              index={index + 1}
              total={list.length}
              isFavourite={!!fav.data}
              onToggleFavourite={async () => {
                try {
                  await toggleFavourite(current.id);
                  await queryClient.invalidateQueries({
                    queryKey: ['favourites'],
                  });
                  await fav.refetch();
                } catch {
                  await router.push('/auth');
                }
              }}
              onPrevious={() => void goTo(Math.max(0, index - 1))}
              onNext={last ? () => void goHome() : () => void goTo(index + 1)}
              prevDisabled={index === 0}
              prevLabel={last ? '' : 'Previous'}
              nextLabel={last ? 'Back home' : 'Next'}
              nextIcon={last ? 'home' : 'chevron'}
              inPerson
            />
          </CardSlide>
          <SessionHint />

          {/* Honest one-liners: the tail names the last unseen cards; the
              reshuffle eyebrow appears exactly once per cycle. */}
          {session.data?.isTail ? (
            <Text variant="caption" muted style={styles.eyebrow}>
              The last {list.length} you haven&apos;t heard — a fresh shuffle comes next.
            </Text>
          ) : session.data?.reshuffled ? (
            <Text variant="caption" muted style={styles.eyebrow}>
              Fresh shuffle — you&apos;ve heard all {session.data.poolSize} in this deck.
            </Text>
          ) : null}

          {/* The last card's loud option. Full width below the card so the two
              endings rank instead of squeezing three buttons into one row. */}
          {last ? (
            <Button
              label={
                session.data?.freshAfter ? 'Draw the next 20' : 'Draw a fresh shuffle'
              }
              variant="inverse"
              size="lg"
              fullWidth
              onPress={() => void drawNext()}
            />
          ) : null}

          {/* Without this, resuming is a trap: you are locked into the draw you
              abandoned halfway through. It is hidden on the last card, where
              finishing is the only sensible way out and a second exit just
              offers a wrong one. */}
          {index > 0 && !last && (
            <View style={styles.restart}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Start this deck over with a fresh draw"
                onPress={() => void restart()}
                style={styles.restartHit}
              >
                <Text variant="caption" muted>
                  Start this deck over
                </Text>
              </Pressable>
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

/**
 * The card's entrance. A keyed wrapper so each question mounts fresh: the
 * shared values are re-initialised per mount from the direction of travel,
 * which is why a ref in the parent works where state would race the render.
 * `direction` 0 (first paint, restart) means the card simply appears.
 */
function CardSlide({
  direction,
  children,
}: {
  direction: 0 | 1 | -1;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const still = reduceMotion || direction === 0;
  const offset = direction * 44;
  const x = useSharedValue(still ? 0 : offset);
  const opacity = useSharedValue(still ? 1 : 0);

  useEffect(() => {
    if (still) return;
    x.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(1, { duration: 180 });
  }, [still, x, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

const styles = StyleSheet.create((theme) => ({
  loading: {
    gap: theme.spacing.three,
  },
  eyebrow: {
    textAlign: 'center',
  },
  restart: {
    alignItems: 'center',
  },
  restartHit: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.three,
  },
}));