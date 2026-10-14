import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Device-local seed + cursor for a deck, the on-device replacement for a
 * seen-ledger.
 *
 * The seed deterministically shuffles a deck's questions; the cursor counts
 * how many sessions of that shuffle this phone has finished. Session k is
 * `shuffle[cursor*L .. +L]` — so no question repeats inside a cycle, "N fresh
 * left" is arithmetic, and there is no id list to grow or backfill.
 *
 * The seed is per device, not per pack: a shared seed would put every phone
 * on earth in lockstep, playing identical sessions. In-person is one shared
 * phone with no second device to sync, and guests have no account — same
 * reasoning as `chale.session.v1.*`.
 */
const PREFIX = 'chale.shuffle.v1.';

export type ShuffleSlot = {
  seed: number;
  cursor: number;
  /** Set by the "Back home" ending (not "Draw the next 20") — powers Home's recommendation. */
  completedAt?: number;
};

export type SeedForSession = {
  seed: number;
  cursor: number;
  /** True when this session begins a brand-new shuffle of a fully-played deck. */
  reshuffled: boolean;
};

const keyFor = (packId: string) => `${PREFIX}${packId}`;

/** A fresh 31-bit seed — plenty of shuffle, and JSON-storable. */
const newSeed = () => Math.floor(Math.random() * 2 ** 31);

/**
 * mulberry32: small, fast, deterministic. The same seed and the same input
 * order always produce the same shuffle, which is the whole guarantee.
 */
function mulberry32(a: number) {
  let t = a;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Seeded Fisher-Yates over a copy. Pure: same inputs, same output, no storage.
 */
export function shuffleFor<T>(seed: number, items: readonly T[]): T[] {
  const out = items.slice();
  const rand = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** The slice of the shuffle this session plays. Short at a cycle's tail. */
export function sessionSlice<T>(
  shuffled: readonly T[],
  cursor: number,
  length: number,
): T[] {
  const start = Math.max(0, cursor * length);
  return shuffled.slice(start, start + Math.max(1, length));
}

/**
 * A cycle runs out once the cursor reaches past the pool. The next session
 * re-seeds (a brand-new shuffle of the same deck) and starts at the top.
 */
export function isExhausted(poolSize: number, cursor: number, length: number): boolean {
  return cursor * length >= poolSize;
}

/** How many unseen questions the deck still holds for this phone. */
export function freshLeft(poolSize: number, cursor: number, length: number): number {
  return Math.max(0, poolSize - cursor * length);
}

/**
 * True when the slice came up short because the pool ran dry mid-cycle
 * (a 65-question deck's 5-card last session) — not because the deck is simply
 * smaller than a full session.
 */
export function isTailSession(poolSize: number, sliceLength: number, length: number): boolean {
  return sliceLength < length && poolSize > length;
}

function validate(raw: unknown): ShuffleSlot | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const s = raw as Partial<ShuffleSlot>;
  if (typeof s.seed !== 'number' || !Number.isFinite(s.seed)) return null;
  if (typeof s.cursor !== 'number' || !Number.isInteger(s.cursor) || s.cursor < 0) return null;
  return {
    seed: s.seed,
    cursor: s.cursor,
    ...(typeof s.completedAt === 'number' ? { completedAt: s.completedAt } : {}),
  };
}

export async function loadSlot(packId: string): Promise<ShuffleSlot | null> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(packId));
    if (!raw) return null;
    const parsed = validate(JSON.parse(raw));
    if (!parsed) await AsyncStorage.removeItem(keyFor(packId));
    return parsed;
  } catch {
    return null;
  }
}

async function writeSlot(packId: string, slot: ShuffleSlot): Promise<ShuffleSlot> {
  try {
    await AsyncStorage.setItem(keyFor(packId), JSON.stringify(slot));
  } catch {
    // A failed write costs the guarantee on the next launch, never this session.
  }
  return slot;
}

/**
 * The seed to play with now: first play invents one; a cycle that just ran
 * out re-seeds and restarts, flagged so the session can say so.
 */
export async function prepareSeed(
  packId: string,
  poolSize: number,
  length: number,
): Promise<SeedForSession> {
  const slot = await loadSlot(packId);
  if (!slot) {
    return { seed: newSeed(), cursor: 0, reshuffled: false };
  }
  if (isExhausted(poolSize, slot.cursor, length)) {
    const fresh = await writeSlot(packId, { seed: newSeed(), cursor: 0 });
    return { seed: fresh.seed, cursor: 0, reshuffled: true };
  }
  return { seed: slot.seed, cursor: slot.cursor, reshuffled: false };
}

/** Consumes this session's slice of the shuffle. Both endings call it. */
export async function advanceCursor(packId: string, length: number): Promise<ShuffleSlot> {
  const slot = await loadSlot(packId);
  if (!slot) return writeSlot(packId, { seed: newSeed(), cursor: 1 });
  return writeSlot(packId, { ...slot, cursor: slot.cursor + 1 });
}

/** Marks the pack as completed by the "Back home" ending — the Home card's signal. */
export async function markCompleted(packId: string): Promise<void> {
  const slot = await loadSlot(packId);
  if (!slot) return;
  await writeSlot(packId, { ...slot, completedAt: Date.now() });
}

export type CompletedPack = {
  packId: string;
  completedAt: number;
};

/**
 * The most recently completed pack on this device, for the Home
 * recommendation card. Null until a user finishes a deck via "Back home".
 */
export async function mostRecentCompletion(): Promise<CompletedPack | null> {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
    if (keys.length === 0) return null;
    const pairs = await AsyncStorage.multiGet(keys);

    let best: CompletedPack | null = null;
    for (const [key, raw] of pairs) {
      if (!raw) continue;
      const slot = validate(JSON.parse(raw));
      if (!slot?.completedAt) continue;
      if (!best || slot.completedAt > best.completedAt) {
        best = { packId: key.slice(PREFIX.length), completedAt: slot.completedAt };
      }
    }
    return best;
  } catch {
    return null;
  }
}
