import { iconName as resolveIconName } from '@/components/ui/icon';
import type { Tables } from '@/lib/database.types';

/**
 * The database stores KEYS; this file owns the RENDERING.
 *
 * A deck's identity (slug, tone, icon, art_key) lives in question_packs so a
 * new themed deck is one content/decks/*.json file and one migration-free seed.
 * Everything visual is resolved here, keyed by slug, which is what lets each
 * deck grow its own card treatment — including animated ones — without touching
 * the database or any screen.
 *
 * To give a deck bespoke art: add an entry below pointing at its own component.
 * Art keys are grouped on purpose so the animated variants (see artKey below)
 * can be swapped in one place when the 3D/shuffle work lands.
 */

export type DeckRow = Tables<'question_packs'>;
export type DeckRelationship = 'partner' | 'family' | 'friend';

/** Deck count from list_packs_with_counts(). */
export type DeckWithCount = {
  id: string;
  slug: string | null;
  title: string;
  tagline: string | null;
  icon: string;
  tone: string;
  art_key: string;
  session_length: number;
  sort_order: number;
  question_count: number;
};

/** Board §07 fills — fixed brand colors in both themes. Paper text; ink on street. */
export const DECK_FILLS: Record<string, string> = {
  love: '#D85A30',
  deep: '#2B4BD8',
  silly: '#F5B400',
  dreams: '#1E7A3C',
  family: '#639922',
  friends: '#D4537E',
};

/** Ink that stays legible on the matching fill. */
export const DECK_INKS: Record<string, string> = {
  love: '#FFF9E8',
  deep: '#FFF9E8',
  silly: '#2B1A0F',
  dreams: '#FFF9E8',
  family: '#FFF9E8',
  friends: '#FFF9E8',
};

/**
 * Storefront gradient stops per tone — a lighter lead-in fading to a deep
 * shade, drawn as a radial from the top-left. Keys match DECK_FILLS so a
 * tone drives both the flat tiles (home) and the gradient cards (storefront).
 */
export const DECK_GRADIENTS: Record<string, readonly [string, string]> = {
  love: ['#F2704A', '#8F2A12'],
  deep: ['#4A6BFF', '#15207A'],
  silly: ['#FFC81A', '#B5620A'],
  dreams: ['#2FB566', '#0C4A2A'],
  family: ['#8CC63F', '#34561A'],
  friends: ['#FF6FA1', '#8A1F4D'],
};

/** Gradient for a tone, falling back to a flat pair off the tone's fill. */
export function gradientFor(tone: string | null | undefined): readonly [string, string] {
  const stops = tone ? DECK_GRADIENTS[tone] : undefined;
  if (stops) return stops;
  const flat = (tone ? DECK_FILLS[tone] : undefined) ?? '#2B4BD8';
  return [flat, flat];
}

export type DeckArtKey = 'default' | 'stacked' | 'deck-edge' | 'scattered';

/**
 * The tone values the DB is allowed to carry, narrowed to the union the UI
 * components accept. Deck copy lives in the database, so the app must never
 * cast a raw string into a tone — a typo in a deck file becomes a wrong colour
 * at runtime, not a type error.
 */
const TONE_NAMES = ['love', 'deep', 'silly', 'dreams', 'family', 'friends'] as const;
export type DeckToneName = (typeof TONE_NAMES)[number];

export function toneName(tone: string | null | undefined): DeckToneName {
  return TONE_NAMES.includes(tone as DeckToneName) ? (tone as DeckToneName) : 'deep';
}

/**
 * Icons are also authored as keys in the deck files, so they get the same
 * narrowing. Falls back rather than crashing on a typo'd icon name.
 */
export { resolveIconName as iconName };

export type DeckArt = {
  /** How the card's artwork layer is composed. Reserved for the animated decks. */
  artKey: DeckArtKey;
  /** Number of stacked card edges drawn behind the face. Static for now. */
  stackDepth: number;
  /** Slight rotation per stack layer, degrees. Gives a hand-dealt feel. */
  fanDegrees: number;
  /** Fill overrides the tone fill — used where a deck wants its own colour. */
  fill?: string;
  ink?: string;
  /** True when the deck should animate its tile on the home screen. */
  animated: boolean;
};

const DEFAULT_ART: DeckArt = { artKey: 'default', stackDepth: 0, fanDegrees: 0, animated: false };

/**
 * Keyed by slug so bespoke art is opt-in per deck. The three themes each get a
 * distinct treatment; the fallback keeps a new deck shippable with zero code.
 */
const ART_BY_SLUG: Record<string, DeckArt> = {
  'love-and-relationships': { artKey: 'stacked', stackDepth: 3, fanDegrees: 2.5, animated: true },
  'deep-talks': { artKey: 'deck-edge', stackDepth: 5, fanDegrees: 0, animated: false },
  'fun-and-silly': { artKey: 'scattered', stackDepth: 2, fanDegrees: 7, animated: false },
  'life-and-dreams': { artKey: 'stacked', stackDepth: 3, fanDegrees: 1.5, animated: false },
  family: { artKey: 'deck-edge', stackDepth: 4, fanDegrees: 0, animated: false },
  friends: { artKey: 'scattered', stackDepth: 2, fanDegrees: 5, animated: false },
};

const ART_BY_KEY: Record<string, DeckArt> = {
  default: DEFAULT_ART,
  stacked: { artKey: 'stacked', stackDepth: 3, fanDegrees: 2.5, animated: false },
  'deck-edge': { artKey: 'deck-edge', stackDepth: 5, fanDegrees: 0, animated: false },
  scattered: { artKey: 'scattered', stackDepth: 2, fanDegrees: 7, animated: false },
};

export function artFor(deck: { slug: string | null; tone: string; art_key: string }): DeckArt {
  const bySlug = deck.slug ? ART_BY_SLUG[deck.slug] : undefined;
  const base = bySlug ?? ART_BY_KEY[deck.art_key] ?? DEFAULT_ART;
  const fill = DECK_FILLS[deck.tone];
  return {
    ...base,
    fill: fill ?? base.fill,
    ink: DECK_INKS[deck.tone] ?? base.ink,
  };
}

/** Board §07 tile copy — just the pool size. */
export function deckTotalCopy(deck: Pick<DeckWithCount, 'question_count'>): string {
  const total = deck.question_count;
  if (total <= 0) return 'Coming soon';
  return `${total} questions`;
}

/**
 * Detail-screen copy, where there is room to explain the model: a session is a
 * bounded random draw from the pool, so the two numbers are worth stating.
 */
export function deckCountCopy(deck: DeckWithCount): string {
  const total = deck.question_count;
  const session = deck.session_length;
  if (total <= 0) return 'Coming soon';
  if (total <= session) return `${total} questions`;
  return `${session} a session · ${total} in total`;
}
