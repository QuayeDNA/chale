import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { CardMark } from '@/components/card-mark';
import { LucideIcon, iconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { DECK_INKS, gradientFor } from '@/decks/art';
import type { DeckSummary } from '@/lib/decks';

/**
 * The featured locked pack, as the home concept draws it: a deep gradient
 * plate, a lock in the eyebrow, the pack name in Archivo Black and a paper pill
 * in the far corner.
 *
 * The gradient and ink are the pack's OWN tone, so promoting a different locked
 * deck to the banner swaps the whole plate with it. The corner mark is the
 * pack's own icon, the same one every other deck surface signs itself with.
 *
 * Nothing here is pressable. There is no store, no checkout and no premium
 * content behind it, so a tap target would be a promise the app cannot keep.
 * The same reasoning keeps the shop's featured banner inert.
 */
export function PremiumBanner({ deck }: { deck: DeckSummary }) {
  const ink = DECK_INKS[deck.tone] ?? '#FFF9E8';

  return (
    <View
      style={styles.root}
      accessible
      accessibilityRole="text"
      accessibilityState={{ disabled: true }}
      accessibilityLabel={`${deck.title}, coming soon. ${deck.tagline ?? ''} ${deck.question_count} questions.`}
    >
      <LinearGradient
        colors={gradientFor(deck.tone)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.95 }}
        style={styles.wash}
        pointerEvents="none"
      />

      {/* The pack's own icon as a watermark. This used to be an Svg crescent
          because the concept draws an inset shadow and RN cannot express one;
          the glyph does the same job and says which pack it is. */}
      <CardMark
        icon={iconName(deck.icon)}
        tint="rgba(255, 255, 255, 0.14)"
        size={MARK_SIZE}
        crop={MARK_CROP}
      />

      <View style={styles.copy}>
        <View style={styles.eyebrow}>
          <LucideIcon name="lock" size={11} color={ink} strokeWidth={2.6} />
          <Text variant="smallBold" style={[styles.eyebrowText, { color: ink }]} numberOfLines={1}>
            COMING SOON
          </Text>
        </View>
        <Text variant="title" style={[styles.title, { color: ink }]} numberOfLines={1}>
          {deck.title}
        </Text>
        <Text variant="caption" style={[styles.tagline, { color: ink }]} numberOfLines={2}>
          {deck.tagline}
        </Text>
      </View>

      <View style={styles.pill}>
        <Text variant="smallBold" style={styles.pillText}>
          Locked
        </Text>
      </View>
    </View>
  );
}

const MARK_SIZE = 190;
/** The concept parked its arc 30pt past the corner. */
const MARK_CROP = 26;

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
    opacity: 0.75,
  },
  title: {
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.6,
    marginTop: 3,
    marginBottom: 2,
  },
  tagline: {
    fontSize: 12.5,
    lineHeight: 16,
    opacity: 0.8,
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
