import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';

import { AnswerComposer } from '@/components/answer-composer';
import { AnswerModeToggle } from '@/components/answer-mode-toggle';
import { ConnectionInvite } from '@/components/connection-invite';
import { DeckTile } from '@/components/deck-tile';
import { PendingConnection } from '@/components/pending-connection';
import { QuestionCard } from '@/components/question-card';
import { RelationshipPicker } from '@/components/relationship-picker';
import { RevealCard } from '@/components/reveal-card';
import { SaveVoicePrompt } from '@/components/save-voice-prompt';
import { WaitingState } from '@/components/waiting-state';
import { VoiceRecorder } from '@/components/voice-recorder';
import { VoiceMessage } from '@/components/voice-message';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AnimatedIcon, LucideIcon, type ShowcaseIconName } from '@/components/ui/icon';
import { BrandLockup } from '@/components/ui/brand-lockup';
import { LoadingBar } from '@/components/ui/loading-bar';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';

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

export default function ShowcaseScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [answer, setAnswer] = useState('');
  const [fav, setFav] = useState(false);
  const [relation, setRelation] = useState<'partner'>('partner');

  if (!__DEV__) return <Redirect href="/" />;

  const noopAsync = async () => {};
  const noop = () => {};

  return (
    <View style={styles.page}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
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
              Every UI primitive and product component in one place. Rendered
              with mock data — no network calls.
            </Text>
          </View>

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
          </Card>

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

          <SectionLabel>Loading bar</SectionLabel>
          <Card>
            <View style={styles.stack}>
              <Text variant="smallBold">Determinate</Text>
              <LoadingBar progress={0.25} accessibilityLabel="Example loading 25 percent" />
              <LoadingBar progress={0.6} accessibilityLabel="Example loading 60 percent" />
              <LoadingBar progress={1} accessibilityLabel="Example loading complete" />
              <Text variant="smallBold">Small size</Text>
              <LoadingBar progress={0.6} size="sm" accessibilityLabel="Example small loading bar" />
              <Text variant="smallBold">Indeterminate</Text>
              <LoadingBar indeterminate accessibilityLabel="Example indeterminate loading" />
            </View>
          </Card>
          <Card>
            <View style={styles.darkPreview}>
              <Text variant="smallBold" style={styles.darkPreviewLabel}>
                On ink (splash context)
              </Text>
              <LoadingBar
                indeterminate
                track="rgba(251, 243, 223, 0.2)"
                accessibilityLabel="Example loading bar on dark background"
              />
            </View>
          </Card>

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
          <SaveVoicePrompt onSave={noopAsync} onSkip={() => {}} />

          <SectionLabel>Decks + connections</SectionLabel>
          <DeckTile title="Trotro Talks" count={24} onPress={() => {}} />
          <DeckTile title="Loading count" count={null} onPress={() => {}} />
          <RelationshipPicker value={relation} onChange={setRelation} />
          <ConnectionInvite inviteCode="CHALE-1234" onShare={() => {}} />
          <PendingConnection inviteCode="CHALE-1234" />

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
  stack: {
    gap: 12,
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
