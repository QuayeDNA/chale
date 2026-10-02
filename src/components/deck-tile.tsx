import { Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from './ui/text';

export function DeckTile({
  title,
  count,
  onPress,
}: {
  title: string;
  count: number | null;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <Text style={styles.badge}>{title.trim().charAt(0).toUpperCase()}</Text>
      <Text variant="title" style={styles.name}>
        {title}
      </Text>
      <Text variant="caption">
        {count === null ? '…' : `${count} questions`}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  tile: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.card,
    padding: theme.spacing.four,
    gap: theme.spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
  badge: {
    fontSize: 28,
    color: theme.colors.street,
  },
  name: {
    fontSize: 20,
  },
}));
