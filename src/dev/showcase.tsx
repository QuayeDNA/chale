import { Redirect, useRouter } from 'expo-router';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Pressable, ScrollView, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AnswerComposer } from '@/components/answer-composer';
import { AnswerModeToggle } from '@/components/answer-mode-toggle';
import { ConnectionInvite } from '@/components/connection-invite';
import { DeckTile, type DeckTone } from '@/components/deck-tile';
import type { DeckArtKey } from '@/decks/art';
import { PendingConnection } from '@/components/pending-connection';
import { QuestionCard } from '@/components/question-card';
import { RelationshipPicker } from '@/components/relationship-picker';
import { RevealCard } from '@/components/reveal-card';
import { SaveVoicePrompt } from '@/components/save-voice-prompt';
import { WaitingState } from '@/components/waiting-state';
import { VoiceRecorder } from '@/components/voice-recorder';
import { VoiceMessage } from '@/components/voice-message';
import { Badge } from '@/components/ui/badge';
import { FilterChips, type ChipOption } from '@/components/ui/filter-chips';
import { StorefrontCard } from '@/components/storefront-card';
import { StorefrontFlowView } from '@/components/storefront-flow-view';
import { gradientFor } from '@/decks/art';
import type { DeckSummary } from '@/lib/decks';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ResponsiveGrid } from '@/components/ui/responsive-grid';
import { AnimatedIcon, LucideIcon, type ChaleIconName, type ShowcaseIconName } from '@/components/ui/icon';
import { BrandLockup } from '@/components/ui/brand-lockup';
import { LoadingBar, type LoadingBarProps, type LoadingStatus } from '@/components/ui/loading-bar';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import { Avatar } from '@/components/ui/avatar';
import { Dropdown } from '@/components/ui/dropdown';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetOption } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';

/** Stand-in for a captured recording — speech-shaped, ~7s at 70ms intervals. */
const MOCK_LEVELS = Array.from({ length: 105 }, (_, i) => {
  const humps = Math.abs(Math.sin(i * 0.42)) * 0.6 + Math.abs(Math.sin(i * 0.13 + 2)) * 0.3;
  const jitter = Math.abs(Math.sin(i * 2.7)) * 0.18;
  return Math.min(1, 0.12 + humps + jitter);
});

const ALL_ICONS: ShowcaseIconName[] = [
  'heart',
  'message',
  'mic',
  'sparkles',
  'settings',
  'clock',
  'play',
  'stop',
  'check',
  'home',
  'people',
  'user',
  'bell',
  'palette',
  'globe',
  'help',
  'info',
  'logout',
  'chevron',
  'stats',
  'invite',
];

const ANIMATED_ICONS: { name: ShowcaseIconName; use: string }[] = [
  { name: 'mic', use: 'pulse · recording' },
  { name: 'heart', use: 'beat · favourite' },
  { name: 'bell', use: 'ring · notification' },
  { name: 'hourglass', use: 'spin · waiting' },
  { name: 'sparkles', use: 'twinkle · reveal' },
  { name: 'loader', use: 'spin · sending' },
];

const DECKS: {
  title: string;
  count: string;
  icon: ShowcaseIconName;
  tone: DeckTone;
  slug: string;
  artKey: DeckArtKey;
}[] = [  {
    title: 'Love & Relationships',
    count: '100 questions',
    icon: 'heart',
    tone: 'love',
    slug: 'love-and-relationships',
    artKey: 'stacked',
  },
  {
    title: 'Deep Talks',
    count: '80 questions',
    icon: 'message',
    tone: 'deep',
    slug: 'deep-talks',
    artKey: 'deck-edge',
  },
  {
    title: 'Fun & Silly',
    count: '60 questions',
    icon: 'sun',
    tone: 'silly',
    slug: 'fun-and-silly',
    artKey: 'scattered',
  },
  {
    title: 'Life & Dreams',
    count: '75 questions',
    icon: 'sparkles',
    tone: 'dreams',
    slug: 'life-and-dreams',
    artKey: 'stacked',
  },
  {
    title: 'Family Table',
    count: '65 questions',
    icon: 'house',
    tone: 'family',
    slug: 'family-table',
    artKey: 'deck-edge',
  },
  {
    title: 'Day Ones',
    count: '80 questions',
    icon: 'people',
    tone: 'friends',
    slug: 'day-ones',
    artKey: 'scattered',
  },
];

const FLOW_TAGLINES = [
  'Closer, honestly.',
  'The stuff that actually matters.',
  'No deep answers required.',
  'Where do you want to go from here?',
  'The people who made you.',
  'The people who knew you first.',
];

/**
 * The same six decks as list_packs_with_counts() would return them, so the
 * coverflow demo below drives the real carousel and the real dot track rather
 * than a stand-in for either.
 */
const FLOW_DECKS: DeckSummary[] = DECKS.map((deck, index) => ({
  id: `mock-${deck.slug}`,
  slug: deck.slug,
  title: deck.title,
  tagline: FLOW_TAGLINES[index] ?? null,
  icon: deck.icon,
  tone: deck.tone,
  art_key: deck.artKey,
  relationship_type:
    deck.tone === 'family' ? 'family' : deck.tone === 'friends' ? 'friend' : 'partner',
  session_length: 20,
  sort_order: index,
  is_locked: false,
  question_count: Number.parseInt(deck.count, 10) || 0,
}));

export default function ShowcaseScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [answer, setAnswer] = useState('');
  const [fav, setFav] = useState(false);
  const [relation, setRelation] = useState<'partner'>('partner');
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loadStatus, setLoadStatus] = useState<LoadingStatus>('active');
  const [chipDemo, setChipDemo] = useState<string>('partner');
  const [storefrontPick, setStorefrontPick] = useState<string | null>(null);
  const [flowActive, setFlowActive] = useState(0);
  const [section, setSection] = useState<SectionKey>('theme');
  const scrollRef = useRef<ScrollView>(null);
  const { theme, rt } = useUnistyles();
  const rnScheme = useColorScheme();

  if (!__DEV__) return <Redirect href="/" />;

  const noopAsync = async () => {};
  const noop = () => {};

  const goToSection = (key: SectionKey) => {
    setSection(key);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  return (
    <View style={styles.page}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topbar}>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={8}
              style={styles.backButton}
            >
              <Text variant="label" muted>
                ← Back
              </Text>
            </Pressable>
            <Badge label="DEV ONLY" tone="street" />
          </View>

          <View style={styles.intro}>
            <Text variant="display">Showcase</Text>
            <Text variant="body" muted>
              One section at a time, so the demos you are not looking at stay
              unmounted. Rendered with mock data — no network calls.
            </Text>
          </View>

          <SectionContext.Provider value={section}>
            <ShowcaseNav value={section} onChange={goToSection} />

            <ShowSection id="theme">
              <SectionLabel>Theme readout — report these values</SectionLabel>
          <Card>
            <Text variant="body">Unistyles scheme: {rt.colorScheme ?? 'none'}</Text>
            <Text variant="body">RN scheme: {rnScheme ?? 'none'}</Text>
            {[
              { label: 'Tab bar bg (paper)', value: theme.colors.paper },
              { label: 'Active pill fill (ink)', value: theme.colors.ink },
              { label: 'Pill content (paper)', value: theme.colors.paper },
              { label: 'Inactive (muted)', value: theme.colors.muted },
            ].map((row) => (
              <View key={row.label} style={styles.readoutRow}>
                <View
                  style={[styles.swatch, { backgroundColor: row.value }]}
                />
                <Text variant="caption">
                  {row.label}: {row.value}
                </Text>
              </View>
            ))}
          </Card>

          </ShowSection>

          <ShowSection id="typography">
          <SectionLabel>Typography — board spec</SectionLabel>
          <Card>
            <Text variant="caption" muted>
              Display 32 / Archivo Black — chale, Real questions.
            </Text>
            <Text variant="display">Real questions. Better conversations.</Text>
            <Text variant="caption" muted>
              Title 22 / Archivo Black
            </Text>
            <Text variant="title">Good evening, David</Text>
            <Text variant="caption" muted>Body 16/400 Spline Sans</Text>
            <Text variant="body">
              What would you like to do today? Spline Sans carries all reading
              and interface copy.
            </Text>
            <Text variant="caption" muted>BodyStrong 16/600</Text>
            <Text variant="bodyStrong">Emphasis without shouting.</Text>
            <Text variant="caption" muted>Label 13/600</Text>
            <Text variant="label">MICROCOPY, TAGS, ACTIONS</Text>
            <Text variant="caption" muted>Small 13/400 + SmallBold 13/600</Text>
            <Text variant="small">Small reading copy (13pt regular).</Text>
            <Text variant="smallBold">Small bold (13pt semibold).</Text>
            <Text variant="caption" muted>Caption 12/400 muted</Text>
            <Text variant="caption">
              Secondary information, timestamps and helper text.
            </Text>
          </Card>

          </ShowSection>

          <ShowSection id="buttons">
          <SectionLabel>Buttons — board instances</SectionLabel>
          <Card>
            <Text variant="smallBold">Variants (fully rounded)</Text>
            <View style={styles.rowWrap}>
              <Button label="Primary" variant="primary" />
              <Button label="Secondary" variant="secondary" />
              <Button label="Accent" variant="accent" />
              <Button label="Outline" variant="outline" />
              <Button label="Ghost" variant="ghost" />
              <Button label="Destructive" variant="destructive" />
            </View>
            <Text variant="smallBold">States</Text>
            <View style={styles.rowWrap}>
              <Button label="Disabled" disabled />
              <Button label="Disabled secondary" variant="secondary" disabled />
              <Button label="Loading" loading />
            </View>
            <Text variant="smallBold">Sizes</Text>
            <View style={styles.rowWrap}>
              <Button label="Small" size="sm" variant="secondary" />
              <Button label="Medium" size="md" />
              <Button label="Large" size="lg" />
            </View>
            <Text variant="smallBold">Full-width (as in flow)</Text>
            <Button label="Get started" fullWidth />
            <Button label="Send" fullWidth />
            <Button label="Next →" fullWidth />
            <Button label="Share invite" fullWidth />
            <Button label="Previous" variant="secondary" fullWidth />
            <Button label="Cancel" variant="secondary" fullWidth />
            <Button label="Just the two of us" variant="outline" fullWidth />
          </Card>

          </ShowSection>

          <ShowSection id="badges">
          <SectionLabel>Badges — board instances</SectionLabel>
          <Card>
            <Text variant="smallBold">Tones</Text>
            <View style={styles.rowWrap}>
              <Badge label="Street" tone="street" />
              <Badge label="partner" tone="partner" />
              <Badge label="family" tone="family" />
              <Badge label="friend" tone="friend" />
              <Badge label="Muted" tone="muted" />
            </View>
            <Text variant="smallBold">With icon + sizes</Text>
            <View style={styles.rowWrap}>
              <Badge label="Favourite" tone="street" icon="heart" />
              <Badge label="Love & Relationships" tone="street" size="md" />
              <Badge label="partner" tone="partner" size="md" />
            </View>
            <Text variant="smallBold">Filter chips — color-coded, single select</Text>
            <FilterChips
              options={CHIP_DEMO_OPTIONS}
              value={chipDemo}
              onChange={setChipDemo}
            />
          </Card>

          </ShowSection>

          <ShowSection id="cards">
          <SectionLabel>Cards — board instances</SectionLabel>
          <Card variant="hero">
            <Text variant="caption" muted>
              QUESTION CARD (hero, radius 24, padded 32)
            </Text>
            <Text variant="title">What&apos;s something you&apos;ve never told me before?</Text>
            <Text variant="body" muted>
              ♡ Favourite row sits inside the card on the board.
            </Text>
          </Card>
          <Card variant="default">
            <Text variant="caption" muted>DEFAULT (radius 20, padded 24)</Text>
            <Text variant="smallBold">Waiting on them…</Text>
            <Text variant="body" muted>
              Base surface, thin border, subtle shadow — the workhorse.
            </Text>
          </Card>
          <Card variant="elevated">
            <Text variant="caption" muted>ELEVATED (deeper shadow)</Text>
            <Text variant="smallBold">Deck detail sheet</Text>
            <Text variant="body" muted>
              Stronger lift for sheets and overlays.
            </Text>
          </Card>

          </ShowSection>

          <ShowSection id="icons">
          <SectionLabel>Icons — Lucide static (2px, rounded, 24px)</SectionLabel>
          <Card>
            <View style={styles.iconGrid}>
              {ALL_ICONS.map((name) => (
                <View key={name} style={styles.iconCell}>
                  <View style={styles.iconDisc}>
                    <LucideIcon name={name} size={24} />
                  </View>
                  <Text variant="caption">{name}</Text>
                </View>
              ))}
            </View>
          </Card>

          </ShowSection>

          <ShowSection id="icon-sizes">
          <SectionLabel>Icon sizes</SectionLabel>
          <Card>
            <View style={styles.sizeRow}>
              {[16, 20, 24, 32].map((s) => (
                <View key={s} style={styles.sizeCell}>
                  <LucideIcon name="heart" size={s} />
                  <Text variant="caption" muted>
                    {s}px
                  </Text>
                </View>
              ))}
            </View>
            <Text variant="caption" muted>
              Board default 24 · stroke 2 · round caps. Tab bar renders 20–24 by platform.
            </Text>
          </Card>

          </ShowSection>

          <ShowSection id="icons-animated">
          <SectionLabel>Icons — animated (Reanimated loops)</SectionLabel>
          <Card>
            <View style={styles.iconGrid}>
              {ANIMATED_ICONS.map(({ name, use }) => (
                <View key={name} style={styles.iconCell}>
                  <View style={styles.iconDisc}>
                    <AnimatedIcon name={name} size={24} />
                  </View>
                  <Text variant="caption">{name}</Text>
                  <Text variant="caption" muted>
                    {use}
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          </ShowSection>

          <ShowSection id="loading-bar">
          <SectionLabel>Loading bar — bar variant</SectionLabel>
          <Card>
            <View style={styles.stack}>
              <Text variant="smallBold">Determinate — auto-fills</Text>
              <AutoFillBar
                size="lg"
                accessibilityLabel="Example determinate loading bar filling"
              />
              <AutoFillBar accessibilityLabel="Example determinate loading bar" />
              <AutoFillBar accessibilityLabel="Example determinate loading bar" />
              <Text variant="caption" muted>
                These three loop 0 → 100% on one shared value. Every new progress
                eases over 450ms, so the fill grows instead of jumping, and the
                lead edge never thins below one dot.
              </Text>

              <Text variant="smallBold">Sizes — 6 / 10 / 14</Text>
              <AutoFillBar size="sm" accessibilityLabel="Small loading bar" />
              <AutoFillBar size="md" accessibilityLabel="Medium loading bar" />
              <AutoFillBar size="lg" accessibilityLabel="Large loading bar" />

              <Text variant="smallBold">Indeterminate — travelling sheen</Text>
              <LoadingBar indeterminate accessibilityLabel="Indeterminate loading bar" />
              <Text variant="caption" muted>
                Loops until status settles. With reduced motion on it holds a
                static 40% instead.
              </Text>

              <Text variant="smallBold">Status</Text>
              <AutoFillBar status="success" accessibilityLabel="Completed loading" />
              <AutoFillBar status="error" accessibilityLabel="Failed loading" />
              <Text variant="caption" muted>
                success #2E9E5B, error #D32F2F. Success snaps the fill to full;
                error keeps the fill and tints it red. Both cross-fade over
                250ms.
              </Text>

              <Text variant="smallBold">Tap to cycle status</Text>
              <Pressable
                onPress={() =>
                  setLoadStatus((s) =>
                    s === 'active' ? 'success' : s === 'success' ? 'error' : 'active',
                  )
                }
                accessibilityRole="button"
                accessibilityLabel="Cycle loading bar status"
                style={styles.loadCycle}
              >
                <LoadingBar
                  progress={loadStatus === 'active' ? undefined : 1}
                  status={loadStatus}
                  size="lg"
                  accessibilityLabel={`Live example, status ${loadStatus}`}
                />
                <Text variant="caption" muted style={styles.loadCycleHint}>
                  {loadStatus} — tap to change
                </Text>
              </Pressable>

              <Text variant="smallBold">Colour overrides</Text>
              <AutoFillBar
                fill={theme.relationship.partner.accent}
                accessibilityLabel="Loading bar with partner fill"
              />
              <LoadingBar
                indeterminate
                fill={theme.relationship.friend.accent}
                track={theme.colors.surface}
                accessibilityLabel="Loading bar with custom fill and track"
              />
            </View>
          </Card>

          </ShowSection>

          <ShowSection id="loading-segments">
          <SectionLabel>Loading bar — segments variant</SectionLabel>
          <Card>
            <View style={styles.stack}>
              <Text variant="smallBold">Determinate — fills pill by pill</Text>
              <AutoFillBar
                variant="segments"
                segments={5}
                accessibilityLabel="Segmented loading filling pill by pill"
              />
              <AutoFillBar
                variant="segments"
                segments={8}
                accessibilityLabel="Eight segment loading filling pill by pill"
              />
              <Text variant="caption" muted>
                Same shared 0 → 100% value. Each pill fills on its own turn, so
                5 pills read as big steps and 8 as fine ones.
              </Text>

              <Text variant="smallBold">Indeterminate — wave through the pills</Text>
              <LoadingBar
                variant="segments"
                segments={6}
                indeterminate
                size="lg"
                accessibilityLabel="Segmented indeterminate loading"
              />
              <Text variant="caption" muted>
                A playhead brightens each pill in turn — use this where the wait
                has visible steps (onboarding, a multi-part upload).
              </Text>

              <Text variant="smallBold">Status</Text>
              <LoadingBar
                variant="segments"
                segments={5}
                progress={1}
                status="success"
                accessibilityLabel="Segmented loading completed"
              />
              <LoadingBar
                variant="segments"
                segments={5}
                progress={1}
                status="error"
                accessibilityLabel="Segmented loading failed"
              />
            </View>
          </Card>
          </ShowSection>

          <ShowSection id="loading-dark">
          <Card>
            <View style={styles.darkPreview}>
              <Text variant="smallBold" style={styles.darkPreviewLabel}>
                On ink (splash context)
              </Text>
              <LoadingBar
                indeterminate
                track="rgba(251, 243, 223, 0.2)"
                accessibilityLabel="Loading bar on dark background"
              />
              <View style={styles.loadGap} />
              <LoadingBar
                variant="segments"
                segments={5}
                indeterminate
                track="rgba(251, 243, 223, 0.2)"
                accessibilityLabel="Segmented loading bar on dark background"
              />
            </View>
          </Card>

          </ShowSection>

          <ShowSection id="brand">
          <SectionLabel>Brand lockup</SectionLabel>
          <View style={styles.brandLightPreview}>
            <Text variant="smallBold" style={styles.brandLightLabel}>
              Dark artwork on light
            </Text>
            <BrandLockup variant="dark" width={200} />
          </View>
          <View style={styles.darkPreview}>
            <Text variant="smallBold" style={styles.darkPreviewLabel}>
              Light artwork on ink (splash)
            </Text>
            <BrandLockup variant="light" width={200} />
          </View>
          <View style={styles.brandLightPreview}>
            <Text variant="smallBold" style={styles.brandLightLabel}>
              No subtitle — dark on light (header)
            </Text>
            <BrandLockup variant="dark" subtitle={false} width={160} />
          </View>
          <View style={styles.darkPreview}>
            <Text variant="smallBold" style={styles.darkPreviewLabel}>
              No subtitle — light on ink
            </Text>
            <BrandLockup variant="light" subtitle={false} width={160} />
          </View>

          </ShowSection>

          <ShowSection id="inputs">
          <SectionLabel>Inputs</SectionLabel>
          <Card>
            <TextInput
              label="Answer"
              placeholder="How are you really doing today?"
              value={answer}
              onChangeText={setAnswer}
              hint="140 characters, from the heart."
              accessibilityLabel="Example text input"
            />
            <TextInput
              label="Story"
              placeholder="Multiline…"
              multiline
              numberOfLines={3}
              hint="Grows to a 96px minimum."
              accessibilityLabel="Example multiline input"
            />
            <TextInput
              label="Invite code"
              placeholder="CHALE-0000"
              defaultValue="CHALE-00"
              error="That code doesn't match any street."
              accessibilityLabel="Example error input"
            />
            <Text variant="caption" muted>
              56px single-line · street 2px focus ring · partner-red error.
            </Text>
          </Card>

          </ShowSection>

          <ShowSection id="question-states">
          <SectionLabel>Question card — states</SectionLabel>
          <QuestionCard
            question="What's something you've never told me before?"
            deckLabel="Love & Relationships"
            deckTone="partner"
            index={12}
            total={100}
            isFavourite={fav}
            onToggleFavourite={() => setFav((f) => !f)}
            onPrevious={noop}
            onNext={noop}
          />
          <QuestionCard
            question="What's a memory of us you never want to forget?"
            deckLabel="Family"
            deckTone="family"
            index={1}
            total={65}
            isFavourite
            onToggleFavourite={noop}
            onPrevious={noop}
            onNext={noop}
            prevDisabled
          />
          <QuestionCard
            question="Your person has sent a question!"
            deckLabel="Remote"
            deckTone="muted"
            hideNavigation
          />

          </ShowSection>

          <ShowSection id="answer-loop">
          <SectionLabel>Question + Answer loop</SectionLabel>
          <AnswerModeToggle mode={mode} onChange={setMode} />
          <Card>
            <Text variant="smallBold">Answer composer (text)</Text>
            <AnswerComposer onSubmit={noopAsync} />
          </Card>
          <Card>
            <Text variant="smallBold">Voice recorder</Text>
            <Text variant="body" muted>
              Requires microphone permission on device. Idle state shown here.
            </Text>
            <VoiceRecorder onSend={noopAsync} />
          </Card>
          <WaitingState />
          <RevealCard
            question="What's something small that made you smile today?"
            mine={{
              answerId: 'mock-mine',
              kind: 'text',
              content: 'When the trotro driver actually waited for me.',
            }}
            theirs={{
              answerId: 'mock-theirs',
              kind: 'text',
              content: 'That tiny voice note you sent me this morning.',
            }}
          />

          </ShowSection>

          <ShowSection id="voice">
          <SectionLabel>Voice message + save prompt</SectionLabel>
          <Card>
            <Text variant="smallBold">Voice message</Text>
            <Text variant="body" muted>
              Needs a real clip URL — this uses a placeholder and will show
              playback errors gracefully.
            </Text>
            <VoiceMessage
              url="https://example.com/mock-voice.m4a"
              answerId="mock-voice"
              label="Their voice answer"
            />
          </Card>
          <Card>
            <Text variant="smallBold">Voice message — captured levels</Text>
            <Text variant="body" muted>
              Same pill with a real waveform shape passed in. Playback needs a
              real clip; the waveform layout is what you&apos;re checking.
            </Text>
            <VoiceMessage
              url="https://example.com/mock-voice.m4a"
              answerId="mock-captured"
              label="Your voice answer"
              durationMs={7400}
              levels={MOCK_LEVELS}
            />
          </Card>
          <SaveVoicePrompt onSave={noopAsync} onSkip={() => {}} />

          </ShowSection>

          <ShowSection id="decks">
          <SectionLabel>Deck tiles — board §07</SectionLabel>
          <ResponsiveGrid minColumnWidth={150} gap={16}>
            {DECKS.map((deck) => (
              <DeckTile
                key={deck.title}
                title={deck.title}
                count={deck.count}
                icon={deck.icon}
                tone={deck.tone}
                slug={deck.slug}
                artKey={deck.artKey}
                onPress={() => {}}
              />
            ))}
          </ResponsiveGrid>

          </ShowSection>

          <ShowSection id="storefront-card">
          <SectionLabel>Storefront card — gradient face</SectionLabel>
          <Text variant="caption">
            Tap a card to select it. Radial gradient per tone, soft ring
            bottom-right, icon tile, tag chip.
          </Text>
          <View style={styles.storefrontRow}>
            {DECKS.slice(0, 3).map((deck) => {
              const selected = storefrontPick === deck.title;
              return (
                <View key={deck.title} style={styles.storefrontCell}>
                  <StorefrontCard
                    title={deck.title}
                    meta={deck.count}
                    icon={deck.icon}
                    colors={gradientFor(deck.tone)}
                    tag={selected ? 'SELECTED' : undefined}
                    selected={selected}
                    onPress={() => setStorefrontPick(deck.title)}
                  />
                </View>
              );
            })}
          </View>
          <Text variant="caption" muted>
            Selected: {storefrontPick ?? 'none yet'}
          </Text>
          <View style={styles.storefrontRow}>
            <View style={styles.storefrontCell}>
              <StorefrontCard
                title="Deep Talks"
                meta="80 questions · Partners"
                icon="message"
                colors={gradientFor('deep')}
                tag="POPULAR"
                onPress={() => {}}
              />
            </View>
            <View style={styles.storefrontCell}>
              <StorefrontCard
                title="Late Night"
                meta="50 questions · Partners"
                icon="clock"
                colors={['#7C5CFF', '#1B1240']}
                tag="PAID"
                onPress={() => {}}
              />
            </View>
          </View>

          </ShowSection>

          <ShowSection id="carousel">
          <SectionLabel>Coverflow carousel — rail + dot track</SectionLabel>
          <Text variant="caption">
            Drag the rail, or tap a neighbour to spring it to the centre. The
            street-gold bar under the rail slides after it and covers whichever
            dot it passes over.
          </Text>
          <View style={styles.flowDemo}>
            <StorefrontFlowView
              decks={FLOW_DECKS}
              active={flowActive}
              onActiveChange={setFlowActive}
              onOpenDeck={noop}
            />
          </View>
          <Text variant="caption" muted>
            Centred: {FLOW_DECKS[flowActive]?.title ?? 'none'}
          </Text>

          </ShowSection>

          <ShowSection id="avatar">
          <SectionLabel>Avatar — photo → generated → initials → icon</SectionLabel>
          <Card>
            <Text variant="smallBold">Generated faces (deterministic per seed)</Text>
            <View style={styles.avatarRow}>
              <Avatar seed="user-1" size={48} />
              <Avatar seed="user-2" size={48} />
              <Avatar seed="user-3" size={48} />
              <Avatar seed="user-4" size={48} />
              <Avatar seed="user-5" size={48} />
            </View>
            <Text variant="smallBold">Named — same face + tone every time</Text>
            <View style={styles.avatarRow}>
              <Avatar name="David Okafor" seed="user-1" size={48} />
              <Avatar name="Amara Chen" seed="user-2" size={48} />
              <Avatar name="Jon Park" seed="user-3" size={48} />
            </View>
            <Text variant="smallBold">Initials (generated={false})</Text>
            <View style={styles.avatarRow}>
              <Avatar name="David Okafor" seed="user-1" generated={false} size={48} />
              <Avatar name="Amara Chen" seed="user-2" generated={false} size={48} />
              <Avatar name="Jo" generated={false} size={48} />
            </View>
            <Text variant="smallBold">Sizes + icon fallback (no seed, no name)</Text>
            <View style={styles.avatarRow}>
              <Avatar name="David Okafor" seed="user-1" generated={false} size={32} />
              <Avatar name="David Okafor" seed="user-1" generated={false} size={40} />
              <Avatar name="David Okafor" seed="user-1" generated={false} size={56} />
              <Avatar generated={false} size={40} />
            </View>
            <Text variant="caption" muted>
              One seed drives the face, the style and the background tone. Guests
              with no seed get a face and tone fixed for the session.
            </Text>
          </Card>

          </ShowSection>

          <ShowSection id="dropdown">
          <SectionLabel>Dropdown — avatar trigger</SectionLabel>
          <Card>
            <View style={styles.dropdownDemo}>
              <Dropdown
                open={menuOpen}
                onOpenChange={setMenuOpen}
                label="Profile menu"
                align="left"
                trigger={<Avatar name="David Okafor" seed="user-1" size={48} />}
                items={[
                  { key: 'profile', label: 'Profile', icon: 'user', onPress: noop },
                  { key: 'settings', label: 'Settings', icon: 'settings', onPress: noop },
                  { key: 'logout', label: 'Log out', icon: 'logout', destructive: true, onPress: noop },
                ]}
              />
              <Text variant="caption" muted style={styles.dropdownNote}>
                Controlled (open state lives in the parent). Tap the avatar, tap outside to dismiss.
                Anchor left when the trigger sits left, right when it sits right (header avatar).
              </Text>
            </View>
          </Card>

          </ShowSection>

          <ShowSection id="sheet">
          <SectionLabel>Bottom sheet — a decision, not a screen</SectionLabel>
          <Card>
            <Checkbox
              checked={remember}
              onChange={setRemember}
              label="Remember my choice"
              hint="Skips this next time. You can still change it any time."
            />
            <Checkbox checked={false} onChange={noop} label="Unchecked state" />
            <Text variant="caption" muted style={styles.dropdownNote}>
              Whole row is the target, so the 22pt box never has to be hit.
            </Text>
            <Button label="How do you want to play?" onPress={() => setSheetOpen(true)} />
          </Card>

          <Sheet
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            title="How do you want to play?"
            caption="Deep Talks · 20 questions a session"
          >
            <SheetOption
              icon="people"
              label="Just the two of us"
              hint="One device, 20 questions, you take turns."
              onPress={() => setSheetOpen(false)}
            />
            <SheetOption
              icon="invite"
              label="Send it remotely"
              hint="Get an invite code, then Deep Talks arrives a day at a time."
              onPress={() => setSheetOpen(false)}
            />
            <Checkbox
              checked={remember}
              onChange={setRemember}
              label="Remember my choice"
              hint="Skips this next time. You can still change it any time."
            />
          </Sheet>

          </ShowSection>

          <ShowSection id="skeleton">
          <SectionLabel>Skeleton — shimmer placeholders</SectionLabel>
          <Card>
            <View style={styles.avatarRow}>
              <Skeleton width={56} height={56} radius={28} />
              <View style={styles.skeletonLines}>
                <Skeleton width="80%" height={16} />
                <Skeleton width="55%" height={12} radius={8} />
              </View>
            </View>
            <Skeleton height={96} radius={20} />
          </Card>

          </ShowSection>

          <ShowSection id="connections">
          <SectionLabel>Connections</SectionLabel>
          <RelationshipPicker value={relation} onChange={setRelation} />
          <ConnectionInvite inviteCode="CHALE-1234" onShare={() => {}} />
          <PendingConnection inviteCode="CHALE-1234" />

          </ShowSection>
          </SectionContext.Provider>

          <View style={styles.footer}>
            <Text variant="caption" muted>
              Dev-only route at /showcase. FAB hides on this screen and in
              production builds (__DEV__ === false).
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/**
 * Every group in the showcase is mounted one at a time. The whole page used to
 * render at once — three live audio players, a metering recorder, endless
 * Reanimated loops and the DiceBear avatar builder — which made the screen
 * stutter. Gating on the active key means only the section you are looking at
 * pays for its demos.
 */
const CHIP_DEMO_OPTIONS: ChipOption<string>[] = [
  { value: 'all', label: 'All', tone: 'street' },
  { value: 'partner', label: 'Partners', tone: 'partner' },
  { value: 'family', label: 'Family', tone: 'family' },
  { value: 'friend', label: 'Friends', tone: 'friend' },
  { value: 'store', label: 'Shop', tone: 'muted' },
];

const SECTIONS = [
  { key: 'theme', label: 'Theme readout' },
  { key: 'typography', label: 'Typography' },
  { key: 'buttons', label: 'Buttons' },
  { key: 'badges', label: 'Badges' },
  { key: 'cards', label: 'Cards' },
  { key: 'icons', label: 'Icons — static' },
  { key: 'icon-sizes', label: 'Icons — sizes' },
  { key: 'icons-animated', label: 'Icons — animated' },
  { key: 'loading-bar', label: 'Loading bar' },
  { key: 'loading-segments', label: 'Loading bar — segments' },
  { key: 'loading-dark', label: 'Loading bar — on ink' },
  { key: 'brand', label: 'Brand lockup' },
  { key: 'inputs', label: 'Inputs' },
  { key: 'question-states', label: 'Question card — states' },
  { key: 'answer-loop', label: 'Question + answer loop' },
  { key: 'voice', label: 'Voice message + save prompt' },
  { key: 'decks', label: 'Deck tiles' },
  { key: 'storefront-card', label: 'Storefront card' },
  { key: 'carousel', label: 'Coverflow carousel' },
  { key: 'avatar', label: 'Avatar' },
  { key: 'dropdown', label: 'Dropdown' },
  { key: 'sheet', label: 'Sheet + checkbox' },
  { key: 'skeleton', label: 'Skeleton' },
  { key: 'connections', label: 'Connections' },
] as const;

type SectionKey = (typeof SECTIONS)[number]['key'];

const SectionContext = createContext<SectionKey>('theme');

function ShowSection({
  id,
  children,
}: {
  id: SectionKey;
  children: ReactNode;
}) {
  const active = useContext(SectionContext);
  if (active !== id) return null;
  return <>{children}</>;
}

function ShowcaseNav({
  value,
  onChange,
}: {
  value: SectionKey;
  onChange: (key: SectionKey) => void;
}) {
  const { theme } = useUnistyles();
  const [open, setOpen] = useState(false);
  const index = SECTIONS.findIndex((s) => s.key === value);
  const current = SECTIONS[index] ?? SECTIONS[0];

  const step = (delta: number) => {
    const next = (index + delta + SECTIONS.length) % SECTIONS.length;
    onChange(SECTIONS[next].key);
  };

  return (
    <View style={styles.nav}>
      <Pressable
        onPress={() => step(-1)}
        accessibilityRole="button"
        accessibilityLabel="Previous section"
        hitSlop={8}
        style={styles.navStep}
      >
        <LucideIcon name="chevron-left" size={18} />
      </Pressable>

      <Dropdown
        open={open}
        onOpenChange={setOpen}
        align="left"
        label="Jump to a component"
        minWidth={240}
        items={SECTIONS.map((s) => ({
          key: s.key,
          label: s.label,
          icon: s.key === value ? ('check' as ChaleIconName) : undefined,
          onPress: () => onChange(s.key),
        }))}
        trigger={
          <View style={styles.navTrigger}>
            <Text variant="smallBold" numberOfLines={1} style={styles.navTriggerText}>
              {current.label}
            </Text>
            <LucideIcon name="chevron-down" size={16} color={theme.colors.muted} />
          </View>
        }
      />

      <Pressable
        onPress={() => step(1)}
        accessibilityRole="button"
        accessibilityLabel="Next section"
        hitSlop={8}
        style={styles.navStep}
      >
        <LucideIcon name="chevron" size={18} />
      </Pressable>
    </View>
  );
}

/**
 * Demo-only wrapper: owns its own ticker so the 0 -> 100% loop re-renders this
 * leaf instead of the whole showcase screen. Omit `progress` to let it drive.
 */
function AutoFillBar({
  msPerCycle = 2400,
  progress,
  ...barProps
}: LoadingBarProps & { msPerCycle?: number }) {
  const [auto, setAuto] = useState(0);

  useEffect(() => {
    // 80ms is plenty: the bar eases toward each value over 450ms, so a faster
    // tick just burns renders without looking any smoother.
    const step = 80;
    const id = setInterval(() => {
      setAuto((p) => (p >= 1 ? 0 : p + step / msPerCycle));
    }, step);
    return () => clearInterval(id);
  }, [msPerCycle]);

  return <LoadingBar progress={progress ?? auto} {...barProps} />;
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text variant="label" style={styles.sectionLabel}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create((theme) => ({
  page: {
    flex: 1,
    backgroundColor: theme.colors.paper,
  },
  safe: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 64,
    gap: 16,
  },
  topbar: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    minHeight: 44,
    justifyContent: 'center',
  },
  intro: {
    gap: 8,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navStep: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  navTrigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  navTriggerText: {
    flexShrink: 1,
  },
  sectionLabel: {
    marginTop: 12,
    marginBottom: -6,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconCell: {
    flexGrow: 1,
    flexBasis: 100,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  iconDisc: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 20,
  },
  sizeCell: {
    alignItems: 'center',
    gap: 6,
  },
  readoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deckGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  deckCell: {
    flexGrow: 1,
    flexBasis: 160,
  },
  storefrontRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 8,
  },
  storefrontCell: {
    width: 148,
  },
  flowDemo: {
    // The carousel is edge to edge, so it cancels the showcase's own padding.
    marginHorizontal: -theme.spacing.four,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownDemo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  dropdownNote: {
    flex: 1,
    flexShrink: 1,
  },
  skeletonLines: {
    flex: 1,
    gap: 8,
  },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  stack: {
    gap: 12,
  },
  loadCycle: {
    gap: 6,
  },
  loadCycleHint: {
    textAlign: 'center',
  },
  loadGap: {
    height: 4,
  },
  darkPreview: {
    // Fixed brand pair — never follows the theme.
    backgroundColor: '#2B1A0F',
    borderRadius: 20,
    padding: 24,
    gap: 12,
  },
  darkPreviewLabel: {
    color: '#FBF3DF',
  },
  brandLightPreview: {
    // Fixed brand pair — never follows the theme.
    backgroundColor: '#FFF9E8',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EDE0BE',
    padding: 24,
    gap: 12,
  },
  brandLightLabel: {
    color: '#2B1A0F',
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: 8,
  },
}));
