import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, Switch, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Card } from '@/components/ui/card';
import { Icon, type ChaleIconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Screen } from '@/components/screen';
import { useAuth } from '@/hooks/use-auth';
import { RelationshipThemes } from '@/constants/theme';

function LinkRow({ icon, label, value, onPress }: { icon: ChaleIconName; label: string; value?: string; onPress?: () => void }) {
  const { theme } = useUnistyles();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <Icon name={icon} size={20} />
      <Text variant="body">{label}</Text>
      <View style={styles.right}>
        {value ? <Text variant="caption">{value}</Text> : null}
        <Icon name="chevron" size={18} color={theme.colors.muted} />
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { isAnonymous, signOut } = useAuth();
  const [notifications, setNotifications] = useState(true);

  return (
    <Screen>
      <Text variant="title">Settings</Text>
      <Card>
        <View style={styles.row}>
          <Icon name="bell" size={20} />
          <Text variant="body">Notifications</Text>
          <View style={styles.right}>
            <Switch value={notifications} onValueChange={setNotifications} />
          </View>
        </View>
        <LinkRow icon="palette" label="Appearance" value="Light" />
        <LinkRow icon="globe" label="Language" value="English" />
        <LinkRow icon="help" label="Help & support" />
        <LinkRow icon="info" label="About Chale" />
      </Card>
      {!isAnonymous ? (
        <Pressable
          accessibilityRole="button"
          onPress={async () => {
            await signOut();
            router.replace('/welcome');
          }}
          style={styles.logout}
        >
          <Icon name="logout" size={20} color={RelationshipThemes.partner.accent} />
          <Text variant="body" style={{ color: RelationshipThemes.partner.accent }}>
            Log out
          </Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.three,
    paddingVertical: theme.spacing.two,
  },
  right: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.two,
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.two,
    paddingVertical: theme.spacing.two,
  },
}));
