import { useState } from 'react';
import { Pressable, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { BrandLockup } from '@/components/ui/brand-lockup';
import { Avatar } from '@/components/ui/avatar';
import { Dropdown, type DropdownItem } from '@/components/ui/dropdown';
import { AnimatedIcon } from '@/components/ui/icon';

/**
 * Dashboard header — wordmark (no tagline), animated notification
 * bell, and the profile avatar with its menu.
 */
export function DashboardHeader({
  name,
  avatarUri,
  seed,
  hasUnread,
  onOpenProfile,
  onOpenSettings,
  onSignOut,
}: {
  name?: string | null;
  avatarUri?: string | null;
  /** Stable id used for tone + generated face assignment. */
  seed?: string;
  hasUnread?: boolean;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
  onSignOut?: () => void;
}) {
  const { theme } = useUnistyles();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  const items: DropdownItem[] = [
    { key: 'profile', label: 'Profile', icon: 'user', onPress: onOpenProfile ?? (() => {}) },
    { key: 'settings', label: 'Settings', icon: 'settings', onPress: onOpenSettings ?? (() => {}) },
    { key: 'logout', label: 'Log out', icon: 'logout', destructive: true, onPress: onSignOut ?? (() => {}) },
  ];

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <BrandLockup variant={isDark ? 'light' : 'dark'} subtitle={false} width={104} />

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={hasUnread ? 'Notifications, unread' : 'Notifications'}
          onPress={() => {}}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <AnimatedIcon
            name="bell"
            size={24}
            animation={hasUnread ? 'ring' : 'pulse'}
            color={theme.colors.ink}
          />
          {hasUnread && <View style={styles.dot} />}
        </Pressable>

        <Dropdown
          open={menuOpen}
          onOpenChange={setMenuOpen}
          label="Profile menu"
          items={items}
          trigger={<Avatar name={name} seed={seed} imageUri={avatarUri} size={40} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  dot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.street,
  },
}));
