import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { LedgerFonts } from '@/constants/ledger-colors';
import type { ColorPalette, ThemeMode } from '@/constants/theme-palettes';
import type { Language } from '@/i18n';
import { useAuth } from '@/store/auth-context';
import { useSettings } from '@/store/settings-context';

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
];

const THEME_OPTIONS: { value: ThemeMode; swatch: string | null }[] = [
  { value: 'system', swatch: null },
  { value: 'light', swatch: '#15130F' },
  { value: 'dark', swatch: '#232321' },
  { value: 'purple', swatch: '#7C3AED' },
  { value: 'blue', swatch: '#1668B8' },
];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { colors, themeMode, setThemeMode, language, setLanguage } = useSettings();
  const { session, signInWithKakao, signOut } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleLogin = async () => {
    setIsSigningIn(true);
    try {
      await signInWithKakao();
    } catch (err) {
      Alert.alert(t('settings.loginFailed'), err instanceof Error ? err.message : String(err));
    } finally {
      setIsSigningIn(false);
    }
  };

  const displayName =
    session?.user.user_metadata?.name ??
    session?.user.user_metadata?.full_name ??
    session?.user.user_metadata?.preferred_username ??
    session?.user.email ??
    t('settings.kakaoUser');

  const themeLabels: Record<ThemeMode, string> = {
    system: t('settings.themeSystem'),
    light: t('settings.themeLight'),
    dark: t('settings.themeDark'),
    purple: t('settings.themePurple'),
    blue: t('settings.themeBlue'),
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
          <View style={styles.groupCard}>
            {LANGUAGE_OPTIONS.map((opt, i) => (
              <Pressable
                key={opt.value}
                style={[styles.row, i === LANGUAGE_OPTIONS.length - 1 && styles.rowLast]}
                onPress={() => setLanguage(opt.value)}>
                <Text style={styles.rowName}>{opt.label}</Text>
                {language === opt.value && <View style={styles.selectedDot} />}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.theme')}</Text>
          <View style={styles.groupCard}>
            {THEME_OPTIONS.map((opt, i) => (
              <Pressable
                key={opt.value}
                style={[styles.row, i === THEME_OPTIONS.length - 1 && styles.rowLast]}
                onPress={() => setThemeMode(opt.value)}>
                {opt.swatch && <View style={[styles.swatch, { backgroundColor: opt.swatch }]} />}
                <Text style={[styles.rowName, styles.rowNameFlex]}>{themeLabels[opt.value]}</Text>
                {themeMode === opt.value && <View style={styles.selectedDot} />}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
          <View style={styles.groupCard}>
            {session ? (
              <View style={[styles.row, styles.rowLast]}>
                <Text style={[styles.rowName, styles.rowNameFlex]}>{displayName}</Text>
                <Pressable style={styles.logoutBtn} onPress={signOut}>
                  <Text style={styles.logoutBtnText}>{t('settings.logout')}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={[styles.row, styles.rowLast]}>
                <Text style={[styles.rowName, styles.rowNameFlex, styles.mutedText]}>{t('settings.notLoggedIn')}</Text>
                <Pressable style={styles.loginBtn} onPress={handleLogin} disabled={isSigningIn}>
                  <Text style={styles.loginBtnText}>
                    {isSigningIn ? t('settings.loggingIn') : t('settings.loginWithKakao')}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, gap: 22 },
    section: { gap: 8 },
    sectionTitle: {
      fontFamily: LedgerFonts.bodyBold,
      fontSize: 13,
      color: colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      paddingHorizontal: 2,
    },
    groupCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      shadowColor: '#15130F',
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.lineLighter,
    },
    rowLast: { borderBottomWidth: 0 },
    rowName: { fontFamily: LedgerFonts.bodySemiBold, fontSize: 14.5, color: colors.ink },
    rowNameFlex: { flex: 1 },
    mutedText: { color: colors.muted },
    selectedDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
    swatch: { width: 20, height: 20, borderRadius: 10 },
    loginBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.accent },
    loginBtnText: { fontFamily: LedgerFonts.bodyBold, fontSize: 13, color: '#fff' },
    logoutBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.line,
    },
    logoutBtnText: { fontFamily: LedgerFonts.bodyBold, fontSize: 13, color: colors.expense },
  });
}
