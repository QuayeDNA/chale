import { Platform } from 'react-native';

export const Colors = {
  light: {
    paper: '#FBF3DF',
    ink: '#2B1A0F',
    surface: '#FFF9E8',
    border: '#EDE0BE',
    muted: '#8A7562',
    street: '#F5B400',
    shadow: 'rgba(43,26,15,0.12)',
    overlay: 'rgba(43,26,15,0.35)',
    // legacy aliases for gradual migration
    text: '#2B1A0F',
    background: '#FBF3DF',
    backgroundElement: '#FFF9E8',
    backgroundSelected: '#EDE0BE',
    textSecondary: '#8A7562',
  },
  dark: {
    paper: '#231408',
    ink: '#FBF3DF',
    surface: '#2E1E10',
    border: '#3D2A18',
    muted: '#C4A991',
    street: '#F5B400',
    shadow: 'rgba(0,0,0,0.45)',
    overlay: 'rgba(0,0,0,0.55)',
    text: '#FBF3DF',
    background: '#231408',
    backgroundElement: '#2E1E10',
    backgroundSelected: '#3D2A18',
    textSecondary: '#C4A991',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radii = {
  hero: 24,
  card: 20,
  pill: 999,
  chip: 12,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export type RelationshipType = 'partner' | 'family' | 'friend';

export const RelationshipThemes: Record<
  RelationshipType,
  { accent: string; accentSoft: string; accentText: string }
> = {
  partner: { accent: '#D85A30', accentSoft: '#F5C4B3', accentText: '#4A1B0C' },
  family: { accent: '#639922', accentSoft: '#C0DD97', accentText: '#173404' },
  friend: { accent: '#D4537E', accentSoft: '#F4C0D1', accentText: '#4B1528' },
};
