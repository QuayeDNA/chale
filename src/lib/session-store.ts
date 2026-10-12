import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DrawnQuestion } from './decks';

/**
 * In-person session state, kept on the device.
 *
 * A session used to live entirely in React state, so putting the phone down or
 * navigating away lost the draw AND the position — coming back ran a brand new
 * shuffle from question one. Casual, in-person play is meant to be
 * interruptible, so the session has to survive.
 *
 * Device-local rather than a `sessions` table on purpose: an in-person session
 * is two people sharing one phone, so there is no second device to sync with.
 * A table would add a migration, write traffic on every tap, and still have to
 * cope with guests — for no gain. Same reasoning as the play-mode preference.
 *
 * One slot per deck, so starting Fun & Silly never silently destroys a
 * half-finished Deep Talks.
 */
const PREFIX = 'chale.session.v1.';

/** Past this a stored session is not "where you left off", it's a new night. */
const STALE_MS = 7 * 24 * 60 * 60 * 1000;

export type StoredSession = {
  packId: string;
  questions: DrawnQuestion[];
  /** Zero-based position of the question currently showing. */
  index: number;
  startedAt: number;
};

export type SessionMeta = {
  packId: string;
  index: number;
  total: number;
  startedAt: number;
};

const keyFor = (packId: string) => `${PREFIX}${packId}`;

/**
 * Rejects anything that cannot be resumed. Storage is user-writable and
 * survives app updates, so a payload from an older shape must degrade to "no
 * session" rather than crash a screen.
 */
function validate(raw: unknown, packId: string): StoredSession | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const s = raw as Partial<StoredSession>;

  if (!Array.isArray(s.questions) || s.questions.length === 0) return null;
  if (typeof s.index !== 'number' || !Number.isInteger(s.index)) return null;
  // Out of range means the session was finished (or the deck shrank under it).
  if (s.index < 0 || s.index >= s.questions.length) return null;
  if (typeof s.startedAt !== 'number') return null;
  if (Date.now() - s.startedAt > STALE_MS) return null;
  if (!s.questions.every((q) => q && typeof q.id === 'string' && typeof q.text === 'string')) {
    return null;
  }

  return {
    packId,
    questions: s.questions,
    index: s.index,
    startedAt: s.startedAt,
  };
}

export async function loadSession(packId: string): Promise<StoredSession | null> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(packId));
    if (!raw) return null;
    const parsed = validate(JSON.parse(raw), packId);
    // Drop it rather than re-validating on every mount.
    if (!parsed) await clearSession(packId);
    return parsed;
  } catch {
    return null;
  }
}

export async function saveSession(session: StoredSession): Promise<void> {
  try {
    await AsyncStorage.setItem(keyFor(session.packId), JSON.stringify(session));
  } catch {
    // A failed write costs a resume, never the session on screen.
  }
}

export async function clearSession(packId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(keyFor(packId));
  } catch {
    // Nothing to do; the stale check will discard it on the next load.
  }
}

/**
 * Every resumable session on the device, newest first. Backs the "pick up
 * where you left off" card on home — without it, resume only works if the user
 * happens to tap the same tile again.
 */
export async function listActiveSessions(): Promise<SessionMeta[]> {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
    if (keys.length === 0) return [];

    const pairs = await AsyncStorage.multiGet(keys);
    const out: SessionMeta[] = [];
    const doomed: string[] = [];

    for (const [key, raw] of pairs) {
      if (!raw) continue;
      const packId = key.slice(PREFIX.length);
      const session = validate(JSON.parse(raw), packId);
      if (!session) {
        doomed.push(key);
        continue;
      }
      out.push({
        packId: session.packId,
        index: session.index,
        total: session.questions.length,
        startedAt: session.startedAt,
      });
    }

    await Promise.all(doomed.map((k) => AsyncStorage.removeItem(k)));
    return out.sort((a, b) => b.startedAt - a.startedAt);
  } catch {
    return [];
  }
}