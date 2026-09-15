import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

type Variant = 'display' | 'title' | 'body' | 'bodyStrong' | 'label' | 'caption' | 'small' | 'smallBold';

type Props = RNTextProps & {
  variant?: Variant;
  muted?: boolean;
};

export function Text({ variant = 'body', muted, style, ...rest }: Props) {
  const variantStyle = styles[variant]?.();
  const mutedStyle = muted ? styles.muted() : undefined;
  return <RNText style={[variantStyle, mutedStyle, style]} {...rest} />;
}

const styles = StyleSheet.create((theme) => ({
  display: () => ({
    fontFamily: 'ArchivoBlack_400Regular',
    fontSize: 32,
    lineHeight: 36,
    color: theme.colors.ink,
    letterSpacing: -0.5,
  }),
  title: () => ({
    fontFamily: 'ArchivoBlack_400Regular',
    fontSize: 22,
    lineHeight: 28,
    color: theme.colors.ink,
  }),
  body: () => ({
    fontFamily: 'SplineSans_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.ink,
  }),
  bodyStrong: () => ({
    fontFamily: 'SplineSans_600SemiBold',
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.ink,
  }),
  label: () => ({
    fontFamily: 'SplineSans_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.ink,
    letterSpacing: 0.3,
  }),
  caption: () => ({
    fontFamily: 'SplineSans_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: theme.colors.muted,
  }),
  small: () => ({
    fontFamily: 'SplineSans_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.ink,
  }),
  smallBold: () => ({
    fontFamily: 'SplineSans_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.ink,
  }),
  muted: () => ({
    color: theme.colors.muted,
  }),
}));
