import { View } from 'react-native';

import BrandDarkArtwork from '@/assets/brand/Chale Brand_Dark.svg';
import BrandLightArtwork from '@/assets/brand/Chale Brand_Light.svg';

export type BrandLockupVariant = 'light' | 'dark';

const ASPECT_RATIO: Record<BrandLockupVariant, number> = {
  // height / width from each file's viewBox
  light: 563.07 / 942.6,
  dark: 559.23 / 936.17,
};

/**
 * Chale brand lockup (crown + wordmark + tagline, supplied artwork).
 * `light` = cream artwork for dark backgrounds (splash).
 * `dark` = ink artwork for light backgrounds.
 */
export function BrandLockup({
  variant = 'light',
  width = 220,
  testID,
}: {
  variant?: BrandLockupVariant;
  width?: number;
  testID?: string;
}) {
  const Artwork = variant === 'light' ? BrandLightArtwork : BrandDarkArtwork;
  return (
    <View
      testID={testID}
      accessibilityRole="image"
      accessibilityLabel="Chale — Better questions. Deeper chats."
    >
      <Artwork width={width} height={width * ASPECT_RATIO[variant]} />
    </View>
  );
}
