import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { LucideIcon } from './icon';
import { Text } from './text';

/**
 * Board-style checkbox row: a square tick box that fills street gold with an
 * ink check when on, plus an optional label and sub-line.
 *
 * Whole row is the target (44pt minimum), not just the box — this is the
 * "remember my choice" affordance in the play-mode sheet, and a 22pt box is
 * below the touch-target floor.
 */
export const Checkbox = memo(function Checkbox({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: !!disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={[styles.box, checked && styles.boxOn]}>
        {checked && <LucideIcon name="check" size={14} color="#2B1A0F" strokeWidth={3} />}
      </View>
      <View style={styles.copy}>
        <Text variant="smallBold" numberOfLines={1}>
          {label}
        </Text>
        {!!hint && (
          <Text variant="caption" muted>
            {hint}
          </Text>
        )}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.three,
    minHeight: 44,
    paddingVertical: theme.spacing.two,
  },
  rowPressed: { opacity: 0.6 },
  // Street gold when on: it is the loudest accent in the system and this row
  // sits under two buttons, so it must not compete with them.
  box: {
    width: 22,
    height: 22,
    borderRadius: theme.radii.chip * 0.6,
    borderWidth: 2,
    borderColor: theme.colors.ink,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: {
    backgroundColor: theme.colors.street,
    borderColor: theme.colors.street,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
}));