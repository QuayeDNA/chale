import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { DashboardHeader } from '@/components/dashboard-header';
import { DeckTile } from '@/components/deck-tile';
import { LucideIcon } from '@/components/ui/icon';
import { ResponsiveGrid } from '@/components/ui/responsive-grid';
import { Text } from '@/components/ui/text';
import { Screen } from '@/components/screen';
import { deckTotalCopy, iconName, toneName } from '@/decks/art';
import { useAuth } from '@/hooks/use-auth';
import { listDecks, type DeckSummary } from '@/lib/decks';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function isPartner(deck: DeckSummary): boolean {
  // Home is the partner dashboard (ref1 screen 3, ref2 §10 "Home / Decks"):
  // the four partner decks in 2x2. Family and Friends live in the deck spread.
  return deck.relationship_type === 'partner';
}

export default function HomeScreen() {
  const router = useRouter();
  const { profile, user, signOut } = useAuth();

  // One round trip: the RPC returns every deck with its question count, so the
  // per-tile count queries (an N+1 that rendered six spinners) are gone.
  const decks = useQuery({ queryKey: ['decks'], queryFn: listDecks });

  const name = profile?.display_name ?? null;
  const firstName = name?.split(/\s+/)[0];

  const all = decks.data ?? [];
  const partner = all.filter(isPartner);
  const others = all.filter((d) => !isPartner(d));

  const openDeck = (id: string) => router.push({ pathname: '/deck/[id]', params: { id } });

  return (
    <Screen
      align="start"
      header={
        <DashboardHeader
          name={name}
          seed={user?.id}
          onOpenProfile={() => router.push('/profile')}
          onOpenSettings={() => router.push('/settings')}
          onSignOut={() => void signOut()}
        />
      }
    >
      {/* Board splits these into two weights — that contrast is the screen's
          whole hierarchy, so they are deliberately not one sentence. */}
      <View style={styles.greeting}>
        <Text variant="bodyStrong">
          {greeting()}
          {firstName ? `, ${firstName}` : ''}
        </Text>
        <Text variant="body" muted>
          What would you like to do today?
        </Text>
      </View>

      <SectionLabel>Decks</SectionLabel>

      {decks.error ? (
        <Text variant="body" muted>
          Couldn&apos;t load decks.
        </Text>
      ) : null}

      <ResponsiveGrid minColumnWidth={150} gap={16}>
        {partner.length > 0
          ? partner.map((deck) => (
              <DeckTile
                key={deck.id}
                title={deck.title}
                count={deckTotalCopy(deck)}
                icon={iconName(deck.icon)}
                tone={toneName(deck.tone)}
                slug={deck.slug}
                artKey={deck.art_key}
                onPress={() => openDeck(deck.id)}
              />
            ))
          : [0, 1, 2, 3].map((i) => (
              <DeckTile key={i} title="Loading…" count={null} tone="deep" onPress={() => {}} />
            ))}
      </ResponsiveGrid>

      {others.length > 0 ? (
        <>
          <SectionLabel>Also explore</SectionLabel>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Browse all decks, ${others.length} more`}
            onPress={() => openDeck(others[0]!.id)}
            style={({ pressed }) => [styles.moreRow, pressed && styles.morePressed]}
          >
            <View style={styles.moreCopy}>
              <Text variant="smallBold">More decks</Text>
              <Text variant="caption" muted>
                {others.map((d) => d.title).join(' · ')}
              </Text>
            </View>
            <LucideIcon name="chevron" size={20} />
          </Pressable>
        </>
      ) : null}
    </Screen>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text variant="smallBold" muted style={styles.sectionLabel}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create((theme) => ({
  greeting: {
    gap: 2,
  },
  sectionLabel: {
    marginTop: theme.spacing.three,
    marginBottom: theme.spacing.two,
    // Board sets section labels as small caps in the muted tone.
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  moreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.three,
    padding: theme.spacing.three,
    borderRadius: theme.radii.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    minHeight: 64,
  },
  morePressed: {
    opacity: 0.85,
  },
  moreCopy: {
    flex: 1,
    gap: 2,
  },
}));
