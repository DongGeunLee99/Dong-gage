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
  income: string;
  expense: string;
  food: string;
  transport: string;
  shopping: string;
  fixed: string;
  etc: string;
  selectedDay: string;
};

const sharedSemantic = {
  income: '#2A78D6',
  expense: '#E34948',
  food: '#EB6834',
  transport: '#1BAF7A',
  shopping: '#E87BA4',
  fixed: '#4A3AA7',
  etc: '#EDA100',
  selectedDay: '#5AC0EF',
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
    ...sharedSemantic,
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
    ...sharedSemantic,
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
    ...sharedSemantic,
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
    ...sharedSemantic,
  },
};
