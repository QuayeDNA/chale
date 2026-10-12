import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { DashboardHeader } from '@/components/dashboard-header';
import {
  DailyPromptCard,
  DailyPromptRow,
  isActiveDailyState,
  type DailyPromptState,
} from '@/components/daily-prompt-card';
import { DeckTile, DeckTileSkeleton } from '@/components/deck-tile';
import { ResumeCarousel, type ResumableSession } from '@/components/resume-carousel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LucideIcon } from '@/components/ui/icon';
import { ResponsiveGrid } from '@/components/ui/responsive-grid';
import { Text } from '@/components/ui/text';
import { Screen } from '@/components/screen';
import { deckTotalCopy, iconName, toneName } from '@/decks/art';
import { useAuth } from '@/hooks/use-auth';
import { useConnection } from '@/hooks/use-connection';
import { useMyAnswer } from '@/hooks/use-my-answer';
import { useRealtimeDecks } from '@/hooks/use-realtime-decks';
import { useRealtimePrompt } from '@/hooks/use-realtime-prompt';
import { useTodayPromptPeek } from '@/hooks/use-today-prompt';
import { listDecks, type DeckSummary } from '@/lib/decks';
import { clearSession, listActiveSessions } from '@/lib/session-store';

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
  const queryClient = useQueryClient();
  const { profile, user, signOut } = useAuth();

  // One round trip: the RPC returns every deck with its question count, so the
  // per-tile count queries (an N+1 that rendered six spinners) are gone.
  const decks = useQuery({ queryKey: ['decks'], queryFn: listDecks });

  // A half-finished in-person session. Surfaced here because resume is close to
  // useless if the only way back to it is remembering which tile you tapped.
  const sessions = useQuery({ queryKey: ['sessions', 'active'], queryFn: listActiveSessions });

  /**
   * Today's remote question, reported rather than assigned. `peek` never
   * creates a prompt — opening the dashboard must not spend the day — so it can
   * honestly say "nothing waiting today" when nothing has been drawn.
   */
  const conn = useConnection();
  const connectionId = conn.data?.id ?? null;
  const peek = useTodayPromptPeek(connectionId);
  const promptId = peek.data?.promptId ?? null;
  const myAnswer = useMyAnswer(promptId, user?.id ?? null);

  // Deck counts and titles change from outside the app, so the list stays live.
  useRealtimeDecks();
  // And so does today's question: the moment the other person answers, this
  // flips to the reveal without anyone pulling to refresh.
  useRealtimePrompt(promptId);

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['decks'] });
    void queryClient.invalidateQueries({ queryKey: ['sessions'] });
    void queryClient.invalidateQueries({ queryKey: ['prompt', 'today-peek'] });
    void queryClient.invalidateQueries({ queryKey: ['answers', 'mine'] });
  }, [queryClient]);

  /**
   * Home is a tab, so navigating to a deck does NOT unmount it — a query that
   * resolved at app start would never run again, and a session saved while the
   * player was away would stay invisible until a cold start. Refetching on focus
   * is what makes "pick up where you left off" mean anything on return.
   */
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const name = profile?.display_name ?? null;
  const firstName = name?.split(/\s+/)[0];

  const all = decks.data ?? [];
  const partner = all.filter(isPartner);
  const others = all.filter((d) => !isPartner(d));

  const openDeck = (id: string) => router.push({ pathname: '/deck/[id]', params: { id } });

  // Newest first (listActiveSessions sorts by startedAt). Every session whose
  // deck still resolves is kept, up to the carousel's own cap — a shared phone
  // can be halfway through two decks at once, and offering only the newest
  // quietly loses the other. A plain loop rather than map().filter() so `deck`
  // is narrowed to `DeckSummary`, which a truthiness check on a `.find()`
  // result never does on its own.
  const resumable: ResumableSession[] = [];
  for (const session of sessions.data ?? []) {
    const deck = all.find((d) => d.id === session.packId);
    if (deck) resumable.push({ ...session, deck });
  }

  const discardSession = (packId: string) => {
    void clearSession(packId);
    void queryClient.invalidateQueries({ queryKey: ['sessions'] });
  };

  /**
   * Five honest shapes for a day. Ordered by how hard they are to get wrong:
   * a connection is the only one we cannot infer from the prompt, and `revealed`
   * is the database's own word for both-people-have-answered — it is only ever
   * set to that by an answer being submitted, never by a timer.
   */
  const dailyState: DailyPromptState = !connectionId
    ? 'no-connection'
    : !peek.data
      ? 'not-drawn'
      : peek.data.reveal_state === 'revealed'
        ? 'reveal'
        : myAnswer.data
          ? 'waiting'
          : 'unanswered';

  /**
   * Held until the answer check lands. Without it someone who has already
   * answered sees their card flip back to "waiting on you" every time they
   * come back to the tab — the one wrong state this card can show.
   */
  const dailyLoading =
    conn.isPending || (!!connectionId && (peek.isPending || (!!promptId && myAnswer.isPending)));

  const openDaily = () => {
    if (!connectionId) return router.push('/start');
    if (promptId && peek.data?.reveal_state === 'revealed') {
      return router.push({ pathname: '/prompt/[id]', params: { id: promptId } });
    }
    router.push('/remote');
  };

  const dailyActive = isActiveDailyState(dailyState);
  /**
   * Nothing renders until the day is fully known. A skeleton would have to
   * guess between the Card and the row, and collapsing from one to the other
   * is a visible jump on a screen that is about to load four deck skeletons
   * underneath it anyway.
   */
  const dailyReady = !dailyLoading && !peek.isError;

  return (
    <Screen
      align="start"
      onRefresh={refresh}
      refreshing={
        decks.isRefetching ||
        sessions.isRefetching ||
        peek.isRefetching ||
        myAnswer.isRefetching
      }
      header={
        <DashboardHeader
          name={name}
          seed={user?.id}
          // The bell has always pulsed because nobody ever passed this. A
          // reveal waiting to be opened is the one state here that is both
          // rare and actionable, so that is what earns the dot.
          hasUnread={dailyState === 'reveal'}
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

      {/* Urgency decides the treatment, and the treatment decides the position.
          A day that is waiting on you earns a Card above the deck grid; a day
          that is idle gets one slim row down with the other secondary
          affordances (see below). That band is where promo, featured and
          paid-deck rows will go, so home grows downward instead of getting
          busier at the top. Hidden entirely on error rather than guessed at —
          a wrong claim about someone's relationship is worse than a missing
          card, and the Remote tab is one tap away. */}
      {dailyReady && dailyActive ? (
        <DailyPromptCard state={dailyState} question={peek.data?.text} onAction={openDaily} />
      ) : null}

      {/* The reason to reopen the app when a session is half done. Renders
          nothing at all when there are none, so it never leaves an orphan
          section label behind. */}
      <ResumeCarousel
        sessions={resumable}
        onContinue={(packId) =>
          router.push({ pathname: '/session', params: { pack: packId } })
        }
        onDiscard={discardSession}
      />

      <SectionLabel>Decks</SectionLabel>

      {decks.isPending ? (
        // Skeletons, not placeholder tiles: the placeholder said "Loading…" in
        // four brand colours, which read as four real decks that had nothing to
        // say. These borrow the tile's exact geometry so nothing shifts.
        <ResponsiveGrid minColumnWidth={150} gap={16}>
          {[0, 1, 2, 3].map((i) => (
            <DeckTileSkeleton key={i} />
          ))}
        </ResponsiveGrid>
      ) : decks.isError ? (
        <Card>
          <View style={styles.stateHead}>
            <LucideIcon name="info" size={20} />
            <Text variant="smallBold">Couldn&apos;t reach your decks</Text>
          </View>
          <Text variant="body" muted>
            They&apos;re still there — the connection just missed. Pull down, or try again.
          </Text>
          <Button label="Try again" variant="secondary" onPress={refresh} />
        </Card>
      ) : all.length === 0 ? (
        <Card>
          <View style={styles.stateHead}>
            <LucideIcon name="palette" size={20} />
            <Text variant="smallBold">No decks yet</Text>
          </View>
          <Text variant="body" muted>
            Your first pack is still being written. It&apos;ll land here on its own.
          </Text>
        </Card>
      ) : (
        <ResponsiveGrid minColumnWidth={150} gap={16}>
          {partner.map((deck) => (
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
          ))}
        </ResponsiveGrid>
      )}

      {/* The idle half of the day, sitting with the other things-you-can-do-
          later rows rather than competing with the deck grid for attention. */}
      {dailyReady && !dailyActive ? (
        <DailyPromptRow state={dailyState} onPress={openDaily} />
      ) : null}

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
  // Shared by the error and empty cards so every "nothing to show yet" state on
  // home has the same shape: icon + line, a sentence, and then an action if
  // there is anything the person can actually do about it.
  stateHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.two,
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
