import { Pressable, type PressableProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Text } from './text';

type Variant = 'primary' | 'accent' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

type Props = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: Variant;
  size?: Size;
  accentColor?: string;
  accentTextColor?: string;
  fullWidth?: boolean;
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  accentColor,
  accentTextColor,
  fullWidth,
  disabled,
  ...rest
}: Props) {
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles.variant(variant),
        styles.size(size),
        fullWidth ? styles.fullWidth : undefined,
        disabled ? styles.disabled : undefined,
        pressed && !disabled ? styles.pressed : undefined,
        variant === 'accent' && accentColor ? { backgroundColor: accentColor } : undefined,
      ]}
      {...rest}>
      <Text
        variant={size === 'sm' ? 'label' : 'bodyStrong'}
        style={[
          styles.label(variant),
          variant === 'accent' && accentTextColor ? { color: accentTextColor } : undefined,
          disabled ? styles.labelDisabled : undefined,
        ]}>
        {label}
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
  },
  variant: (v: Variant) => {
    switch (v) {
      case 'primary':
        return {
          backgroundColor: theme.colors.street,
          borderColor: theme.colors.street,
        };
      case 'accent':
        return {
          backgroundColor: theme.relationship.partner.accent,
          borderColor: theme.relationship.partner.accent,
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
        return { paddingVertical: 8, paddingHorizontal: 14 };
      case 'md':
        return { paddingVertical: 12, paddingHorizontal: 20 };
      case 'lg':
        return { paddingVertical: 16, paddingHorizontal: 28 };
    }
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.85,
  },
  label: (v: Variant) => {
    if (v === 'ghost' || v === 'outline') return { color: theme.colors.ink };
    if (v === 'accent') return { color: theme.relationship.partner.accentText };
    return { color: theme.colors.ink };
  },
  labelDisabled: {
    opacity: 0.7,
  },
}));
