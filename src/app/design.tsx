import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import Heart from 'lucide-react-native/icons/heart';
import MessageCircle from 'lucide-react-native/icons/message-circle';
import Mic from 'lucide-react-native/icons/mic';
import Sparkles from 'lucide-react-native/icons/sparkles';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';

export default function DesignScreen() {
  const router = useRouter();
  const { theme } = useUnistyles();
  const [inputValue, setInputValue] = useState('');

  return (
    <View style={styles.page}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => router.back()} style={styles.backRow}>
            <Text variant="label" muted>
              ← Back home
            </Text>
          </Pressable>

          <View style={styles.hero}>
            <Text variant="display">chale,</Text>
            <Text variant="body" muted>
              Design showcase — Playful Street Energy. Foundational tokens stay warm and quiet so
              the relationship accent can tell the story.
            </Text>
          </View>

          {/* Type scale */}
          <View style={styles.section}>
            <Text variant="label">Type scale</Text>
            <Card>
              <Text variant="display">Display — chale, question hero</Text>
              <Text variant="title">Title — section heads in Archivo Black</Text>
              <Text variant="body">Body — friendly Spline Sans for reading. The app speaks in sentence case, Pidgin when it fits.</Text>
              <Text variant="bodyStrong">Body strong — emphasis without shouting</Text>
              <Text variant="label">Label — microcopy, tags, actions</Text>
              <Text variant="caption">Caption — secondary, timestamps, helper text</Text>
            </Card>
          </View>

          {/* Colors */}
          <View style={styles.section}>
            <Text variant="label">Foundational palette</Text>
            <View style={styles.swatches}>
              <Swatch label="paper" color={theme.colors.paper} border={theme.colors.border} text={theme.colors.ink} />
              <Swatch label="surface" color={theme.colors.surface} border={theme.colors.border} text={theme.colors.ink} />
              <Swatch label="ink" color={theme.colors.ink} border={theme.colors.paper} text={theme.colors.paper} />
              <Swatch label="border" color={theme.colors.border} border={theme.colors.muted} text={theme.colors.ink} />
              <Swatch label="muted" color={theme.colors.muted} border={theme.colors.border} text={theme.colors.paper} />
              <Swatch label="street" color={theme.colors.street} border={theme.colors.street} text={theme.colors.ink} />
            </View>
            <Text variant="caption">
              Light: paper #FBF3DF / dark: #231408 · ink #2B1A0F · street #F5B400 — warm shadow, varied radii.
            </Text>
          </View>

          <View style={styles.section}>
            <Text variant="label">Relationship accents (contextual layer)</Text>
            <View style={styles.badgeRow}>
              <Badge label="partner · coral" tone="partner" />
              <Badge label="family · green" tone="family" />
              <Badge label="friend · pink" tone="friend" />
              <Badge label="street · signal" tone="street" />
            </View>
            <View style={styles.accentCards}>
              <View style={[styles.accentCard, { backgroundColor: theme.relationship.partner.accentSoft, borderColor: theme.relationship.partner.accent }]}>
                <Text variant="smallBold" style={{ color: theme.relationship.partner.accentText }}>partner</Text>
                <Text variant="caption" style={{ color: theme.relationship.partner.accentText }}>#D85A30 · #F5C4B3 · #4A1B0C</Text>
              </View>
              <View style={[styles.accentCard, { backgroundColor: theme.relationship.family.accentSoft, borderColor: theme.relationship.family.accent }]}>
                <Text variant="smallBold" style={{ color: theme.relationship.family.accentText }}>family</Text>
                <Text variant="caption" style={{ color: theme.relationship.family.accentText }}>#639922 · #C0DD97 · #173404</Text>
              </View>
              <View style={[styles.accentCard, { backgroundColor: theme.relationship.friend.accentSoft, borderColor: theme.relationship.friend.accent }]}>
                <Text variant="smallBold" style={{ color: theme.relationship.friend.accentText }}>friend</Text>
                <Text variant="caption" style={{ color: theme.relationship.friend.accentText }}>#D4537E · #F4C0D1 · #4B1528</Text>
              </View>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.section}>
            <Text variant="label">Buttons</Text>
            <Card>
              <Text variant="smallBold">Street is the app signal — accent is contextual</Text>
              <View style={styles.buttonGrid}>
                <Button label="Say am" variant="primary" />
                <Button label="Partner accent" variant="accent" />
                <Button label="Ghost" variant="ghost" />
                <Button label="Outline" variant="outline" />
              </View>
              <View style={styles.buttonGrid}>
                <Button label="Small" size="sm" variant="primary" />
                <Button label="Medium" size="md" variant="primary" />
                <Button label="Large" size="lg" variant="primary" />
              </View>
              <Button label="Full width · start with your person" fullWidth variant="primary" />
              <Text variant="caption">Pressed and disabled states use opacity — motion answers the tap, nothing auto-animates.</Text>
            </Card>
          </View>

          {/* Cards */}
          <View style={styles.section}>
            <Text variant="label">Cards — speech-bubble bones</Text>
            <Card variant="hero">
              <Text variant="title">Hero card — the question moment</Text>
              <Text variant="body" muted>
                Big radius (24), generous padding. This is where the daily question lives — the most characteristic moment.
              </Text>
              <View style={styles.inlineIcons}>
                <Icon as={MessageCircle} size={18} />
                <Icon as={Mic} size={18} />
                <Icon as={Heart} size={18} />
                <Icon as={Sparkles} size={18} />
              </View>
            </Card>
            <Card>
              <Text variant="smallBold">Default card</Text>
              <Text variant="body" muted>Radius 20, warm shadow. Used for lists, form groups, secondary content.</Text>
            </Card>
          </View>

          {/* Inputs */}
          <View style={styles.section}>
            <Text variant="label">Inputs</Text>
            <Card>
              <Text variant="smallBold">Text input — focused border goes street yellow</Text>
              <TextInput
                placeholder="How are you really doing today?"
                value={inputValue}
                onChangeText={setInputValue}
              />
              <Text variant="caption">Helper text stays muted and left-aligned. No all-caps labels.</Text>
            </Card>
          </View>

          <View style={styles.footer}>
            <Text variant="caption">
              One bold move at a time. Foundation stays quiet; accent tells the relationship story. Icons are lucide at 2px, rounded caps, per-icon imports.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Swatch({ label, color, border, text }: { label: string; color: string; border: string; text: string }) {
  return (
    <View style={[swatchStyles.swatch, { backgroundColor: color, borderColor: border }]}>
      <Text variant="label" style={{ color: text }}>
        {label}
      </Text>
      <Text variant="caption" style={{ color: text }}>
        {color}
      </Text>
    </View>
  );
}

const swatchStyles = StyleSheet.create(() => ({
  swatch: {
    flex: 1,
    minWidth: 92,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
}));

const styles = StyleSheet.create((theme) => ({
  page: {
    flex: 1,
    backgroundColor: theme.colors.paper,
  },
  safe: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.four,
    paddingTop: theme.spacing.three,
    paddingBottom: theme.spacing.six,
    gap: theme.spacing.five,
    maxWidth: theme.maxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  backRow: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  hero: {
    gap: theme.spacing.two,
  },
  section: {
    gap: theme.spacing.three,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.two,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.two,
  },
  accentCards: {
    gap: theme.spacing.two,
  },
  accentCard: {
    borderWidth: 1,
    borderRadius: theme.radii.card,
    padding: theme.spacing.three,
    gap: 6,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.two,
  },
  inlineIcons: {
    flexDirection: 'row',
    gap: theme.spacing.three,
    alignItems: 'center',
  },
  footer: {
    paddingTop: theme.spacing.two,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
}));
