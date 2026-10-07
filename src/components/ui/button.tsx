import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Text } from './text';

type Variant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

type Props = Omit<PressableProps, 'style' | 'disabled'> & {
  label: string;
  variant?: Variant;
  size?: Size;
  accentColor?: string;
  accentTextColor?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  accentColor,
  accentTextColor,
  fullWidth,
  disabled,
  loading,
  accessibilityLabel,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.base,
        styles.variant(variant),
        styles.size(size),
        fullWidth ? styles.fullWidth : undefined,
        isDisabled ? styles.disabled(variant) : undefined,
        pressed && !isDisabled ? styles.pressed : undefined,
        variant === 'accent' && accentColor ? { backgroundColor: accentColor } : undefined,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={styles.label(variant).color as string}
        />
      ) : null}
      <Text
        variant={size === 'sm' ? 'label' : 'bodyStrong'}
        style={[
          styles.label(variant),
          variant === 'accent' && accentTextColor ? { color: accentTextColor } : undefined,
          isDisabled ? styles.labelDisabled : undefined,
        ]}>
        {loading ? 'Loading…' : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    gap: 8,
    minHeight: 44,
  },
  variant: (v: Variant) => {
    switch (v) {
      case 'primary':
        return {
          backgroundColor: theme.colors.street,
          borderColor: theme.colors.street,
        };
      case 'secondary':
        return {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        };
      case 'accent':
        return {
          backgroundColor: theme.relationship.partner.accent,
          borderColor: theme.relationship.partner.accent,
        };
      case 'destructive':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: theme.colors.border,
        };
    }
  },
  size: (s: Size) => {
    switch (s) {
      case 'sm':
        return { minHeight: 44, paddingVertical: 10, paddingHorizontal: 16 };
      case 'md':
        return { minHeight: 56, paddingVertical: 14, paddingHorizontal: 22 };
      case 'lg':
        return { minHeight: 60, paddingVertical: 16, paddingHorizontal: 28 };
    }
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: (v: Variant) => {
    if (v === 'primary') return { opacity: 0.5 };
    return { opacity: 0.55 };
  },
  pressed: {
    opacity: 0.88,
  },
  label: (v: Variant) => {
    // Primary sits on street yellow, which is identical in light + dark —
    // keep the label fixed dark ink so it never flips to cream in dark mode.
    if (v === 'primary') return { color: '#2B1A0F' };
    if (v === 'destructive') return { color: '#D85A30' };
    if (v === 'ghost' || v === 'outline' || v === 'secondary')
      return { color: theme.colors.ink };
    if (v === 'accent') return { color: theme.relationship.partner.accentText };
    return { color: theme.colors.ink };
  },
  labelDisabled: {
    opacity: 0.75,
  },
}));
