import { Tabs } from 'expo-router';
import { useUnistyles } from 'react-native-unistyles';

import { FloatingTabBar } from '@/components/floating-tab-bar';
import { TabBarClearanceProvider } from '@/components/tab-bar-context';
import type { ChaleIconName } from '@/components/ui/icon';

const TABS: { name: string; title: string; icon: ChaleIconName }[] = [
  { name: 'home', title: 'Home', icon: 'home' },
  { name: 'favourites', title: 'Favourites', icon: 'heart' },
  { name: 'remote', title: 'Remote', icon: 'people' },
  { name: 'profile', title: 'Profile', icon: 'user' },
];

export default function TabsLayout() {
  const { theme } = useUnistyles();
  return (
    // Wrapping the navigator puts every scene inside the clearance context, so
    // each Screen reserves room for the floating bar without hardcoding it.
    <TabBarClearanceProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: theme.colors.paper },
        }}
        tabBar={(props) => (
          <FloatingTabBar
            state={props.state}
            navigation={props.navigation}
            tabs={TABS}
          />
        )}
      >
        {TABS.map((t) => (
          <Tabs.Screen key={t.name} name={t.name} options={{ title: t.title }} />
        ))}
      </Tabs>
    </TabBarClearanceProvider>
  );
}
