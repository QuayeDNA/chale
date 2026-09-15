import { useState } from 'react';
import { TextInput as RNTextInput, type TextInputProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

type Props = TextInputProps;

export function TextInput({ style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <RNTextInput
      placeholderTextColor={styles.placeholder.color}
      onFocus={(e) => {
        setFocused(true);
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        rest.onBlur?.(e);
      }}
      style={[styles.base, focused ? styles.focused : undefined, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  base: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.chip,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontFamily: 'SplineSans_400Regular',
    fontSize: 16,
    color: theme.colors.ink,
  },
  focused: {
    borderColor: theme.colors.street,
  },
  placeholder: {
    color: theme.colors.muted,
  },
}));
