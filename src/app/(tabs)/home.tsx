import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { DashboardHeader } from '@/components/dashboard-header';
import { DailyPromptCard, type DailyPromptState } from '@/components/daily-prompt-card';
import { ResumeCarousel, type ResumableSession } from '@/components/resume-carousel';
import { Text } from '@/components/ui/text';
import { Screen } from '@/components/screen';
import { useAuth } from '@/hooks/use-auth';
import { useConnection } from '@/hooks/use-connection';
import { useMyAnswer } from '@/hooks/use-my-answer';
import { useRealtimePrompt } from '@/hooks/use-realtime-prompt';
import { useTodayPromptPeek } from '@/hooks/use-today-prompt';
import { listDecks } from '@/lib/decks';
import { clearSession, listActiveSessions } from '@/lib/session-store';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Home is the state of play: what is waiting on you, what is in progress, and
 * one way into the catalogue. It is not a catalogue itself — `/decks` is.
 *
 * Built one section at a time against the redesign concept: header and
 * greeting, then the daily card, the resume tray, the browse row and the
 * premium banner.
 */
export default function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile, user, signOut } = useAuth();

  // Deck counts and titles change from outside the app, so the tray cards keep
  // their identity even when the person was last here weeks ago.
  const decks = useQuery({ queryKey: ['decks'], queryFn: listDecks });

  /**
   * A half-finished in-person session. Surfaced here because resume is close to
   * useless if the only way back to it is remembering which tile you tapped.
   */
  const sessions = useQuery({ queryKey: ['sessions', 'active'], queryFn: listActiveSessions });

  /**
   * Today's remote question, reported rather than assigned. `peek` never
   * creates a prompt — opening the dashboard must not spend the day — so it can
   * honestly say "nothing drawn yet" when nothing has been.
   */
  const conn = useConnection();
  // Only a LINKED connection is a partner. An invite that has been created but
  // not accepted is still pending, and treating it as a partner is what made
  // this screen skip "Invite partner" and claim there was a question to answer.
  const connectionId = conn.data?.status === 'linked' ? conn.data.id : null;
  const peek = useTodayPromptPeek(connectionId);
  const promptId = peek.data?.promptId ?? null;
  const myAnswer = useMyAnswer(promptId, user?.id ?? null);

  // The moment the other person answers, this flips to the reveal without
  // anyone pulling to refresh.
  useRealtimePrompt(promptId);

  const refresh = useCallback(() => {
    // The connection has to be in here too: an invite that gets accepted flips
    // this card from "waiting for them" to a real question, and nothing else on
    // the screen is watching that row.
    void queryClient.invalidateQueries({ queryKey: ['connection'] });
    void queryClient.invalidateQueries({ queryKey: ['sessions'] });
    void queryClient.invalidateQueries({ queryKey: ['decks'] });
    void queryClient.invalidateQueries({ queryKey: ['prompt'] });
    void queryClient.invalidateQueries({ queryKey: ['answers', 'mine'] });
  }, [queryClient]);

  /**
   * Home is a tab, so navigating away does NOT unmount it — a query that
   * resolved at launch would never run again and the card would report a day
   * that has already moved on.
   */
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const firstName = profile?.display_name?.split(/\s+/)[0];

  const all = decks.data ?? [];

  /**
   * Newest first (listActiveSessions sorts by startedAt). Every session whose
   * deck still resolves is kept, up to the tray's own cap — a shared phone can
   * be halfway through two decks at once, and offering only the newest quietly
   * loses the other. A plain loop rather than map().filter() so `deck` narrows
   * to `DeckSummary`, which a truthiness check on a `.find()` never does.
   */
  const resumable: ResumableSession[] = [];
  for (const session of sessions.data ?? []) {
    const deck = all.find((d) => d.id === session.packId);
    if (deck) resumable.push({ ...session, deck });
  }

  /**
   * Storage first, then the refetch. Invalidating while `clearSession` is still
   * writing lets `listActiveSessions` read the row that is on its way out, and
   * the tray then caches a session the user just threw away. It only shows on
   * the LAST card: with two of them the refetch comes back with the survivor,
   * so the stale entry is invisible.
   */
  const discardSession = async (packId: string) => {
    await clearSession(packId);
    await queryClient.invalidateQueries({ queryKey: ['sessions'] });
  };

  /**
   * Six honest shapes for a day. A connection is the only one we cannot infer
   * from the prompt, and `revealed` is the database's own word for
   * both-people-have-answered — it is only ever set by an answer being
   * submitted, never by a timer.
   *
   * A pending connection gets its own state: the invite is out, so this is not
   * "you have no partner" and it must not invite them a second time.
   */
  const dailyState: DailyPromptState = !connectionId
    ? conn.data?.status === 'pending'
      ? 'invite-pending'
      : 'no-connection'
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
   * return to the tab — the one wrong state this card can show.
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

  // Nothing renders until the day is fully known. A skeleton would have to
  // guess at the box, and the five states are one box now — so the honest
  // answer is to wait rather than to guess. A failed connection lookup is not
  // knowledge that there is no partner, so it hides the card rather than
  // inviting someone who is already linked.
  const dailyReady = !dailyLoading && !peek.isError && !conn.isError;

  return (
    <Screen
      align="start"
      onRefresh={refresh}
      refreshing={
        conn.isRefetching ||
        sessions.isRefetching ||
        peek.isRefetching ||
        myAnswer.isRefetching
      }
      header={
        <DashboardHeader
          name={profile?.display_name ?? null}
          seed={user?.id}
          // A reveal waiting to be opened is the one state here that is both
          // rare and actionable, so that is what earns the dot.
          hasUnread={dailyState === 'reveal'}
          onOpenProfile={() => router.push('/profile')}
          onOpenSettings={() => router.push('/settings')}
          onSignOut={() => void signOut()}
        />
      }
    >
      <View style={styles.greeting}>
        <Text variant="display" style={styles.greetingLead}>
          {greeting()}
          {firstName ? `, ${firstName}` : ''}
        </Text>
        <Text variant="body" muted style={styles.greetingSub}>
          What would you like to do today?
        </Text>
      </View>

      {dailyReady ? (
        <DailyPromptCard
          state={dailyState}
          question={peek.data?.text}
          onAction={openDaily}
        />
      ) : null}

      <ResumeCarousel
        sessions={resumable}
        onContinue={(packId) =>
          router.push({ pathname: '/session', params: { pack: packId } })
        }
        onDiscard={discardSession}
      />
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  // The concept sets the greeting as one 28px line with a muted second line at
  // the SAME size and weight — a single stacked block, not a headline and a
  // caption. Only the faces change here: Archivo Black for the line that
  // addresses you, Spline Sans for the one that does not, which is the weight
  // contrast the mockup gets from 700 vs 500.
  greeting: {
    gap: 4,
  },
  greetingLead: {
    fontSize: 28,
    lineHeight: 31,
    letterSpacing: -1,
  },
  greetingSub: {
    fontSize: 28,
    lineHeight: 31,
    letterSpacing: -1,
  },
}));
