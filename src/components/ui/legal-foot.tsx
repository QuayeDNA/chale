import { Linking, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { LEGAL_LINKS, STUDIO_NAME, STUDIO_URL } from '@/constants/legal';
import { Text } from './text';

/** Fixed cream, for the ink-coloured splash ground — must not flip with the theme. */
const CREAM = '#FBF3DF';
const CREAM_MUTED = 'rgba(251, 243, 223, 0.7)';

/**
 * The opening screens' footer: studio credit plus legal links. Both screens show
 * the studio always; each legal link appears only once its URL exists in
 * `src/constants/legal.ts`, so nothing renders as a promise the app can't keep.
 */
export function LegalFoot({ tone = 'theme' }: { tone?: 'theme' | 'ink' }) {
  const onInk = tone === 'ink';
  const creditColor = onInk ? CREAM_MUTED : undefined;
  const linkColor = onInk ? CREAM : undefined;
  const available = LEGAL_LINKS.filter((l): l is { label: string; url: string } => l.url !== null);

  const open = (url: string | null) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {
      // A link the device can't open is worse than no link; stay put.
    });
  };

  return (
    <View style={styles.root}>
      {STUDIO_URL ? (
        <Pressable
          onPress={() => open(STUDIO_URL)}
          accessibilityRole="link"
          accessibilityLabel={`Made by ${STUDIO_NAME}`}
          style={styles.hitArea}>
          <Text variant="caption" muted={!onInk} style={[styles.credit, creditColor && { color: creditColor }]}>
            {`Made by ${STUDIO_NAME}`}
          </Text>
        </Pressable>
      ) : (
        <Text variant="caption" muted={!onInk} style={[styles.credit, creditColor && { color: creditColor }]}>
          {`Made by ${STUDIO_NAME}`}
        </Text>
      )}
      {available.length > 0 ? (
        <View style={styles.links}>
          {available.map((link, i) => (
            <View key={link.label} style={styles.linkItem}>
              {i > 0 ? <Text variant="caption" muted={!onInk} style={linkColor && { color: linkColor }}>{' · '}</Text> : null}
              <Pressable
                onPress={() => open(link.url)}
                accessibilityRole="link"
                accessibilityLabel={link.label}
                style={styles.hitArea}>
                <Text variant="caption" style={[styles.link, linkColor && { color: linkColor }]}>
                  {link.label}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: 2,
  },
  credit: {
    textAlign: 'center',
  },
  links: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hitArea: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  link: {
    textDecorationLine: 'underline',
  },
});
