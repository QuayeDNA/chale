import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Screen } from '@/components/screen';
import { QuestionCard } from '@/components/question-card';
import { supabase } from '@/lib/supabase';

export default function SessionScreen() {
  const router = useRouter();
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
  const last = index >= list.length - 1;

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
        <>
          <Text variant="label" muted>
            {index + 1} / {list.length}
          </Text>
          <QuestionCard text={current.text} kind={current.kind} />
          <Button
            label="Previous"
            variant="outline"
            disabled={index === 0}
            onPress={() => setIndex((i) => Math.max(0, i - 1))}
          />
          {last ? (
            <Button
              label="Finish — back home"
              onPress={() => router.replace('/home')}
            />
          ) : (
            <Button label="Next" onPress={() => setIndex((i) => i + 1)} />
          )}
        </>
      )}
    </Screen>
  );
}
