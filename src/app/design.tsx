import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';

type Mode = 'text' | 'voice';
type Relationship = 'partner' | 'family' | 'friend';

const relationships: Record<
  Relationship,
  { label: string; accent: string; soft: string; text: string }
> = {
  partner: {
    label: 'Partner',
    accent: '#D85A30',
    soft: '#F5C4B3',
    text: '#4A1B0C',
  },
  family: {
    label: 'Family',
    accent: '#639922',
    soft: '#C0DD97',
    text: '#173404',
  },
  friend: {
    label: 'Friend',
    accent: '#D4537E',
    soft: '#F4C0D1',
    text: '#4B1528',
  },
};

export default function DesignScreen() {
  const router = useRouter();
  const { theme } = useUnistyles();
  const { width } = useWindowDimensions();

  const [mode, setMode] = useState<Mode>('text');
  const [relationship, setRelationship] =
    useState<Relationship>('partner');
  const [answer, setAnswer] = useState('');
  const [recording, setRecording] = useState(false);

  const compact = width < 380;
  const relation = relationships[relationship];

  return (
    <View style={styles.page}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: compact ? 20 : 28 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topbar}>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back home"
              hitSlop={8}
              style={styles.backButton}
            >
              <Text variant="label" muted>
                ← Back home
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open design showcase settings"
              hitSlop={8}
              style={styles.iconButton}
            >
              <Icon name="settings" size={19} />
            </Pressable>
          </View>

          <View style={styles.intro}>
            <Text variant="display">chale,</Text>
            <Text variant="body" muted>
              A warm, direct system built around one simple ritual:
              answer separately, then feel together.
            </Text>
          </View>

          <SectionLabel>Product moment</SectionLabel>

          <Card variant="hero">
            <View style={styles.contextRow}>
              <Badge
                label={relation.label}
                tone={relationship}
              />
              <Text variant="caption" muted>
                TODAY
              </Text>
            </View>

            <Text variant="caption" muted style={styles.questionKicker}>
              QUESTION
            </Text>

            <Text variant="display" style={styles.question}>
              What's something small that made you smile today?
            </Text>

            <Text variant="body" muted>
              Your answer stays tucked away until they answer too.
            </Text>

            <View style={styles.modeLabelRow}>
              <Text variant="label">How do you want to answer?</Text>
            </View>

            <View style={styles.modeRow}>
              <ModeButton
                active={mode === 'text'}
                label="Text"
                onPress={() => setMode('text')}
                accessibilityLabel="Answer with text"
                icon="message"
              />
              <ModeButton
                active={mode === 'voice'}
                label="Voice"
                onPress={() => setMode('voice')}
                accessibilityLabel="Answer with voice"
                icon="mic"
              />
            </View>

            {mode === 'text' ? (
              <View style={styles.composer}>
                <TextInput
                  placeholder="Say it how you'd say it to them."
                  value={answer}
                  onChangeText={setAnswer}
                  accessibilityLabel="Your answer"
                />
                <Button
                  label="Send answer"
                  fullWidth
                  variant="primary"
                />
              </View>
            ) : (
              <View style={styles.voiceComposer}>
                <Pressable
                  onPress={() => setRecording((value) => !value)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    recording
                      ? 'Stop recording'
                      : 'Start recording'
                  }
                  accessibilityState={{ selected: recording }}
                  style={[
                    styles.recordButton,
                    {
                      borderColor: relation.accent,
                      backgroundColor: recording
                        ? relation.soft
                        : theme.colors.surface,
                    },
                  ]}
                >
                  <Icon name={recording ? 'stop' : 'mic'} size={22} />
                  <Text variant="bodyStrong">
                    {recording ? 'Recording…' : 'Hold your thought'}
                  </Text>
                </Pressable>

                <Text variant="caption" muted>
                  Short and natural. You can listen before sending.
                </Text>
              </View>
            )}
          </Card>

          <View style={styles.stateGrid}>
            <StateCard
              eyebrow="After you answer"
              title="Waiting on them"
              body="You've answered. We'll let you know when the reveal is ready."
              icon="clock"
            />

            <StateCard
              eyebrow="When both answer"
              title="The reveal"
              body="Their answer and yours become visible together."
              icon="sparkles"
            />
          </View>

          <SectionLabel>Reveal</SectionLabel>

          <Card variant="hero">
            <Text variant="caption" muted>
              THE REVEAL
            </Text>
            <Text variant="title">
              You both answered.
            </Text>

            <View style={styles.answerStack}>
              <AnswerBlock
                label="Them"
                text="That tiny voice note you sent me this morning."
                accent={relation.accent}
              />
              <AnswerBlock
                label="You"
                text="When the trotro driver actually waited for me."
                accent={theme.colors.street}
              />
            </View>

            <View style={styles.reactionRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="React to their answer"
                style={styles.smallIconButton}
              >
                <Icon name="heart" size={18} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Play their voice answer"
                style={styles.smallIconButton}
              >
                <Icon name="play" size={18} />
              </Pressable>
            </View>
          </Card>

          <SectionLabel>Voice lifecycle</SectionLabel>

          <Card>
            <Text variant="smallBold">Walkie-talkie mode</Text>
            <Text variant="body" muted>
              The component changes state without changing its basic shape.
            </Text>

            <View style={styles.lifecycle}>
              <LifecycleStep label="Record" active />
              <LifecycleStep label="Preview" />
              <LifecycleStep label="Sent" />
              <LifecycleStep label="Listened" />
              <LifecycleStep label="Save?" />
            </View>

            <View style={styles.player}>
              <View style={styles.playerIcon}>
                <Icon name="play" size={16} />
              </View>
              <View style={styles.playerBody}>
                <Text variant="bodyStrong">Their voice</Text>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.trackProgress,
                      {
                        backgroundColor: relation.accent,
                        width: '42%',
                      },
                    ]}
                  />
                </View>
              </View>
              <Text variant="caption" muted>
                0:18
              </Text>
            </View>

            <View
              style={[
                styles.savePrompt,
                { backgroundColor: relation.soft },
              ]}
            >
              <Text
                variant="smallBold"
                style={{ color: relation.text }}
              >
                Kai this one?
              </Text>
              <Text
                variant="caption"
                style={{ color: relation.text }}
              >
                Both of you listened. Save your own clip if you want to keep it.
              </Text>
              <View style={styles.saveActions}>
                <Button label="Save" variant="accent" />
                <Button label="Let it go" variant="ghost" />
              </View>
            </View>
          </Card>

          <SectionLabel>Relationship context</SectionLabel>

          <Card>
            <Text variant="smallBold">
              Same bones, different relationship signal.
            </Text>
            <Text variant="body" muted>
              The foundation stays quiet. Only semantic accents shift with the connection.
            </Text>

            <View style={styles.relationshipList}>
              {(Object.keys(relationships) as Relationship[]).map(
                (key) => {
                  const item = relationships[key];
                  const selected = key === relationship;

                  return (
                    <Pressable
                      key={key}
                      onPress={() => setRelationship(key)}
                      accessibilityRole="button"
                      accessibilityLabel={`Use ${item.label} relationship theme`}
                      accessibilityState={{ selected }}
                      style={[
                        styles.relationshipRow,
                        selected && {
                          borderColor: item.accent,
                          backgroundColor: item.soft,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.relationshipDot,
                          { backgroundColor: item.accent },
                        ]}
                      />
                      <View style={styles.relationshipCopy}>
                        <Text
                          variant="bodyStrong"
                          style={
                            selected
                              ? { color: item.text }
                              : undefined
                          }
                        >
                          {item.label}
                        </Text>
                        <Text
                          variant="caption"
                          muted={!selected}
                          style={
                            selected
                              ? { color: item.text }
                              : undefined
                          }
                        >
                          Contextual accent only
                        </Text>
                      </View>
                      {selected ? (
                        <Icon name="check" size={18} />
                      ) : null}
                    </Pressable>
                  );
                },
              )}
            </View>
          </Card>

          <SectionLabel>Foundations</SectionLabel>

          <View style={styles.foundationGrid}>
            <TokenCard
              label="paper"
              value={theme.colors.paper}
              color={theme.colors.paper}
              text={theme.colors.ink}
              border={theme.colors.border}
            />
            <TokenCard
              label="surface"
              value={theme.colors.surface}
              color={theme.colors.surface}
              text={theme.colors.ink}
              border={theme.colors.border}
            />
            <TokenCard
              label="ink"
              value={theme.colors.ink}
              color={theme.colors.ink}
              text={theme.colors.paper}
              border={theme.colors.border}
            />
            <TokenCard
              label="border"
              value={theme.colors.border}
              color={theme.colors.border}
              text={theme.colors.ink}
              border={theme.colors.muted}
            />
            <TokenCard
              label="muted"
              value={theme.colors.muted}
              color={theme.colors.muted}
              text={theme.colors.paper}
              border={theme.colors.border}
            />
            <TokenCard
              label="street"
              value={theme.colors.street}
              color={theme.colors.street}
              text={theme.colors.ink}
              border={theme.colors.street}
            />
          </View>

          <SectionLabel>Controls</SectionLabel>

          <Card>
            <Text variant="smallBold">Button hierarchy</Text>
            <Text variant="body" muted>
              One primary action per moment. Secondary actions stay visually quiet.
            </Text>

            <View style={styles.buttonStack}>
              <Button
                label="Say am"
                variant="primary"
                fullWidth
              />
              <View style={styles.buttonRow}>
                <Button label="Accent" variant="accent" />
                <Button label="Outline" variant="outline" />
                <Button label="Ghost" variant="ghost" />
              </View>
            </View>
          </Card>

          <Card>
            <Text variant="smallBold">Input</Text>
            <TextInput
              placeholder="How are you really doing today?"
              value={answer}
              onChangeText={setAnswer}
              accessibilityLabel="Example text input"
            />
            <Text variant="caption" muted>
              Labels stay sentence case. Helper text explains the consequence, not the component.
            </Text>
          </Card>

          <SectionLabel>Typography</SectionLabel>

          <Card>
            <Text variant="display">One question.</Text>
            <Text variant="title">A moment worth answering.</Text>
            <Text variant="body">
              Spline Sans carries reading and interface copy. The display face is reserved for the moments that should feel unmistakably Chale.
            </Text>
            <Text variant="bodyStrong">
              Emphasis without shouting.
            </Text>
            <Text variant="label">MICROCOPY, TAGS, ACTIONS</Text>
            <Text variant="caption" muted>
              Secondary information, timestamps and helper text.
            </Text>
          </Card>

          <View style={styles.footer}>
            <Text variant="caption" muted>
              Designed around the loop: question → answer → wait → reveal.
              Keep the foundation warm. Let the relationship tell the story.
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

function ModeButton({
  active,
  label,
  icon,
  onPress,
  accessibilityLabel,
}: {
  active: boolean;
  label: string;
  icon: 'message' | 'mic';
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      style={[
        styles.modeButton,
        active && styles.modeButtonActive,
      ]}
    >
      <Icon name={icon} size={17} />
      <Text variant="bodyStrong">{label}</Text>
    </Pressable>
  );
}

function StateCard({
  eyebrow,
  title,
  body,
  icon,
}: {
  eyebrow: string;
  title: string;
  body: string;
  icon: 'clock' | 'sparkles';
}) {
  return (
    <Card>
      <View style={styles.stateIcon}>
        <Icon name={icon} size={17} />
      </View>
      <Text variant="caption" muted>
        {eyebrow}
      </Text>
      <Text variant="title">{title}</Text>
      <Text variant="body" muted>
        {body}
      </Text>
    </Card>
  );
}

function AnswerBlock({
  label,
  text,
  accent,
}: {
  label: string;
  text: string;
  accent: string;
}) {
  return (
    <View style={[styles.answerBlock, { borderLeftColor: accent }]}>
      <Text variant="label">{label}</Text>
      <Text variant="body">{text}</Text>
    </View>
  );
}

function LifecycleStep({
  label,
  active = false,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <View style={styles.lifecycleStep}>
      <View
        style={[
          styles.lifecycleDot,
          active && styles.lifecycleDotActive,
        ]}
      />
      <Text variant="caption">{label}</Text>
    </View>
  );
}

function TokenCard({
  label,
  value,
  color,
  text,
  border,
}: {
  label: string;
  value: string;
  color: string;
  text: string;
  border: string;
}) {
  return (
    <View
      style={[
        styles.tokenCard,
        { backgroundColor: color, borderColor: border },
      ]}
    >
      <Text variant="label" style={{ color: text }}>
        {label}
      </Text>
      <Text variant="caption" style={{ color: text }}>
        {value}
      </Text>
    </View>
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
    paddingTop: 18,
    paddingBottom: 64,
    gap: 28,
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
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  intro: {
    gap: 10,
    maxWidth: 620,
  },
  sectionLabel: {
    marginBottom: -14,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  questionKicker: {
    marginTop: 12,
  },
  question: {
    marginTop: 2,
  },
  modeLabelRow: {
    marginTop: 8,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.paper,
  },
  modeButtonActive: {
    borderColor: theme.colors.street,
    backgroundColor: theme.colors.surface,
  },
  composer: {
    gap: 12,
  },
  voiceComposer: {
    gap: 10,
  },
  recordButton: {
    minHeight: 60,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  stateIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.paper,
    marginBottom: 8,
  },
  answerStack: {
    gap: 10,
    marginTop: 8,
  },
  answerBlock: {
    borderLeftWidth: 3,
    paddingLeft: 14,
    gap: 5,
  },
  reactionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  smallIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lifecycle: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 8,
    paddingVertical: 8,
  },
  lifecycleStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lifecycleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  lifecycleDotActive: {
    backgroundColor: theme.colors.street,
  },
  player: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: theme.colors.paper,
  },
  playerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  playerBody: {
    flex: 1,
    gap: 7,
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: theme.colors.border,
  },
  trackProgress: {
    height: 4,
    borderRadius: 2,
  },
  savePrompt: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  saveActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  relationshipList: {
    gap: 8,
    marginTop: 4,
  },
  relationshipRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.paper,
  },
  relationshipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  relationshipCopy: {
    flex: 1,
    gap: 2,
  },
  foundationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tokenCard: {
    flexGrow: 1,
    flexBasis: 180,
    minHeight: 74,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  buttonStack: {
    gap: 12,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  footer: {
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
}));
