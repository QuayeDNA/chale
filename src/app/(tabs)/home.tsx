import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import { Card } from '@/components/ui/card';
import { DashboardHeader } from '@/components/dashboard-header';
import { DeckTile } from '@/components/deck-tile';
import { Text } from '@/components/ui/text';
import { Screen } from '@/components/screen';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const router = useRouter();
  const { profile, user, isAnonymous, signOut } = useAuth();
  const packs = useQuery({
    queryKey: ['packs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('question_packs')
        .select('id,title,category')
        .order('created_at');
      if (error) throw error;
      return data;
    },
  });

  const name = profile?.display_name ?? null;
  const firstName = name?.split(/\s+/)[0];

  return (
    <Screen>
      <DashboardHeader
        name={name}
        seed={user?.id}
        onOpenProfile={() => router.push('/profile')}
        onOpenSettings={() => router.push('/settings')}
        onSignOut={() => void signOut()}
      />
      <Text variant="title">
        {greeting()}
        {firstName ? `, ${firstName}` : ''}. What would you like to do today?
      </Text>
      {packs.isLoading ? (
        <Card>
          <Text variant="body">Loading decks…</Text>
        </Card>
      ) : null}
      {packs.error ? (
        <Card>
          <Text variant="body">Couldn&apos;t load decks.</Text>
        </Card>
      ) : null}
      {(packs.data ?? []).map((p) => (
        <PackTile
          key={p.id}
          packId={p.id}
          title={p.title}
          onPress={() =>
            router.push({ pathname: '/deck/[id]', params: { id: p.id } })
          }
        />
      ))}
    </Screen>
  );
}

function PackTile({
  packId,
  title,
  onPress,
}: {
  packId: string;
  title: string;
  onPress: () => void;
}) {
  const count = useQuery({
    queryKey: ['packs', packId, 'count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('questions')
        .select('id', { count: 'exact', head: true })
        .eq('pack_id', packId);
      if (error) throw error;
      return count ?? 0;
    },
  });
  return (
    <DeckTile title={title} count={count.data ?? null} onPress={onPress} />
  );
}

const styles = StyleSheet.create(() => ({
  brand: {
    fontSize: 40,
    lineHeight: 44,
  },
}));
