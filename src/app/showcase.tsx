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
import { Icon, type ChaleIconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';

const ALL_ICONS: ChaleIconName[] = [
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

export default function ShowcaseScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [answer, setAnswer] = useState('');
  const [relation, setRelation] = useState<'partner'>('partner');

  if (!__DEV__) return <Redirect href="/" />;

  const noopAsync = async () => {};

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

          <SectionLabel>Cards</SectionLabel>
          <Card variant="default">
            <Text variant="smallBold">Default card</Text>
            <Text variant="body" muted>
              Base surface, border, standard radius.
            </Text>
          </Card>
          <Card variant="hero">
            <Text variant="smallBold">Hero card</Text>
            <Text variant="body" muted>
              Larger radius + padding for key moments.
            </Text>
          </Card>
          <Card variant="elevated">
            <Text variant="smallBold">Elevated card</Text>
            <Text variant="body" muted>
              Higher elevation.
            </Text>
          </Card>

          <SectionLabel>Icons</SectionLabel>
          <Card>
            <View style={styles.rowWrap}>
              {ALL_ICONS.map((name) => (
                <View key={name} style={styles.iconCell}>
                  <Icon name={name} size={20} />
                  <Text variant="caption">{name}</Text>
                </View>
              ))}
            </View>
          </Card>

          <SectionLabel>Inputs</SectionLabel>
          <Card>
            <Text variant="smallBold">Text input</Text>
            <TextInput
              placeholder="How are you really doing today?"
              value={answer}
              onChangeText={setAnswer}
              accessibilityLabel="Example text input"
            />
            <TextInput
              placeholder="Multiline…"
              multiline
              numberOfLines={3}
              accessibilityLabel="Example multiline input"
            />
            <Text variant="caption" muted>
              Focus border turns street yellow.
            </Text>
          </Card>

          <SectionLabel>Question + Answer loop</SectionLabel>
          <QuestionCard
            text="What's something small that made you smile today?"
            kind="text"
          />
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
  iconCell: {
    width: 72,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: 8,
  },
}));
