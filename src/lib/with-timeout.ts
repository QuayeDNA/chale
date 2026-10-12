/**
 * Bounds a promise that might never settle.
 *
 * A failed Supabase read rejects and react-query's `retry: 1` handles it, but
 * a *stalled* connection neither resolves nor rejects — the fetch just hangs,
 * `isPending` stays true forever, and the skeletons spin with no way out. That
 * is the state this exists to kill: slow networks become errors, and errors
 * already have retry cards.
 *
 * The loser of the race is left to resolve into the void. These are idempotent
 * reads, so a late response changes nothing.
 */
export class TimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(label: string, timeoutMs: number) {
    super(`${label} timed out after ${timeoutMs / 1000}s`);
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(label, ms)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** Generous enough for a cold start on a bad connection, short enough that a
 *  dead one stops pretending to load. */
export const READ_TIMEOUT_MS = 15_000;