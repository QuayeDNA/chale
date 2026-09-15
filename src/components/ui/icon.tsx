import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react-native';
import { useUnistyles } from 'react-native-unistyles';

type LucideIcon = ComponentType<LucideProps>;

type IconProps = LucideProps & {
  as: LucideIcon;
};

/**
 * Thin wrapper that supplies theme-aware defaults for lucide icons.
 * Prefer per-icon imports to avoid bundling the whole set on native:
 *   import { Heart } from 'lucide-react-native/icons/heart';
 *   <Icon as={Heart} size={20} />
 * Web tree-shakes the root import; native Metro does not — deep import is required.
 */
export function Icon({ as: LucideIcon, color, size = 20, strokeWidth = 2, ...rest }: IconProps) {
  const { theme } = useUnistyles();
  const resolvedColor = color ?? theme.colors.ink;
  return <LucideIcon color={resolvedColor} size={size} strokeWidth={strokeWidth} {...rest} />;
}
