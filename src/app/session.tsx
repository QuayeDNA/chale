import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Screen } from '@/components/screen';
import { QuestionCard } from '@/components/question-card';
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
    <Screen>
      {!current ? (
        <Card>
          <Text variant="body">
            {session.error
              ? 'Couldn\u2019t load questions.'
              : 'Loading questions\u2026'}
          </Text>
        </Card>
      ) : (
        <>
          <QuestionCard
            question={current.text}
            deckLabel={deck.data?.title}
            deckTone={deck.data?.relationship_type}
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
            nextLabel={last ? 'Finish — back home' : 'Next'}
          />

          {/* Without this, resuming is a trap: you are locked into the draw you
              abandoned halfway through. */}
          {index > 0 && (
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
  restart: {
    alignItems: 'center',
  },
  restartHit: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.three,
  },
}));