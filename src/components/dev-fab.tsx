import { useRouter, useSegments } from 'expo-router';
import { Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Icon } from './ui/icon';

export function DevFab() {
  const router = useRouter();
  const segments = useSegments();

  if (!__DEV__) return null;

  const current = segments.join('/');
  if (current.endsWith('showcase') || current.endsWith('design')) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open component showcase"
      hitSlop={8}
      onPress={() => router.push('/showcase')}
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
    >
      <Icon name="palette" size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.street,
    borderWidth: 1,
    borderColor: theme.colors.ink,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 100,
  },
  pressed: {
    opacity: 0.8,
  },
}));
