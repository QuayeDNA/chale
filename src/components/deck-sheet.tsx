import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { usePlayMode, type PlayMode } from '@/hooks/use-play-mode';

import { Button } from '@/components/ui/button';
import { LucideIcon, type ChaleIconName } from '@/components/ui/icon';
import { Sheet, useSheetAction } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { DECK_INKS, gradientFor } from '@/decks/art';
import type { DrawnQuestion, DeckSummary } from '@/lib/decks';

type DeckSample = Pick<DrawnQuestion, 'id' | 'text'>;

type Props = {
  deck: DeckSummary | null;
  samples: DeckSample[];
  /** Follows the shopper through to the questions or the pairing flow. */
  onPlay: (deck: DeckSummary, mode: PlayMode) => void;
  /** Price label for a deck that isn't bought yet. */
  price?: string | null;
  onOpenChange: (open: boolean) => void;
};

/** Gap between peek cards — matches the concept's gap and the snap step. */
const PEEK_GAP = 10;

const RELATIONSHIP_LABEL: Record<DeckSummary['relationship_type'], string> = {
  partner: 'Partners',
  family: 'Family',
  friend: 'Friends',
};

const MODES: { mode: PlayMode; icon: 'people' | 'mic'; label: string; hint: string }[] = [
  { mode: 'inperson', icon: 'people', label: 'Together', hint: 'Same room, one phone' },
  { mode: 'remote', icon: 'mic', label: 'Remotely', hint: 'Send it to your partner' },
];

/**
 * Deck detail sheet — the storefront concept's `openSheet()`: gradient hero
 * carrying the deck's identity, a peek at the questions inside, the two ways
 * to play, and one call to action.
 *
 * Interaction opens this rather than pushing the deck route, because choosing
 * between two ways to play is a short decision made while the deck is still in
 * view — the route would throw the spread away to ask the same question.
 */
export function DeckSheet({ deck, samples, onPlay, price, onOpenChange }: Props) {
  const { mode: remembered } = usePlayMode();
  const { width } = useWindowDimensions();

  // The sheet owns its pick for this visit. It seeds from the remembered mode
  // and falls back to in-person, matching the concept's default of `together`.
  // Deliberately NOT usePlayMode().choose(): that writes the preference, and
  // tapping a mode here is a per-visit choice the shopper never asked to
  // remember.
  const [picked, setPicked] = useState<PlayMode | null>(null);
  const mode: PlayMode = picked ?? remembered ?? 'inperson';

  // The deck stays on screen for the length of the sheet's exit slide. Clearing
  // `deck` the instant the shopper dismisses would unmount the whole Sheet and
  // the slide-down would never play — the sheet would just vanish.
  const [lastDeck, setLastDeck] = useState(deck);
  useEffect(() => {
    if (!deck) return;
    const timer = setTimeout(() => setLastDeck(deck), 0);
    return () => clearTimeout(timer);
  }, [deck]);

  const shown = deck ?? lastDeck;
  const colors = useMemo(() => gradientFor(shown?.tone), [shown?.tone]);
  const ink = shown ? (DECK_INKS[shown.tone] ?? '#FFF9E8') : '#FFF9E8';

  if (!shown) return null;

  const cardWidth = Math.round(width * 0.62);

  return (
    <Sheet open={!!deck} onOpenChange={onOpenChange} title={shown.title} scroll>
      <View style={styles.hero}>
        <LinearGradient
          colors={[...colors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroWash}
          pointerEvents="none"
        />
        <View style={styles.heroRing} pointerEvents="none" />
        <View style={styles.tags}>
          <HeroTag label={`${shown.question_count} questions`} ink={ink} />
          <HeroTag label={RELATIONSHIP_LABEL[shown.relationship_type]} ink={ink} />
          {price ? <HeroTag label="Paid" ink="#2B1A0F" solid /> : null}
        </View>
        <Text variant="display" style={[styles.heroTitle, { color: ink }]}>
          {shown.title}
        </Text>
        {shown.tagline ? (
          <Text variant="body" style={[styles.heroTagline, { color: ink }]}>
            {shown.tagline}
          </Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text variant="smallBold" muted style={styles.label}>
          Sample questions{price ? ' · first one free' : ''}
        </Text>
        {samples.length === 0 ? (
          <Text variant="caption" muted>
            Loading what is inside…
          </Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={cardWidth + PEEK_GAP}
            decelerationRate="fast"
            disableIntervalMomentum
            style={styles.peek}
            contentContainerStyle={styles.peekRow}
          >
            {samples.map((sample, i) => (
              <View key={sample.id} style={[styles.sample, { width: cardWidth }]}>
                <Text variant="caption" muted style={styles.sampleIndex}>
                  {String(i + 1).padStart(2, '0')} / {shown.question_count}
                </Text>
                <Text variant="bodyStrong" numberOfLines={4}>
                  {sample.text}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.section}>
        <Text variant="smallBold" muted style={styles.label}>
          How do you want to play?
        </Text>
        <View style={styles.modes}>
          {MODES.map((option) => {
            const selected = mode === option.mode;
            return (
              <Pressable
                key={option.mode}
                onPress={() => setPicked(option.mode)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${option.label}. ${option.hint}`}
                style={[styles.mode, selected && styles.modeOn]}
              >
                <LucideIcon name={option.icon} size={22} color={selected ? '#2B1A0F' : undefined} />
                <Text variant="bodyStrong" style={styles.modeLabel}>
                  {option.label}
                </Text>
                <Text variant="caption" muted>
                  {option.hint}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <PlayAction
        label={price ? `Unlock for ${price}` : 'Start questions'}
        icon={price ? 'lock' : 'play'}
        onPlay={() => onPlay(shown, mode)}
      />
    </Sheet>
  );
}

/**
 * The call to action, mounted INSIDE the sheet.
 *
 * `useSheetAction` is a context, and `Sheet` provides it to its own children
 * only. A sheet component that consumed it from its own body was reading the
 * context's default value — an empty function — so the button was wired to
 * nothing at all and pressing it did nothing. Anything inside the sheet that
 * needs to navigate after the sheet has finished dismissing has to be a child
 * like this one, not a hook call in the parent.
 */
function PlayAction({
  label,
  icon,
  onPlay,
}: {
  label: string;
  icon: ChaleIconName;
  onPlay: () => void;
}) {
  const run = useSheetAction();
  return (
    <View style={styles.cta}>
      <Button label={label} icon={icon} onPress={() => run(onPlay)} />
    </View>
  );
}

function HeroTag({ label, ink, solid }: { label: string; ink: string; solid?: boolean }) {
  return (
    <View style={[styles.tag, solid && styles.tagSolid]}>
      <Text variant="smallBold" style={[styles.tagText, { color: solid ? '#2B1A0F' : ink }]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  hero: {
    padding: theme.spacing.four,
    borderRadius: theme.radii.hero,
    overflow: 'hidden',
    backgroundColor: theme.colors.ink,
  },
  heroWash: {
    ...StyleSheet.absoluteFillObject,
  },
  heroRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 30,
    borderColor: 'rgba(255,255,255,0.10)',
    right: -60,
    top: -60,
  },
  tags: {
    flexDirection: 'row',
    gap: theme.spacing.two,
  },
  tag: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: theme.radii.pill,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  tagSolid: {
    backgroundColor: '#FFF9E8',
  },
  tagText: {
    fontSize: 10,
    letterSpacing: 0.8,
  },
  heroTitle: {
    marginTop: theme.spacing.three,
  },
  heroTagline: {
    marginTop: theme.spacing.one,
    opacity: 0.85,
  },
  section: {
    gap: theme.spacing.two,
  },
  label: {
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  peek: {
    // The cards run past the sheet's own padding so the next one peeks in,
    // exactly like the concept's negative-margin snap row.
    marginHorizontal: -theme.spacing.four,
    // React Native's default ScrollView flexGrow: 1 would let this row absorb
    // leftover height inside the sheet's column and push the CTA off the
    // bottom. Pin it to its content.
    flexGrow: 0,
    flexShrink: 0,
  },
  peekRow: {
    paddingHorizontal: theme.spacing.four,
    gap: PEEK_GAP,
  },
  sample: {
    minHeight: 130,
    gap: theme.spacing.two,
    padding: theme.spacing.three,
    borderRadius: theme.radii.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.paper,
  },
  sampleIndex: {
    letterSpacing: 0.6,
  },
  modes: {
    flexDirection: 'row',
    gap: theme.spacing.two,
  },
  mode: {
    flex: 1,
    gap: theme.spacing.one,
    padding: theme.spacing.three,
    borderRadius: theme.radii.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.paper,
  },
  modeOn: {
    borderColor: theme.colors.ink,
    backgroundColor: theme.colors.surface,
  },
  modeLabel: {
    marginTop: theme.spacing.one,
  },
  cta: {
    paddingBottom: theme.spacing.two,
  },
}));