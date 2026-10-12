import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { LucideIcon } from '@/components/ui/icon';
import { TextInput } from '@/components/ui/text-input';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

/**
 * Compact search field for catalogue-style screens — the deck switcher's filter
 * row, where a full labelled form field would be too tall to sit beside the
 * view switcher.
 *
 * It is the same `TextInput` the rest of the app types into, so the field gets
 * the board's focus ring, error colour and placeholder tone for free rather
 * than a second, subtly different input living one screen away. Only the
 * height, radius and the room the glyph needs are overridden; the glyph is a
 * sibling laid over the field, which is why the input reserves left padding.
 */
export function SearchBar({ value, onChange, placeholder = 'Search' }: Props) {
  const { theme } = useUnistyles();

  return (
    <View style={styles.wrap}>
      <View style={styles.glyph} pointerEvents="none">
        <LucideIcon name="search" size={16} color={theme.colors.muted} />
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        accessibilityRole="search"
        accessibilityLabel={placeholder}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrap: {
    flex: 1,
  },
  glyph: {
    position: 'absolute',
    left: 12,
    // 42pt field, 16pt glyph: the optical centre is a shade below the middle.
    top: 13,
    zIndex: 1,
  },
  input: {
    minHeight: 42,
    borderRadius: 14,
    paddingLeft: 34,
    paddingVertical: 8,
  },
}));