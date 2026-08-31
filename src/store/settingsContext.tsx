import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { THEME_PALETTES, type ColorPalette, type ResolvedTheme, type ThemeMode } from '@/constants/themePalettes';
import i18n, { type Language } from '@/i18n';

const STORAGE_KEY = 'ledger_settings';

type StoredSettings = { themeMode: ThemeMode; language: Language };

type SettingsContextValue = {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  colors: ColorPalette;
  setThemeMode: (mode: ThemeMode) => void;
  language: Language;
  setLanguage: (language: Language) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [language, setLanguageState] = useState<Language>('ko');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const stored: StoredSettings = JSON.parse(raw);
        if (stored.themeMode) setThemeModeState(stored.themeMode);
        if (stored.language) {
          setLanguageState(stored.language);
          i18n.changeLanguage(stored.language);
        }
      } catch {
        // ignore malformed storage
      }
    });
  }, []);

  const persist = (next: Partial<StoredSettings>) => {
    const value: StoredSettings = { themeMode, language, ...next };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    persist({ themeMode: mode });
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    persist({ language: lang });
  };

  const resolvedTheme: ResolvedTheme = themeMode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themeMode;
  const colors = THEME_PALETTES[resolvedTheme];

  const value = useMemo(
    () => ({ themeMode, resolvedTheme, colors, setThemeMode, language, setLanguage }),
    [themeMode, resolvedTheme, colors, language],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
}
