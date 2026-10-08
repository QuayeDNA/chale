import { useMemo, useState } from 'react';
import { Image, Text as RNText, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { LucideIcon } from './icon';

/**
 * Imageless background tones — varied per person, never a single
 * flat color. Ink text on street, paper text everywhere else.
 */
const AVATAR_TONES = {
  street: { bg: '#F5B400', fg: '#2B1A0F' },
  partner: { bg: '#D85A30', fg: '#FFF9E8' },
  family: { bg: '#639922', fg: '#FFF9E8' },
  friend: { bg: '#D4537E', fg: '#FFF9E8' },
  deep: { bg: '#2B4BD8', fg: '#FFF9E8' },
  dreams: { bg: '#1E7A3C', fg: '#FFF9E8' },
} as const;

export type AvatarTone = keyof typeof AVATAR_TONES;

/**
 * Deterministic tone from a seed (user id, name, …) so a person
 * keeps their color. No seed — e.g. a fresh guest — gets a random
 * tone assigned at mount (memoize the result to keep it stable).
 */
export function toneForSeed(seed?: string): AvatarTone {
  const keys = Object.keys(AVATAR_TONES) as AvatarTone[];
  if (!seed) return keys[Math.floor(Math.random() * keys.length)];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return keys[Math.abs(hash) % keys.length];
}

/** "David Okafor" → "DO". Empty/blank → '' (icon fallback). */
export function initialsFor(name?: string | null): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Fallback chain: photo → initials → generic icon.
 * Imageless states always carry a tone background.
 */
export function Avatar({
  imageUri,
  name,
  seed,
  tone,
  size = 40,
}: {
  imageUri?: string | null;
  name?: string | null;
  /** Stable seed for tone assignment (user id). Defaults to name. */
  seed?: string;
  tone?: AvatarTone;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  // Random guest tones stay fixed for the life of this mount.
  const resolvedTone = useMemo(
    () => tone ?? toneForSeed(seed ?? name ?? undefined),
    [tone, seed, name],
  );
  const colors = AVATAR_TONES[resolvedTone];
  const initials = initialsFor(name);
  const showImage = !!imageUri && !failed;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={name ? `${name}'s avatar` : 'Avatar'}
      style={[
        styles.circle(size),
        { backgroundColor: showImage ? 'transparent' : colors.bg },
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: imageUri! }}
          onError={() => setFailed(true)}
          style={styles.circle(size)}
          accessibilityIgnoresInvertColors
        />
      ) : initials ? (
        <RNText style={[styles.initials, { color: colors.fg, fontSize: size * 0.38 }]}>
          {initials}
        </RNText>
      ) : (
        <LucideIcon name="user" size={size * 0.5} color={colors.fg} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: (size: number) => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  }),
  initials: {
    fontFamily: 'SplineSans_600SemiBold',
  },
});
