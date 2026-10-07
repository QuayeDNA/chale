import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Screen } from '@/components/screen';
import { QuestionCard } from '@/components/question-card';
import { supabase } from '@/lib/supabase';
import { isFavourite, toggleFavourite } from '@/lib/favourites';

export default function SessionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { pack } = useLocalSearchParams<{ pack: string }>();
  const [index, setIndex] = useState(0);
  const questions = useQuery({
    queryKey: ['packs', pack, 'questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('id,text,kind')
        .eq('pack_id', pack!)
        .order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!pack,
  });

  const list = questions.data ?? [];
  const current = list[index];
  const last = index >= list.length - 1;  const fav = useQuery({
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
