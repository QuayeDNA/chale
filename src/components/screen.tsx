import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
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
 *
 * Pass `onRefresh` to get pull-to-refresh. The spinner is tinted with the page
 * colour so it reads on the paper background instead of the system blue.
 */
export function Screen({
  children,
  header,
  align = 'center',
  onRefresh,
  refreshing = false,
}: {
  children: ReactNode;
  header?: ReactNode;
  align?: 'start' | 'center';
  onRefresh?: () => void;
  refreshing?: boolean;
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
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.ink}
              colors={[theme.colors.street]}
              progressBackgroundColor={theme.colors.surface}
            />
          ) : undefined
        }
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
    // The pinned bar sits in its own band, so it needs breathing room above
    // and below or it reads as content butted against the status bar. The
    // gutter is the same value all the way round: a 24pt page margin with only
    // 8pt above it reads as a squeezed bar rather than a band, and the title
    // stops lining up with the content beneath it.
    paddingTop: theme.spacing.four,
    paddingBottom: theme.spacing.three,
    paddingHorizontal: theme.spacing.four,
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
