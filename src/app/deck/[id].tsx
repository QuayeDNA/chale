import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Screen } from '@/components/screen';
import { supabase } from '@/lib/supabase';

export default function DeckScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const pack = useQuery({
    queryKey: ['packs', id],
    queryFn: async () => {
      const { data: p, error: packError } = await supabase
        .from('question_packs')
        .select('id,title,category')
        .eq('id', id!)
        .single();
      if (packError) throw packError;
      const { count, error: countError } = await supabase
        .from('questions')
        .select('id', { count: 'exact', head: true })
        .eq('pack_id', id!);
      if (countError) throw countError;
      return { ...p, count: count ?? 0 };
    },
    enabled: !!id,
  });

  return (
    <Screen>
      {!pack.data ? (
        <Card>
          <Text variant="body">
            {pack.error ? 'Couldn\u2019t load this deck.' : 'Loading deck…'}
          </Text>
        </Card>
      ) : (
        <>
          <Text variant="display">{pack.data.title}</Text>
          <Text variant="body" muted>
            {pack.data.count} questions
            {pack.data.category ? ` · ${pack.data.category}` : ''}
          </Text>
          <Button
            label="Just the two of us"
            onPress={() =>
              router.push({ pathname: '/session', params: { pack: id! } })
            }
          />
          <Button
            label="Start remote session"
            variant="outline"
            onPress={() => router.push('/start')}
          />
          <Text variant="caption">
            In-person play needs no account. Remote play asks you to log in.
          </Text>
        </>
      )}
    </Screen>
  );
}
