import { Tabs } from 'expo-router';
import { useUnistyles } from 'react-native-unistyles';

import { Icon, type ChaleIconName } from '@/components/ui/icon';

const TABS: { name: string; title: string; icon: ChaleIconName }[] = [
  { name: 'home', title: 'Home', icon: 'home' },
  { name: 'favourites', title: 'Favourites', icon: 'heart' },
  { name: 'remote', title: 'Remote', icon: 'people' },
  { name: 'profile', title: 'Profile', icon: 'user' },
];

export default function TabsLayout() {
  const { theme } = useUnistyles();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.ink,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: { backgroundColor: theme.colors.paper, borderTopColor: theme.colors.border },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color, size }) => <Icon name={t.icon} size={size} color={typeof color === 'string' ? color : undefined} />,
          }}
        />
      ))}
    </Tabs>
  );
}
