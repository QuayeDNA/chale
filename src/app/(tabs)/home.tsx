import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { DashboardHeader } from '@/components/dashboard-header';
import { DailyPromptCard, type DailyPromptState } from '@/components/daily-prompt-card';
import { DeckBrowseRow } from '@/components/deck-browse-row';
import { ErrorCard } from '@/components/error-card';
import { FavouritesRow } from '@/components/favourites-row';
import {
  BrowseRowSkeleton,
  DailyCardSkeleton,
  FavouritesRowSkeleton,
  ResumeTraySkeleton,
} from '@/components/home-skeleton';
import { NextUpCard } from '@/components/next-up-card';
import { ResumeCarousel, type ResumableSession } from '@/components/resume-carousel';
import { SpotlightCarousel, type SpotlightPage } from '@/components/spotlight-carousel';
import { PremiumBanner } from '@/components/premium-banner';
import { Text } from '@/components/ui/text';
import { Screen } from '@/components/screen';
import { useAuth } from '@/hooks/use-auth';
import { useConnection } from '@/hooks/use-connection';
import { useMyAnswer } from '@/hooks/use-my-answer';
import { useRealtimePrompt } from '@/hooks/use-realtime-prompt';
import { useTodayPromptPeek } from '@/hooks/use-today-prompt';
import { listDecks } from '@/lib/decks';
import { listFavourites } from '@/lib/favourites';
import { clearSession, listActiveSessions } from '@/lib/session-store';
import { loadFlag, saveFlag } from '@/lib/flags-store';
import { freshLeft, loadSlot, mostRecentCompletion } from '@/lib/shuffle-store';

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
   * Hide is a starting preference, not a deletion. The invite stays one swipe
   * away in the spotlight pager; this flag only decides whether a returning
   * screen opens on the invite or on the recommendations.
   */
  const inviteDismissed = useQuery({
    queryKey: ['flags', 'invite-dismissed'],
    queryFn: () => loadFlag('invite-dismissed'),
  });

  /**
   * The last deck finished through "Back home" (never "Draw the next 20" —
   * that is a continuation, not a completion). Null until the first one.
   */
  const completion = useQuery({
    queryKey: ['packs', 'most-recent-completion'],
    queryFn: mostRecentCompletion,
  });

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
    // The recommendation reads device storage, so a Back-home finish elsewhere
    // in the app has to be re-read on focus too.
    void queryClient.invalidateQueries({ queryKey: ['flags'] });
    void queryClient.invalidateQueries({ queryKey: ['packs', 'most-recent-completion'] });
    void queryClient.invalidateQueries({ queryKey: ['shuffle'] });
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

  const allDecks = decks.data ?? [];

  // Locked packs are visible as a coming-soon banner, never mixed into the
  // playable browse row or used as today's recommendation.
  const all = allDecks.filter((d) => !d.is_locked);
  const featuredLocked = allDecks.find((d) => d.is_locked);

  /**
   * The recommendation slot's tenant. A freshly completed deck first; without
   * one, the default starting deck (`day-ones`, from the 0008 seed); with
   * neither, the slot stays empty rather than guessing.
   *
   * A completed deck that no longer resolves (unpublished since) falls back to
   * the default — the card names a real deck or it does not render.
   */
  const completedDeck = completion.data
    ? all.find((d) => d.id === completion.data?.packId)
    : undefined;
  const nextUp = completedDeck ?? all.find((d) => d.slug === 'day-ones') ?? all[0];

  /** The seed slot's cursor, so "N fresh left" is arithmetic rather than a guess. */
  const shuffle = useQuery({
    queryKey: ['shuffle', nextUp?.id],
    queryFn: () => loadSlot(nextUp!.id),
    enabled: !!nextUp,
  });

  const freshLeftFor = (deck: (typeof all)[number]): number =>
    shuffle.data
      ? freshLeft(deck.question_count, shuffle.data.cursor, deck.session_length)
      : deck.question_count;

  /** One-time preference. The invite stays reachable at /start and in the pager; this only moves the opening page. */
  const dismissInvite = useCallback(async () => {
    await saveFlag('invite-dismissed', true);
    await queryClient.invalidateQueries({ queryKey: ['flags'] });
  }, [queryClient]);

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
   * Saved questions. Gated on the user existing, because `listFavourites`
   * throws without one and a signed-out frame is not a failure worth showing.
   * Shares the `['favourites']` cache with the favourites tab and the profile
   * count, so hearting a question in a session lights this row up for free.
   */
  const favourites = useQuery({
    queryKey: ['favourites'],
    queryFn: listFavourites,
    enabled: !!user,
  });

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

  // The five states are one box now, so nothing renders until the day is fully
  // known — a skeleton would have to guess which box it is. A failed lookup is
  // not knowledge that there is no partner, so it hides the card rather than
  // inviting someone who is already linked.
  const dailyReady = !dailyLoading && !peek.isError && !conn.isError;

  // Failure gets its own section instead of a silent gap: a person opening the
  // app to a missing card cannot tell whether nothing is waiting or something
  // broke, and those want opposite reactions.
  const dailyError = !dailyLoading && (peek.isError || conn.isError);

  /**
   * The top slot is a pager, not a swap. The invite and the recommendation sit
   * side by side so hiding one never deletes the other — including while an
   * invite is pending, when the code and the decks both deserve to be seen.
   * More recommendation pages can join this list later without changing it.
   */
  const spotlightPages: SpotlightPage[] = [];
  if (
    !connectionId &&
    dailyReady &&
    (dailyState === 'no-connection' || dailyState === 'invite-pending')
  ) {
    spotlightPages.push({
      key: `invite-${dailyState}`,
      label: dailyState === 'invite-pending' ? 'Invite pending' : 'Invite partner',
      render: (style) => (
        <DailyPromptCard
          state={dailyState}
          question={peek.data?.text}
          onAction={openDaily}
          style={style}
          /*
           * Only the nothing-happened state can be sent to the back of the
           * pager: a pending invite must keep saying so, and the code is one
           * tap away at /start rather than lost. The chip lives in the card's
           * top row, so the card keeps its single action and this stays a
           * quiet exit.
           */
          onHide={dailyState === 'no-connection' ? () => void dismissInvite() : undefined}
        />
      ),
    });
  }
  if (!connectionId && nextUp) {
    spotlightPages.push({
      key: `next-up-${nextUp.id}-${completedDeck ? 'continuing' : 'default'}`,
      label: completedDeck ? `Continue ${nextUp.title}` : `Start with ${nextUp.title}`,
      render: (style) => (
        <NextUpCard
          deck={nextUp}
          freshLeft={freshLeftFor(nextUp)}
          continuing={!!completedDeck}
          style={style}
          onPress={() =>
            router.push({ pathname: '/session', params: { pack: nextUp.id } })
          }
        />
      ),
    });
  }
  const recommendationIndex = spotlightPages.findIndex((page) =>
    page.key.startsWith('next-up-'),
  );
  const spotlightStart =
    inviteDismissed.data && recommendationIndex >= 0 ? recommendationIndex : 0;
  const spotlightKey = `${spotlightPages.map((page) => page.key).join('|')}|start:${spotlightStart}`;

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

      {/*
        Each section owns its own loading and failure shape rather than the page
        having one spinner. The skeletons are the geometry of the thing they
        replace, so the layout does not jump when the real section lands.
      */}
      {dailyLoading ? (
        <DailyCardSkeleton />
      ) : dailyError ? (
        <ErrorCard
          title="Couldn't load today's question"
          body="Your decks are fine — this is just the connection between us and the server."
          onRetry={refresh}
        />
      ) : dailyReady ? (
        connectionId ? (
          <DailyPromptCard
            state={dailyState}
            question={peek.data?.text}
            onAction={openDaily}
          />
        ) : spotlightPages.length > 0 ? (
          /*
           * Invite and recommendation share one swipeable slot. Hiding moves
           * the opening page to the recommendations; it never removes the
           * invite, so the card the user hid is still one swipe away.
           */
          <SpotlightCarousel
            key={spotlightKey}
            pages={spotlightPages}
            startIndex={spotlightStart}
          />
        ) : decks.isPending ? (
          <DailyCardSkeleton />
        ) : null
      ) : null}

      {/* The tray only exists when there is something half-finished, so while
          the sessions are still loading the shape is reserved and then either
          filled or dropped. */}
      {sessions.isPending ? (
        <ResumeTraySkeleton />
      ) : (
        <ResumeCarousel
          sessions={resumable}
          onContinue={(packId) =>
            router.push({ pathname: '/session', params: { pack: packId } })
          }
          onDiscard={discardSession}
        />
      )}

      {/* Home is a dashboard, not a second catalogue. Browsing lives on /decks. */}
      {decks.isPending ? (
        <BrowseRowSkeleton />
      ) : decks.isError ? (
        <ErrorCard
          icon="palette"
          title="Couldn't reach your decks"
          body="Every deck comes from the server, so there is nothing to show until it answers."
          onRetry={refresh}
        />
      ) : all.length > 0 ? (
        <DeckBrowseRow decks={all} onPress={() => router.push('/decks')} />
      ) : null}

      {favourites.isPending ? (
        <FavouritesRowSkeleton />
      ) : favourites.isError ? (
        <ErrorCard
          icon="heart"
          title="Couldn't load your favourites"
          onRetry={refresh}
        />
      ) : (
        <FavouritesRow
          count={favourites.data?.length ?? 0}
          onPress={() => router.push('/favourites')}
        />
      )}

      {/*
        The locked plate is the one thing on a partner dashboard that is not
        about today's question, so it sits last: after what you saved, not
        before it.
      */}
      {featuredLocked ? <PremiumBanner deck={featuredLocked} /> : null}
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
