import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Screen } from '@/components/screen';
import { QuestionCard } from '@/components/question-card';
import { drawSessionQuestions, getDeck } from '@/lib/decks';
import { isFavourite, toggleFavourite } from '@/lib/favourites';

export default function SessionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { pack } = useLocalSearchParams<{ pack: string }>();
  const [index, setIndex] = useState(0);

  const deck = useQuery({
    queryKey: ['decks', pack],
    queryFn: () => getDeck(pack!),
    enabled: !!pack,
  });

  // The deck's own session_length decides the draw size, so the board's "20 a
  // session" copy and the actual number of questions can never drift apart.
  const sessionLength = deck.data?.session_length ?? 20;

  // A bounded, shuffled draw from Postgres instead of the whole pack walked in
  // created_at order. The old walk rendered "07/100" and gave every couple the
  // same sequence in the same order, forever.
  const questions = useQuery({
    queryKey: ['decks', pack, 'session', sessionLength],
    queryFn: () => drawSessionQuestions(pack!, sessionLength),
    enabled: !!pack && !!deck.data,
  });

  const list = questions.data ?? [];
  const current = list[index];
  const last = index >= list.length - 1;

  const fav = useQuery({
    queryKey: ['favourites', 'is', current?.id],
    queryFn: () => isFavourite(current!.id),
    enabled: !!current,
  });

  return (
    <Screen>
      {!current ? (
        <Card>
          <Text variant="body">
            {questions.error
              ? 'Couldn\u2019t load questions.'
              : 'Loading questions…'}
          </Text>
        </Card>
      ) : (
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
          onPrevious={() => setIndex((i) => Math.max(0, i - 1))}
          onNext={
            last ? () => router.replace('/home') : () => setIndex((i) => i + 1)
          }
          prevDisabled={index === 0}
          nextLabel={last ? 'Finish — back home' : 'Next'}
        />
      )}
    </Screen>
  );
}
