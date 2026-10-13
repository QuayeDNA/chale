import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { LucideIcon, type ShowcaseIconName } from './icon';
import { Text } from './text';

/** Fixed ink and paper, for the variants that must not change with the theme. */
const INK = '#2B1A0F';
const PAPER = '#FBF3DF';

type Variant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'ghost'
  | 'outline'
  | 'destructive'
  /** Ink fill, paper label — for a control sitting on a gold or paper surface. */
  | 'inverse'
  /** Transparent with an ink border — the quiet half of the pair above. */
  | 'inverseOutline'
  /** Paper fill, ink label — for a control sitting on an ink surface. */
  | 'paper';
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
  icon?: ShowcaseIconName;
  iconPosition?: 'left' | 'right';
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
  icon,
  iconPosition = 'left',
  accessibilityLabel,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;
  const iconColor =
    variant === 'accent' && accentTextColor
      ? accentTextColor
      : (styles.label(variant).color as string);
  const iconElement = icon ? (
    <LucideIcon name={icon} size={size === 'sm' ? 16 : size === 'md' ? 20 : 22} color={iconColor} />
  ) : null;
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
      {icon && iconPosition === 'left' ? iconElement : null}
      {/* An empty label renders the icon alone. Icon-only controls are a real
          need on a narrow button row, and the accessible name comes from
          `accessibilityLabel` so the button never loses its voice. */}
      {loading || label ? (
        <Text
          variant={size === 'sm' ? 'label' : 'bodyStrong'}
          // A control's label must never wrap: a two-line button changes its
          // own height, which breaks the row it sits in. Where the text is
          // genuinely too long for the space it shrinks to fit instead, which
          // keeps the button the size its neighbours are.
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          style={[
            styles.label(variant),
            // `adjustsFontSizeToFit` only ever shrinks text that already has a
            // bounded width. Inside a row with an icon the Text is measured
            // against its content instead, so it happily overflows its button
            // and paints over whatever sits next to it. Bounding it first is
            // what makes the shrink-to-fit do anything at all.
            styles.labelFits,
            size === 'lg' ? styles.labelLarge : undefined,
            variant === 'accent' && accentTextColor ? { color: accentTextColor } : undefined,
            isDisabled ? styles.labelDisabled : undefined,
          ]}>
          {loading ? 'Loading…' : label}
        </Text>
      ) : null}
      {icon && iconPosition === 'right' ? iconElement : null}
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  labelFits: {
    flexShrink: 1,
    // A row item's automatic minimum is its content width, which is exactly
    // the thing being shrunk. Zero lets the Text actually be narrower.
    minWidth: 0,
  },
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
      // The ink family, pinned rather than themed. These two exist to sit on a
      // light surface — a gold or paper card — so their contrast must not
      // change when the app does.
      case 'inverse':
        return {
          backgroundColor: INK,
          borderColor: INK,
        };
      case 'inverseOutline':
        return {
          backgroundColor: 'transparent',
          borderColor: INK,
          borderWidth: 1.5,
        };
      case 'paper':
        return {
          backgroundColor: PAPER,
          borderColor: PAPER,
        };
    }
  },
  // The ladder steps in 8pt increments (44 / 52 / 60) and the content steps
  // with the shell: 13px label + 16px icon, 16px semibold + 20px icon, 18px
  // semibold + 22px icon. A size that only changes padding is not a size —
  // the old md/lg pair was 4pt apart with identical content and read as one
  // button. `title` (Archivo Black 22) is deliberately NOT the lg label: the
  // display face on a control reads as a heading, not an action.
  size: (s: Size) => {
    switch (s) {
      case 'sm':
        return { minHeight: 44, paddingVertical: 10, paddingHorizontal: 16 };
      case 'md':
        return { minHeight: 52, paddingVertical: 14, paddingHorizontal: 22 };
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
    if (v === 'inverse') return { color: '#FBF3DF' };
    if (v === 'inverseOutline') return { color: '#2B1A0F' };
    if (v === 'paper') return { color: '#2B1A0F' };
    if (v === 'ghost' || v === 'outline' || v === 'secondary')
      return { color: theme.colors.ink };
    if (v === 'accent') return { color: theme.relationship.partner.accentText };
    return { color: theme.colors.ink };
  },
  labelDisabled: {
    opacity: 0.75,
  },
  // Large buttons get their own label step rather than borrowing `title`: the
  // shared type scale has nothing between 16px semibold and 22px display, and
  // the button should not grow a one-off public text variant for this. Layers
  // over bodyStrong, so the family and weight come along and only the metrics
  // change.
  labelLarge: {
    fontSize: 18,
    lineHeight: 26,
  },
}));
