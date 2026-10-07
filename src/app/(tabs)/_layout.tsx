import { Tabs } from 'expo-router';
import type { ReactNode } from 'react';
import {
  Pressable,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { LucideIcon, type ShowcaseIconName } from '@/components/ui/icon';

const TABS: { name: string; title: string; icon: ShowcaseIconName }[] = [
  { name: 'home', title: 'Home', icon: 'home' },
  { name: 'favourites', title: 'Favourites', icon: 'heart' },
  { name: 'remote', title: 'Remote', icon: 'people' },
  { name: 'profile', title: 'Profile', icon: 'user' },
];

type TabBarButtonProps = {
  accessibilityState?: { selected?: boolean };
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: ((event: GestureResponderEvent) => void) | null;
  onLongPress?: ((event: GestureResponderEvent) => void) | null;
  accessibilityLabel?: string;
  testID?: string;
};

/**
 * Board-spec tab button: the active tab sits in a street-gold pill.
 * (Haptics deliberately left out — expo-haptics would need a fresh
 * dev build; add it the next time a native rebuild happens anyway.)
 */
function TabBarButton({
  accessibilityState,
  children,
  style,
  onPress,
  onLongPress,
  accessibilityLabel,
  testID,
}: TabBarButtonProps) {
  const selected = accessibilityState?.selected === true;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.button, style]}
    >
      <View style={[styles.pill, selected && styles.activePill]}>{children}</View>
    </Pressable>
  );
}

export default function TabsLayout() {
  const { theme } = useUnistyles();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: (props) => <TabBarButton {...props} />,
        tabBarActiveTintColor: theme.colors.ink,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.paper,
          borderTopColor: theme.colors.border,
        },
        tabBarLabelStyle: {
          fontFamily: 'SplineSans_600SemiBold',
          fontSize: 12,
        },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ focused }) => (
              <LucideIcon
                name={t.icon}
                size={24}
                color={focused ? theme.colors.ink : theme.colors.muted}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create((theme) => ({
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 999,
  },
  activePill: {
    backgroundColor: theme.colors.street,
  },
}));
