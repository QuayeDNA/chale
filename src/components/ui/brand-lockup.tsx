import { View } from 'react-native';

import BrandDarkArtwork from '@/assets/brand/Chale Brand_Dark.svg';
import BrandLightArtwork from '@/assets/brand/Chale Brand_Light.svg';
import BrandNoSubtitleDarkArtwork from '@/assets/brand/Chale Brand_NoSubtitle_Dark.svg';
import BrandNoSubtitleLightArtwork from '@/assets/brand/Chale Brand_NoSubtitle_Light.svg';

export type BrandLockupVariant = 'light' | 'dark';

const ASPECT_RATIO: Record<string, number> = {
  // height / width from each file's viewBox
  'light-with': 563.07 / 942.6,
  'dark-with': 559.23 / 936.17,
  'light-without': 300.53 / 689.2,
  'dark-without': 300.53 / 689.2,
};

/**
 * Chale brand lockup (crown + wordmark, supplied artwork).
 * `light` = cream artwork for dark backgrounds (splash).
 * `dark` = ink artwork for light backgrounds.
 * `subtitle` = include the tagline lockup (default true).
 */
export function BrandLockup({
  variant = 'light',
  width = 220,
  subtitle = true,
  testID,
}: {
  variant?: BrandLockupVariant;
  width?: number;
  subtitle?: boolean;
  testID?: string;
}) {
  const Artwork =
    variant === 'light'
      ? subtitle
        ? BrandLightArtwork
        : BrandNoSubtitleLightArtwork
      : subtitle
        ? BrandDarkArtwork
        : BrandNoSubtitleDarkArtwork;
  const key = `${variant}-${subtitle ? 'with' : 'without'}`;
  return (
    <View
      testID={testID}
      accessibilityRole="image"
      accessibilityLabel={subtitle ? 'Chale — Better questions. Deeper chats.' : 'Chale'}
    >
      <Artwork width={width} height={width * ASPECT_RATIO[key]} />
    </View>
  );
}
