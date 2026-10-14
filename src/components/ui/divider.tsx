import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Text } from './text';

/**
 * Theme-aware hairline, optionally with a centred label ("or").
 *
 * The line reads `border` from the theme, so it stays a hairline in both
 * modes instead of a hardcoded cream that would vanish on dark paper.
 * Purely decorative — hidden from screen readers either way.
 */
export function Divider({ label }: { label?: string }) {
  if (!label) {
    return (
      <View
        style={styles.line}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    );
  }
  return (
    <View
      style={styles.row}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <View style={styles.line} />
      <Text variant="caption" muted>
        {label}
      </Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.two,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
}));
