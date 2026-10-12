import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

/** How a pair plays a deck. Kept as one value so the sheet and the CTA agree. */
export type PlayMode = 'inperson' | 'remote';

/**
 * Versioned so a future change to the shape can never read a stale payload.
 * Bump the suffix rather than migrating — this is a disposable preference.
 */
const KEY = 'chale.play-mode.v1';

type Stored = { mode: PlayMode | null; remember: boolean };

const NONE: Stored = { mode: null, remember: false };

function parse(raw: string | null): Stored {
  if (!raw) return NONE;
  try {
    const parsed = JSON.parse(raw) as Partial<Stored>;
    const mode = parsed.mode === 'inperson' || parsed.mode === 'remote' ? parsed.mode : null;
    // A remembered mode implies remembering. Anything else is a preference the
    // user explicitly declined, which must read as "ask me again".
    return { mode: parsed.remember ? mode : null, remember: !!parsed.remember && !!mode };
  } catch {
    return NONE;
  }
}

export type PlayModeState = {
  /** The remembered default, or null when the user has not chosen to remember. */
  mode: PlayMode | null;
  remember: boolean;
  /** False until the stored value has been read; don't render the CTA before this. */
  ready: boolean;
  /**
   * Records a choice. `remember` false applies the mode now but stores nothing,
   * so the next deck asks again.
   */
  choose: (mode: PlayMode, remember: boolean) => void;
};

/**
 * The remembered play mode.
 *
 * Device-local on purpose: it is a convenience about how this person likes to
 * start, not data about their relationship, so it should never gate the UI on
 * a network round trip. Deliberately the single seam for the preference — if
 * it ever needs to follow a user across devices, this file is the only one
 * that changes.
 */
export function usePlayMode(): PlayModeState {
  const [stored, setStored] = useState<Stored>(NONE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Deferred a tick: calling setState synchronously in an effect body
    // cascades renders (react-hooks/set-state-in-effect).
    const timer = setTimeout(() => {
      AsyncStorage.getItem(KEY)
        .then((raw) => setStored(parse(raw)))
        .catch(() => setStored(NONE))
        .finally(() => setReady(true));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const choose = useCallback((mode: PlayMode, remember: boolean) => {
    const next: Stored = { mode, remember };
    // Apply immediately so the CTA updates on the same frame as the tap;
    // storage is fire-and-forget because a failed write must not strand the
    // user on a sheet that will not close.
    setStored(remember ? next : NONE);
    void AsyncStorage.setItem(KEY, JSON.stringify(remember ? next : NONE)).catch(() => {});
  }, []);

  return { mode: stored.mode, remember: stored.remember, ready, choose };
}