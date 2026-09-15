import { StyleSheet } from 'react-native-unistyles';

const lightTheme = {
  colors: {
    paper: '#FBF3DF',
    ink: '#2B1A0F',
    surface: '#FFF9E8',
    border: '#EDE0BE',
    muted: '#8A7562',
    street: '#F5B400',
    shadow: 'rgba(43,26,15,0.12)',
    overlay: 'rgba(43,26,15,0.35)',
  },
  relationship: {
    partner: { accent: '#D85A30', accentSoft: '#F5C4B3', accentText: '#4A1B0C' },
    family: { accent: '#639922', accentSoft: '#C0DD97', accentText: '#173404' },
    friend: { accent: '#D4537E', accentSoft: '#F4C0D1', accentText: '#4B1528' },
  },
  spacing: {
    half: 2,
    one: 4,
    two: 8,
    three: 16,
    four: 24,
    five: 32,
    six: 64,
  },
  radii: {
    hero: 24,
    card: 20,
    pill: 999,
    chip: 12,
  },
  maxContentWidth: 800,
} as const;

const darkTheme = {
  colors: {
    paper: '#231408',
    ink: '#FBF3DF',
    surface: '#2E1E10',
    border: '#3D2A18',
    muted: '#C4A991',
    street: '#F5B400',
    shadow: 'rgba(0,0,0,0.45)',
    overlay: 'rgba(0,0,0,0.55)',
  },
  relationship: lightTheme.relationship,
  spacing: lightTheme.spacing,
  radii: lightTheme.radii,
  maxContentWidth: lightTheme.maxContentWidth,
} as const;

const appThemes = {
  light: lightTheme,
  dark: darkTheme,
};

const breakpoints = {
  xs: 0,
  sm: 768,
} as const;

type AppThemes = typeof appThemes;
type AppBreakpoints = typeof breakpoints;

declare module 'react-native-unistyles' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface UnistylesThemes extends AppThemes {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}

StyleSheet.configure({
  themes: appThemes,
  breakpoints,
  settings: {
    adaptiveThemes: true,
    CSSVars: true,
  },
});

export { appThemes };
