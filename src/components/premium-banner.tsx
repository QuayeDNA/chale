import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { StyleSheet } from 'react-native-unistyles';

import { LucideIcon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { PremiumDeck } from '@/decks/storefront';

/**
 * The featured premium pack, as the home concept draws it: a deep gradient
 * plate, a lock in the eyebrow, the pack name in Archivo Black and a paper pill
 * in the far corner.
 *
 * The gradient and the eyebrow tint are the pack's OWN c1/c2 rather than fixed
 * hexes, so swapping `PREMIUM_DECKS[0]` swaps the whole plate with it. The soft
 * ring is the concept's `inset -20px 9px` crescent — a circle whose stroke is
 * drawn for part of the way round and rotated so the arc lands bottom-right,
 * which is the only part of it still inside the banner.
 *
 * Nothing here is pressable. There is no store, no checkout and no premium
 * content behind it, so a tap target would be a promise the app cannot keep.
 * The same reasoning keeps the shop's featured banner inert.
 */
export function PremiumBanner({ deck }: { deck: PremiumDeck }) {
  const [from, to] = [deck.c1, deck.c2];
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  // A little under half the circle, so the arc reads as a crescent rather than
  // a full ring peeking out of the corner.
  const arc = circumference * 0.42;

  return (
    <View
      style={styles.root}
      accessible
      accessibilityRole="text"
      accessibilityState={{ disabled: true }}
      accessibilityLabel={`${deck.title}, coming soon. ${deck.tagline} ${deck.questionCount} questions, ${deck.price}`}
    >
      <LinearGradient
        colors={[from, to]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.95 }}
        style={styles.wash}
        pointerEvents="none"
      />

      <Svg width={RING} height={RING} style={styles.ring} pointerEvents="none">
        <Circle
          cx={radius}
          cy={radius}
          r={radius}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={22}
          strokeDasharray={`${arc} ${circumference}`}
          transform={`rotate(-32 ${radius} ${radius})`}
        />
      </Svg>

      <View style={styles.copy}>
        <View style={styles.eyebrow}>
          <LucideIcon name="lock" size={11} color={EYEBROW_TINT} strokeWidth={2.6} />
          <Text variant="smallBold" style={styles.eyebrowText} numberOfLines={1}>
            {`NEW · PAID · ${deck.price}`}
          </Text>
        </View>
        <Text variant="title" style={styles.title} numberOfLines={1}>
          {deck.title}
        </Text>
        <Text variant="caption" style={styles.tagline} numberOfLines={2}>
          {deck.tagline}
        </Text>
      </View>

      <View style={styles.pill}>
        <Text variant="smallBold" style={styles.pillText}>
          Peek
        </Text>
      </View>
    </View>
  );
}

const RING = 110;
/**
 * The concept's #CFC6FF, a pale lavender that only reads against a violet
 * plate. It is pinned rather than derived because every premium gradient is
 * currently in the violet family; a differently-coloured featured pack would
 * need this to become a per-pack tint.
 */
const EYEBROW_TINT = '#CFC6FF';

const styles = StyleSheet.create((theme) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.three,
    padding: theme.spacing.four,
    borderRadius: theme.radii.hero,
    overflow: 'hidden',
  },
  // Unistyles' own absoluteFillObject is a responsive variant object, not a
  // plain fill, so the wash is spelled out instead.
  wash: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  ring: {
    position: 'absolute',
    right: -24,
    top: -30,
  },
  copy: {
    flex: 1,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eyebrowText: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1,
    color: EYEBROW_TINT,
  },
  title: {
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.6,
    color: '#FFF9E8',
    marginTop: 3,
    marginBottom: 2,
  },
  tagline: {
    fontSize: 12.5,
    lineHeight: 16,
    color: '#D6D0F2',
  },
  pill: {
    // `flex: 'none'` is valid for React Native but not in Unistyles' typing,
    // which only accepts a number; this is the same intent.
    flexShrink: 0,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: theme.radii.chip,
    backgroundColor: '#FFF9E8',
  },
  pillText: {
    fontSize: 12.5,
    lineHeight: 16,
    color: '#2B1A0F',
  },
}));