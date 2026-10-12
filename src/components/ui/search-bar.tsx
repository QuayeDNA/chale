import { TextInput as RNTextInput, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { LucideIcon } from '@/components/ui/icon';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

/**
 * Compact search field — a 42px surface bar with a search glyph. The form
 * TextInput is a 56px labelled field; this is the filter-bar sibling for
 * catalogue-style screens.
 */
export function SearchBar({ value, onChange, placeholder = 'Search' }: Props) {
  const { theme } = useUnistyles();
  return (
    <View style={styles.bar}>
      <LucideIcon name="search" size={16} color={theme.colors.muted} />
      <RNTextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.muted}
        accessibilityRole="search"
        accessibilityLabel={placeholder}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  bar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 42,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
  },
  input: {
    flex: 1,
    fontFamily: 'SplineSans_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.ink,
    paddingVertical: 8,
  },
}));
