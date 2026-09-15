import { View, type ViewProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Text } from './text';

type Tone = 'street' | 'partner' | 'family' | 'friend' | 'muted';

type Props = ViewProps & {
  label: string;
  tone?: Tone;
};

export function Badge({ label, tone = 'street', style, ...rest }: Props) {
  return (
    <View style={[styles.base, styles.tone(tone), style]} {...rest}>
      <Text variant="label" style={styles.label(tone)}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  base: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
  },
  tone: (t: Tone) => {
    switch (t) {
      case 'street':
        return { backgroundColor: theme.colors.street, borderColor: theme.colors.street };
      case 'partner':
        return {
          backgroundColor: theme.relationship.partner.accentSoft,
          borderColor: theme.relationship.partner.accentSoft,
        };
      case 'family':
        return {
          backgroundColor: theme.relationship.family.accentSoft,
          borderColor: theme.relationship.family.accentSoft,
        };
      case 'friend':
        return {
          backgroundColor: theme.relationship.friend.accentSoft,
          borderColor: theme.relationship.friend.accentSoft,
        };
      case 'muted':
      default:
        return { backgroundColor: theme.colors.surface, borderColor: theme.colors.border };
    }
  },
  label: (t: Tone) => {
    switch (t) {
      case 'street':
        return { color: theme.colors.ink };
      case 'partner':
        return { color: theme.relationship.partner.accentText };
      case 'family':
        return { color: theme.relationship.family.accentText };
      case 'friend':
        return { color: theme.relationship.friend.accentText };
      case 'muted':
      default:
        return { color: theme.colors.muted };
    }
  },
}));
