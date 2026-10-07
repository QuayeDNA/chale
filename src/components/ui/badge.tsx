import { View, type ViewProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Icon, type ChaleIconName } from './icon';
import { Text } from './text';

type Tone = 'street' | 'partner' | 'family' | 'friend' | 'muted';

type Props = ViewProps & {
  label: string;
  tone?: Tone;
  icon?: ChaleIconName;
  size?: 'sm' | 'md';
};

export function Badge({ label, tone = 'street', icon, size = 'sm', style, ...rest }: Props) {
  return (
    <View
      accessibilityRole="text"
      style={[styles.base, styles.tone(tone), styles.size(size), style]}
      {...rest}
    >
      {icon ? <Icon name={icon} size={size === 'md' ? 16 : 13} /> : null}
      <Text variant="label" style={[styles.label(tone), size === 'md' && styles.labelMd]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  base: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
  },
  size: (s: 'sm' | 'md') => {
    if (s === 'md') return { paddingVertical: 7, paddingHorizontal: 14 };
    return {};
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
        // Street fill is identical in light + dark, so the label stays
        // fixed dark ink for contrast instead of following the theme.
        return { color: '#2B1A0F' };
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
  labelMd: {
    fontSize: 13,
  },
}));
