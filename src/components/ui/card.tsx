import { View, type ViewProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

type Variant = 'default' | 'hero' | 'elevated';

type Props = ViewProps & {
  variant?: Variant;
};

export function Card({ variant = 'default', style, ...rest }: Props) {
  return (
    <View
      style={[styles.base, styles.variant(variant), style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  base: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.four,
    gap: theme.spacing.three,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
  },
  variant: (v: Variant) => {
    switch (v) {
      case 'hero':
        return { borderRadius: theme.radii.hero, padding: theme.spacing.five };
      case 'elevated':
        return { borderRadius: theme.radii.card, elevation: 6 };
      case 'default':
      default:
        return { borderRadius: theme.radii.card };
    }
  },
}));
