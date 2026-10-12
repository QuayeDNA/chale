import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Button } from './ui/button';
import { Card } from './ui/card';
import { LucideIcon, type ShowcaseIconName } from './ui/icon';
import { Text } from './ui/text';

/**
 * What a failed screen says when there is nothing else on it.
 *
 * Two rules, both learned the hard way. Say what failed and offer the one tap
 * that fixes it — a bare message with no retry is a dead end on a phone, where
 * the only other option is leaving the app. And never show this as a sibling of
 * a section that loaded fine: on a dashboard a half-failed screen should show
 * what still works, so callers pass this only when they have nothing else.
 */
export function ErrorCard({
  icon = 'info',
  title,
  body,
  onRetry,
  retryLabel = 'Try again',
}: {
  icon?: ShowcaseIconName;
  title: string;
  body?: string;
  onRetry: () => void;
  retryLabel?: string;
}) {
  return (
    <Card>
      <View style={styles.head}>
        <View style={styles.tile}>
          <LucideIcon name={icon} size={20} />
        </View>
        <Text variant="bodyStrong">{title}</Text>
      </View>
      {body ? (
        <Text variant="caption" muted>
          {body}
        </Text>
      ) : null}
      {/* Button drops `style`, so the retry needs a wrapper to sit on its own
          line at a natural width. */}
      <View style={styles.action}>
        <Button label={retryLabel} variant="secondary" size="sm" onPress={onRetry} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.two,
  },
  tile: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.chip,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.paper,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  action: {
    alignSelf: 'flex-start',
  },
}));
