import { useState } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import {
  SegmentedControl,
  type SegmentOption,
} from '@/components/ui/segmented-control';
import { VoiceRecorder, type VoiceRecording } from '@/components/voice-recorder';

export type AnswerMode = 'text' | 'voice';

/** The concept caps the answer at 500 characters and shows the count as you go. */
export const ANSWER_MAX = 500;

const MODES: SegmentOption<AnswerMode>[] = [
  { value: 'text', icon: 'pen', label: 'Text' },
  { value: 'voice', icon: 'mic', label: 'Voice' },
];

type Props = {
  /**
   * 'either' shows the mode switch; a voice or text question locks it, because
   * the question is asking for one specific kind of answer.
   */
  kind: 'text' | 'voice' | 'either';
  onSubmitText: (text: string) => void | Promise<void>;
  onSubmitVoice: (recording: VoiceRecording) => void | Promise<void>;
  /** Shown under the panel when a send fails. */
  sendError?: string;
};

/**
 * The remote answer panel — the concept's `answer(kind)`. Three things make it
 * this rather than a field and a button:
 *
 * - the send button's DISABLED LABEL SAYS WHY. "Write something to send" tells
 *   the reader what the control wants, where a greyed-out "Send" says nothing
 *   and reads as broken.
 * - nothing is sent until the button is tapped. The recorder holds the clip, so
 *   a mis-tap on the mic does not send a half-second of silence.
 * - the line above the field changes with the state of the clip, so the eye can
 *   read the recorder's phase without watching the pill.
 */
export function AnswerPanel({ kind, onSubmitText, onSubmitVoice, sendError }: Props) {
  const [mode, setMode] = useState<AnswerMode>(kind === 'voice' ? 'voice' : 'text');
  const [text, setText] = useState('');
  const [recording, setRecording] = useState<VoiceRecording | null>(null);
  const [phase, setPhase] = useState<'idle' | 'recording' | 'recorded' | 'sending'>('idle');
  const [clipError, setClipError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const active = kind === 'either' ? mode : kind;
  const textReady = text.trim().length > 0;
  const voiceReady = phase === 'recorded' && !!recording;
  const ready = active === 'text' ? textReady : voiceReady;

  // Why it cannot be sent yet. Each state names its own blocker rather than
  // sharing one vague message, so the button is never a mystery.
  const blocked =
    active === 'text'
      ? 'Write something to send'
      : phase === 'idle'
        ? 'Record something to send'
        : phase === 'recording'
          ? 'Stop recording to send'
          : 'Send answer';

  const hint =
    active === 'text'
      ? undefined
      : phase === 'recording'
        ? 'Recording…'
        : phase === 'recorded'
          ? 'Ready to send'
          : "Say it how you'd say it";

  const send = async () => {
    if (!ready || busy) return;
    setBusy(true);
    try {
      if (active === 'text') {
        await onSubmitText(text.trim());
        setText('');
      } else if (recording) {
        await onSubmitVoice(recording);
        setRecording(null);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.panel}>
      {kind === 'either' ? (
        <SegmentedControl options={MODES} value={mode} onChange={setMode} />
      ) : null}

      {active === 'text' ? (
        <TextInput
          label="Your answer"
          placeholder="Say it how you would say it…"
          multiline
          value={text}
          onChangeText={setText}
          maxLength={ANSWER_MAX}
          editable={!busy}
          trailing={
            <Text variant="caption" muted>
              {text.length} / {ANSWER_MAX}
            </Text>
          }
          style={styles.field}
        />
      ) : (
        <View style={styles.voiceBlock}>
          <View style={styles.labelRow}>
            <Text variant="smallBold">Your answer</Text>
            {hint ? (
              <Text variant="caption" muted>
                {hint}
              </Text>
            ) : null}
          </View>
          <VoiceRecorder
            align="start"
            showSend={false}
            onPhaseChange={setPhase}
            onRecorded={setRecording}
            onError={setClipError}
          />
        </View>
      )}

      <View style={styles.action}>
        <Button
          label={ready ? 'Send answer' : blocked}
          icon={ready ? 'check' : undefined}
          variant="inverse"
          size="md"
          fullWidth
          disabled={!ready || busy}
          onPress={() => void send()}
        />
      </View>

      {!ready && !busy ? (
        <Text variant="caption" muted style={styles.why}>
          Nothing is sent until you tap send.
        </Text>
      ) : null}
      {sendError || clipError ? (
        <Text variant="caption" style={styles.error}>
          {sendError ?? clipError}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  panel: {
    marginTop: theme.spacing.two,
    gap: theme.spacing.three,
  },
  // The concept's `.lab` row: a label and a quiet state on the same baseline.
  // TextInput draws its own, so the voice half builds the same one here rather
  // than reaching for a different field just because it needs a right-hand hint.
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.two,
  },
  voiceBlock: {
    gap: theme.spacing.two,
  },
  field: {
    minHeight: 96,
  },
  action: {
    alignItems: 'stretch',
  },
  why: {
    textAlign: 'center',
    marginTop: -4,
  },
  error: {
    color: theme.status.danger,
    textAlign: 'center',
  },
}));