export type ThemeMode = 'system' | 'light' | 'dark' | 'purple' | 'blue';
export type ResolvedTheme = 'light' | 'dark' | 'purple' | 'blue';

export type ColorPalette = {
  bg: string;
  card: string;
  ink: string;
  ink2: string;
  muted: string;
  mutedLight: string;
  line: string;
  lineLight: string;
  lineLighter: string;
  dashed: string;
  accent: string;
};

export const THEME_PALETTES: Record<ResolvedTheme, ColorPalette> = {
  light: {
    bg: '#FAF9F7',
    card: '#FFFFFF',
    ink: '#15130F',
    ink2: '#6B675F',
    muted: '#9B9790',
    mutedLight: '#B4B0A7',
    line: '#E7E3DA',
    lineLight: '#EFECE5',
    lineLighter: '#F0EEE8',
    dashed: '#DAD5C9',
    accent: '#15130F',
  },
  dark: {
    bg: '#15130F',
    card: '#211F1A',
    ink: '#FAF9F7',
    ink2: '#C9C4BB',
    muted: '#8B877E',
    mutedLight: '#6B675F',
    line: '#3A362E',
    lineLight: '#2B281F',
    lineLighter: '#252219',
    dashed: '#4A4638',
    accent: '#FAF9F7',
  },
  purple: {
    bg: '#FAF8FC',
    card: '#FFFFFF',
    ink: '#241B33',
    ink2: '#6B5E7D',
    muted: '#9C8FB0',
    mutedLight: '#BBB0CC',
    line: '#E6DFEF',
    lineLight: '#F1ECF7',
    lineLighter: '#F5F1FA',
    dashed: '#D9CCE8',
    accent: '#7C3AED',
  },
  blue: {
    bg: '#F7FAFC',
    card: '#FFFFFF',
    ink: '#132433',
    ink2: '#5C6E7D',
    muted: '#8CA0B0',
    mutedLight: '#B6C6D2',
    line: '#DDE7EF',
    lineLight: '#ECF2F6',
    lineLighter: '#F1F6F9',
    dashed: '#CBD9E2',
    accent: '#1668B8',
  },
};
