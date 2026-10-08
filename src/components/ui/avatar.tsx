import { createAvatar } from '@dicebear/core';
import * as adventurer from '@dicebear/adventurer';
import * as lorelei from '@dicebear/lorelei';
import * as micah from '@dicebear/micah';
import * as notionists from '@dicebear/notionists';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Text as RNText, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
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
 * Generated art styles — deterministic from the seed, so a guest
 * keeps the same face. Palette keeps it inside the Chale world.
 */
type DiceStyle = Parameters<typeof createAvatar>[0];

const GENERATED_STYLES: DiceStyle[] = [adventurer, notionists, lorelei, micah];

const BG_COLORS = [
  'b6e3f4',
  'c0aede',
  'ffd5dc',
  'ffdfbf',
  'd1d4f9',
  'c1f4d5',
  'f8c8dc',
  'ffe0a3',
];

/** Deterministic generated-avatar SVG for a seed (DiceBear). */
export function generatedAvatarSvg(seed: string): string {
  const style = GENERATED_STYLES[hashString(seed) % GENERATED_STYLES.length];
  const backgroundColor = BG_COLORS[hashString(`bg:${seed}`) % BG_COLORS.length];
  return createAvatar(style, {
    seed,
    backgroundColor: [backgroundColor],
    backgroundType: ['solid'],
    radius: 50,
  }).toString();
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

/**
 * Fallback chain: photo → generated face → initials → generic icon.
 * Every imageless state carries a varied tone background.
 */
export function Avatar({
  imageUri,
  name,
  seed,
  tone,
  size = 40,
  generated = true,
}: {
  imageUri?: string | null;
  name?: string | null;
  /** Stable seed for tone + generated art (user id). Defaults to name. */
  seed?: string;
  tone?: AvatarTone;
  size?: number;
  /** Set false to skip the generated face and go straight to initials. */
  generated?: boolean;
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

  // Guests (no seed, no name) still get a stable face per mount.
  const generatedSeed = useMemo(() => seed ?? name ?? `guest-${guestSerial()}`, [seed, name]);
  const svg = useMemo(
    () => (generated ? generatedAvatarSvg(generatedSeed) : undefined),
    [generated, generatedSeed],
  );

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={name ? `${name}'s avatar` : 'Avatar'}
      style={[
        styles.circle(size),
        { backgroundColor: showImage || svg ? 'transparent' : colors.bg },
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: imageUri! }}
          onError={() => setFailed(true)}
          style={styles.circle(size)}
          accessibilityIgnoresInvertColors
        />
      ) : svg ? (
        <SvgXml xml={svg} width={size} height={size} />
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

let guestCount = 0;
/** Cheap unique-ish seed so two guests don't share a face. */
function guestSerial(): number {
  guestCount += 1;
  return guestCount;
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
