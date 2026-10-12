/**
 * Storefront catalogue data. The six free decks live in the database
 * (see src/lib/decks.ts); the premium packs below are stand-ins until the
 * store exists — hardcoded prices, no checkout — so the catalogue can show
 * the "coming" shelf exactly as designed.
 */

export type PremiumDeck = {
  id: string;
  title: string;
  tagline: string;
  questionCount: number;
  relationship: 'partner' | 'family' | 'friend';
  price: string;
  /** Gradient stops for the card art, from the storefront concept. */
  c1: string;
  c2: string;
  /** Icon key to resolve once moon/plane/flame land in the icon registry. */
  icon: string;
};

export const PREMIUM_DECKS: PremiumDeck[] = [
  {
    id: 'late-night',
    title: 'Late Night',
    tagline: 'For when the lights are off.',
    questionCount: 50,
    relationship: 'partner',
    price: '$2.99',
    c1: '#7C5CFF',
    c2: '#1B1240',
    icon: 'moon',
  },
  {
    id: 'long-distance',
    title: 'Long Distance',
    tagline: 'Miles apart, still close.',
    questionCount: 45,
    relationship: 'partner',
    price: '$2.49',
    c1: '#22C3D6',
    c2: '#0A4C58',
    icon: 'plane',
  },
  {
    id: 'spicy-debates',
    title: 'Spicy Debates',
    tagline: 'Hot takes, zero fights.',
    questionCount: 40,
    relationship: 'friend',
    price: '$1.99',
    c1: '#FF7A3D',
    c2: '#7A210A',
    icon: 'flame',
  },
];
