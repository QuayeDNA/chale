import { memo, useCallback, useEffect, useRef, type ComponentProps } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { CardStack } from '@/components/card-stack';
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

type SessionQuestion = Awaited<ReturnType<typeof loadPoolQuestions>>[number];
type CardProps = ComponentProps<typeof QuestionCard>;

/**
 * An in-person session, resumable.
 *
 * The draw lives in the query cache and is mirrored to AsyncStorage. Which
 * questions come is deterministic (see `src/lib/shuffle-store.ts`).
 *
 * Navigation animation lives in <CardStack>: the position is still read from
 * the query, and the stack animates between positions. Nothing here holds a
 * direction any more — the stack works it out from where the card is going.
 */
export default function SessionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme } = useUnistyles();
  const { pack } = useLocalSearchParams<{ pack: string }>();

  const deck = useQuery({
    queryKey: ['decks', pack],
    queryFn: () => getDeck(pack!),
    enabled: !!pack,
  });

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
  const index = session.data?.index ?? 0;
  const current = list[index];
  const last = index >= list.length - 1;

  /**
   * Latest session, for the navigation handler below. Keeping it in a ref is
   * what lets `goTo` have a stable identity: if it changed on every move, every
   * card in the stack would re-render at the exact moment the animation starts.
   */
  const sessionRef = useRef(session.data);
  useEffect(() => {
    sessionRef.current = session.data;
  }, [session.data]);

  const goTo = useCallback(
    async (next: number) => {
      const prev = sessionRef.current;
      if (!prev || next < 0 || next >= prev.questions.length || next === prev.index) return;
      const updated = { ...prev, index: next };
      // Updated immediately, so a second quick tap reads the new position
      // instead of the one from before the first.
      sessionRef.current = updated;
      queryClient.setQueryData([SESSION_KEY, pack], updated);
      await saveSession(updated);
    },
    [pack, queryClient],
  );

  const goHome = useCallback(async () => {
    await advanceCursor(pack!, sessionLength);
    await markCompleted(pack!);
    await clearSession(pack!);
    queryClient.removeQueries({ queryKey: [SESSION_KEY, pack] });
    router.replace('/home');
  }, [pack, sessionLength, queryClient, router]);

  const finish = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    void goHome();
  }, [goHome]);

  /** One soft tick per card, whether it was a swipe or a button. */
  const tick = useCallback(() => void Haptics.selectionAsync(), []);

  const drawNext = useCallback(async () => {
    await advanceCursor(pack!, sessionLength);
    await clearSession(pack!);
    await queryClient.resetQueries({ queryKey: [SESSION_KEY, pack] });
  }, [pack, sessionLength, queryClient]);

  const restart = useCallback(async () => {
    await clearSession(pack!);
    await queryClient.resetQueries({ queryKey: [SESSION_KEY, pack] });
  }, [pack, queryClient]);

  const deckLabel = deck.data?.title;
  const deckTone = deck.data?.relationship_type;
  const deckIcon = deck.data ? iconName(deck.data.icon) : undefined;

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
          <LoadingBar size="sm" indeterminate fill={theme.colors.ink} track={theme.colors.border} />
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
          {/* Keyed by the draw, so a fresh draw is a fresh stack rather than a
              long glide back to card one. */}
          <CardStack
            key={session.data?.startedAt}
            index={index}
            count={list.length}
            preset="deal"
            onIndexChange={goTo}
            onStep={tick}
            keyFor={(i) => String(list[i]!.id)}
            renderCard={(i) => (
              <SessionCard
                question={list[i]!}
                position={i + 1}
                total={list.length}
                deckLabel={deckLabel}
                deckTone={deckTone}
                deckIcon={deckIcon}
                goTo={goTo}
                onFinish={finish}
              />
            )}
          />
          <SessionHint />

          {session.data?.isTail ? (
            <Text variant="caption" muted style={styles.eyebrow}>
              The last {list.length} you haven&apos;t heard — a fresh shuffle comes next.
            </Text>
          ) : session.data?.reshuffled ? (
            <Text variant="caption" muted style={styles.eyebrow}>
              Fresh shuffle — you&apos;ve heard all {session.data.poolSize} in this deck.
            </Text>
          ) : null}

          {last ? (
            <Button
              label={session.data?.freshAfter ? 'Draw the next 20' : 'Draw a fresh shuffle'}
              variant="inverse"
              size="lg"
              fullWidth
              onPress={() => void drawNext()}
            />
          ) : null}

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
 * One card of the stack, self-contained.
 *
 * Each card owns its favourite query, so the neighbours already know their
 * heart state before they arrive and nothing flickers on the way in. All of
 * its props are stable between moves — it depends on its own position, not on
 * which card is current — so the memo means a move re-renders nothing here.
 */
const SessionCard = memo(function SessionCard({
  question,
  position,
  total,
  deckLabel,
  deckTone,
  deckIcon,
  goTo,
  onFinish,
}: {
  question: SessionQuestion;
  /** 1-based. */
  position: number;
  total: number;
  deckLabel: string | undefined;
  deckTone: CardProps['deckTone'];
  deckIcon: CardProps['deckIcon'];
  goTo: (index: number) => Promise<void>;
  onFinish: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const last = position === total;

  const fav = useQuery({
    queryKey: ['favourites', 'is', question.id],
    queryFn: () => isFavourite(question.id),
  });

  const onToggleFavourite = useCallback(async () => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await toggleFavourite(question.id);
      // Refetches every mounted favourite query, this one included.
      await queryClient.invalidateQueries({ queryKey: ['favourites'] });
    } catch {
      router.push('/auth');
    }
  }, [question.id, queryClient, router]);

  const onPrevious = useCallback(() => void goTo(position - 2), [goTo, position]);
  const onNext = useCallback(
    () => (last ? onFinish() : void goTo(position)),
    [goTo, last, onFinish, position],
  );

  return (
    <QuestionCard
      question={question.text}
      deckLabel={deckLabel}
      deckTone={deckTone}
      deckIcon={deckIcon}
      index={position}
      total={total}
      isFavourite={!!fav.data}
      onToggleFavourite={onToggleFavourite}
      onPrevious={onPrevious}
      onNext={onNext}
      prevDisabled={position === 1}
      prevLabel={last ? '' : 'Previous'}
      nextLabel={last ? 'Back home' : 'Next'}
      nextIcon={last ? 'home' : 'chevron'}
      inPerson
    />
  );
});

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