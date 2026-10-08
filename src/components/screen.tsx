import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { useTabBarClearance } from './tab-bar-context';

/**
 * Standard screen shell: top/bottom safe areas, a scrolling body and an
 * optional pinned header that sits above the scroll area so it stays put.
 *
 * Inside the tabs navigator the body automatically reserves clearance for the
 * floating tab bar (via TabBarClearanceProvider), so no screen has to know
 * the bar's height.
 *
 * `align` defaults to 'center' because the auth/welcome/start screens were
 * built around vertically centred content; pass 'start' for a document-style
 * screen whose content should begin under the header.
 */
export function Screen({
  children,
  header,
  align = 'center',
}: {
  children: ReactNode;
  header?: ReactNode;
  align?: 'start' | 'center';
}) {
  const { theme } = useUnistyles();
  const clearance = useTabBarClearance();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {header ? <View style={styles.header}>{header}</View> : null}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          align === 'center' && styles.contentCentered,
          clearance > 0 && { paddingBottom: theme.spacing.four + clearance },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.paper,
  },
  header: {
    backgroundColor: theme.colors.paper,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.four,
    gap: theme.spacing.three,
  },
  contentCentered: {
    justifyContent: 'center',
  },
}));
