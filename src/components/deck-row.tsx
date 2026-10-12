import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { LucideIcon, iconName } from './ui/icon';
import { Text } from './ui/text';
import { artFor, deckTotalCopy, toneName } from '@/decks/art';
import type { DeckSummary } from '@/lib/decks';

/**
 * Board catalogue row (see the All Decks mockup): a 52px deck-colour icon tile,
 * the title, the tagline, and the pool count — the two lines that only fit
 * here and never on the 2×2 home tiles.
 *
 * Tags are catalogue signals, not deck identity: Popular and Recommended say
 * something about how a deck is doing, so they live on the row and never in
 * the deck's art.
 */
export function DeckRow({
  deck,
  popular = false,
  recommended = false,
  onPress,
}: {
  deck: DeckSummary;
  popular?: boolean;
  recommended?: boolean;
  onPress: () => void;
}) {
  const art = artFor({ slug: deck.slug, tone: toneName(deck.tone), art_key: deck.art_key });
  const fill = art.fill ?? '#2B4BD8';
  const ink = art.ink ?? '#FFF9E8';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${deck.title}, ${deckTotalCopy(deck)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.ricon, { backgroundColor: fill }]}>
        <LucideIcon name={iconName(deck.icon)} size={24} color={ink} />
      </View>
      <View style={styles.rmid}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {deck.title}
        </Text>
        {deck.tagline ? (
          <Text variant="small" muted numberOfLines={2}>
            {deck.tagline}
          </Text>
        ) : null}
        <Text variant="caption" muted numberOfLines={1}>
          {deckTotalCopy(deck)} · {deck.session_length} a session
        </Text>
        {popular || recommended ? (
          <View style={styles.tags}>
            {popular ? (
              <View style={[styles.tag, styles.tagPopular]}>
                <Text style={styles.tagPopularText}>Popular</Text>
              </View>
            ) : null}
            {recommended ? (
              <View style={[styles.tag, styles.tagRecommended]}>
                <Text style={styles.tagRecommendedText}>Recommended</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
      <LucideIcon name="chevron" size={20} color={styles.chev.color as string} />
    </Pressable>
  );
}

/**
 * A pack that exists but cannot be opened yet. Same geometry as a row so the
 * shelf does not reflow on unlock day — only the treatment differs: desaturated
 * tile, no chevron, a Paid tag, and no press target. There is no checkout yet;
 * see the STORE TODO in decks.tsx for the seams an unlock flow plugs into.
 */
export function LockedDeckRow({ title, tagline }: { title: string; tagline: string }) {
  return (
    <View
      accessibilityLabel={`${title}, coming soon`}
      accessibilityState={{ disabled: true }}
      style={[styles.row, styles.locked]}
    >
      <View style={[styles.ricon, styles.lockedTile]}>
        <LucideIcon name="lock" size={24} color={styles.lockedIcon.color as string} />
      </View>
      <View style={styles.rmid}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="small" muted numberOfLines={2}>
          {tagline}
        </Text>
      </View>
      <View style={styles.paidTag}>
        <Text style={styles.paidTagText}>Paid</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: theme.radii.card,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.9,
  },
  ricon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rmid: {
    flex: 1,
    gap: 3,
  },
  tags: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 4,
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  tagPopular: {
    backgroundColor: theme.colors.street,
  },
  tagPopularText: {
    fontFamily: 'SplineSans_600SemiBold',
    fontSize: 11,
    lineHeight: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#2B1A0F',
  },
  tagRecommended: {
    backgroundColor: theme.colors.ink,
  },
  tagRecommendedText: {
    fontFamily: 'SplineSans_600SemiBold',
    fontSize: 11,
    lineHeight: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: theme.colors.paper,
  },
  chev: {
    color: theme.colors.muted,
  },
  locked: {
    opacity: 0.6,
  },
  lockedTile: {
    backgroundColor: theme.colors.border,
  },
  lockedIcon: {
    color: theme.colors.muted,
  },
  paidTag: {
    borderRadius: 999,
    backgroundColor: theme.colors.border,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  paidTagText: {
    fontFamily: 'SplineSans_600SemiBold',
    fontSize: 11,
    lineHeight: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: theme.colors.muted,
  },
}));
