import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Skeleton } from '@/components/ui/skeleton';

type Props = {
  /** In person the question is set larger and taller, so the hole must match. */
  inPerson?: boolean;
};

/**
 * The question card's own shape while the draw is in flight.
 *
 * A single block the size of the panel would say "something is coming" and
 * then jump the moment the real card landed, because the real card is not a
 * solid rectangle — it is a header, a tall column of words, a pill and two
 * buttons. Drawing each of those at its real height means the page settles
 * rather than snaps.
 */
export function QuestionCardSkeleton({ inPerson = false }: Props) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.panel}
    >
      <View style={styles.header}>
        <Skeleton width={132} height={24} radius={12} />
        <Skeleton width={44} height={14} radius={7} />
      </View>
      {/* Two bars standing in for a question that will wrap to two or three
          lines: a single one would read as a loading bar, not as prose. */}
      <View
        style={[styles.question, inPerson ? styles.questionInPerson : null]}
      >
        <Skeleton width="92%" height={26} radius={8} />
        <Skeleton width="74%" height={26} radius={8} />
      </View>
      <Skeleton width={172} height={36} radius={18} />
      <View style={styles.nav}>
        <Skeleton width={96} height={52} radius={16} />
        <Skeleton width={148} height={52} radius={16} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  panel: {
    borderRadius: theme.radii.hero,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: 20,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  question: {
    gap: 12,
    minHeight: 150,
    justifyContent: 'center',
  },
  questionInPerson: {
    minHeight: 190,
  },
  nav: {
    flexDirection: 'row',
    gap: 10,
  },
}));