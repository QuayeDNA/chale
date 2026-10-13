import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ErrorCard } from '@/components/error-card';
import { LoadingBar } from '@/components/ui/loading-bar';
import { Text } from '@/components/ui/text';
import { Screen } from '@/components/screen';
import { QuestionCard } from '@/components/question-card';
import { QuestionCardSkeleton } from '@/components/question-card-skeleton';
import { SessionHint, SessionProgress } from '@/components/session-progress';
import { SessionHeader } from '@/components/session-header';
import { DECK_INKS, gradientFor, iconName, toneName } from '@/decks/art';
import { drawSessionQuestions, getDeck } from '@/lib/decks';
import { isFavourite, toggleFavourite } from '@/lib/favourites';
import { clearSession, loadSession, saveSession } from '@/lib/session-store';

const SESSION_KEY = 'session';

/**
 * An in-person session, resumable.
 *
 * The draw lives in the query cache and is mirrored to AsyncStorage, so backing
 * out of the screen no longer throws the session away — coming back lands on
 * the same question, not a fresh shuffle. The draw itself stays server-side
 * (draw_session_questions) because it is a random order over published content.
 */
export default function SessionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { pack } = useLocalSearchParams<{ pack: string }>();

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
      const questions = await drawSessionQuestions(pack!, sessionLength);
      const fresh = { packId: pack!, questions, index: 0, startedAt: Date.now() };
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
      const updated = { ...prev, index: next };
      queryClient.setQueryData([SESSION_KEY, pack], updated);
      await saveSession(updated);
    },
    [pack, queryClient, session.data],
  );

  const finish = useCallback(async () => {
    await clearSession(pack!);
    queryClient.removeQueries({ queryKey: [SESSION_KEY, pack] });
    router.replace('/home');
  }, [pack, queryClient, router]);

  /** Abandons the draw without ending the visit, for anyone who wants a reroll. */
  const restart = useCallback(async () => {
    await clearSession(pack!);
    // resetQueries, not remove: it drops the cached draw AND refetches the
    // mounted query, so the next question appears instead of an empty screen.
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
          <LoadingBar size="sm" progress={0} fill="#2B1A0F" track="#EDE0BE" />
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
            onNext={last ? () => void finish() : () => void goTo(index + 1)}
            prevDisabled={index === 0}
            prevLabel={last ? '' : 'Previous'}
            nextLabel={last ? 'Finish' : 'Next'}
            nextIcon={last ? 'home' : 'chevron'}
            inPerson
          />

          <SessionHint />

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

const styles = StyleSheet.create((theme) => ({
  loading: {
    gap: theme.spacing.three,
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