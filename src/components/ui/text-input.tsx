import { useState } from 'react';
import { TextInput as RNTextInput, View, type TextInputProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Text } from '@/components/ui/text';
type Props = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
};

/**
 * Board text field — surface fill, thin border, street focus ring.
 * Single-line defaults to 56px; multiline grows to a 96px minimum.
 */
export function TextInput({ label, hint, error, style, multiline, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const message = error?.trim() ? error : undefined;
  return (
    <View style={styles.wrapper}>
      {label ? <Text variant="smallBold">{label}</Text> : null}
      <RNTextInput
        placeholderTextColor={styles.placeholder.color}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        aria-invalid={message ? true : undefined}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        style={[
          styles.base,
          multiline ? styles.multiline : undefined,
          focused ? styles.focused : undefined,
          focused && multiline ? styles.focusedMultiline : undefined,
          message ? styles.invalid : undefined,
          style,
        ]}
        {...rest}
      />
      {message ? (
        <Text variant="caption" style={styles.invalidText}>
          {message}
        </Text>
      ) : hint ? (
        <Text variant="caption" muted>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrapper: {
    gap: theme.spacing.two,
  },
  base: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    minHeight: 56,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontFamily: 'SplineSans_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.ink,
  },
  multiline: {
    minHeight: 96,
    paddingVertical: 14,
  },
  focused: {
    borderColor: theme.colors.street,
    borderWidth: 2,
    paddingVertical: 11,
    paddingHorizontal: 15,
  },
  focusedMultiline: {
    paddingVertical: 13,
  },
  invalid: {
    // Design-system semantic Error (ref2), not a relationship accent.
    borderColor: '#D32F2F',
  },
  invalidText: {
    color: '#D32F2F',
  },
  placeholder: {
    color: theme.colors.muted,
  },
}));
