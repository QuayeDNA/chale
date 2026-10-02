import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon, type ChaleIconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Screen } from '@/components/screen';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { listFavourites } from '@/lib/favourites';
import { RelationshipThemes } from '@/constants/theme';

function Row({ icon, label, danger, onPress }: { icon: ChaleIconName; label: string; danger?: boolean; onPress: () => void }) {
  const { theme } = useUnistyles();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.row}
    >
      <Icon name={icon} size={20} color={danger ? RelationshipThemes.partner.accent : theme.colors.ink} />
      <Text variant="body" style={danger ? { color: RelationshipThemes.partner.accent } : undefined}>
        {label}
      </Text>
      <View style={styles.chevron}>
        <Icon name="chevron" size={18} color={theme.colors.muted} />
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, user, isAnonymous, signOut } = useAuth();

  const favs = useQuery({
    queryKey: ['favourites', 'list'],
    queryFn: listFavourites,
    enabled: !!user,
  });
  const answers = useQuery({
    queryKey: ['answers', 'count', user?.id],
    queryFn: async () => {
      const { count } = await supabase.from('answers').select('id', { count: 'exact', head: true }).eq('user_id', user!.id);
      return count ?? 0;
    },
    enabled: !!user,
  });

  const name = profile?.display_name ?? 'New friend';
  const sub = isAnonymous ? 'Browsing as a guest' : (user?.email ?? '');

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text variant="title">{name.slice(0, 1).toUpperCase()}</Text>
        </View>
        <Text variant="title">{name}</Text>
        {sub ? <Text variant="caption">{sub}</Text> : null}
        <Text variant="caption">
          {(favs.data ?? []).length} favourites · {answers.data ?? 0} answers
        </Text>
      </View>
      <Card>
        <Row icon="stats" label="My deck stats" onPress={() => router.push('/home')} />
        <Row icon="heart" label="Favourites" onPress={() => router.push('/favourites')} />
        <Row icon="invite" label="Invite a person" onPress={() => router.push('/start')} />
        <Row icon="settings" label="Account settings" onPress={() => router.push('/settings')} />
        {isAnonymous ? (
          <Row icon="user" label="Create account" onPress={() => router.push('/auth')} />
        ) : (
          <Row
            icon="logout"
            label="Log out"
            danger
            onPress={async () => {
              await signOut();
              router.replace('/welcome');
            }}
          />
        )}
      </Card>
      <Button label="Play again" onPress={() => router.push('/home')} />
      <Button label="Back to home" variant="outline" onPress={() => router.push('/home')} />
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: {
    alignItems: 'center',
    gap: theme.spacing.two,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.street,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.three,
    paddingVertical: theme.spacing.two,
  },
  chevron: {
    marginLeft: 'auto',
  },
}));
