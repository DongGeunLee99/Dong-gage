import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Animated, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { ChevronRightIcon, FixedIcon, TargetIcon } from '@/components/icons';
import { RefreshToast } from '@/components/refreshToast';
import { LedgerColors } from '@/constants/ledgerColors';
import type { ColorPalette, ThemeMode } from '@/constants/themePalettes';
import { useRefreshFeedback } from '@/hooks/useRefreshFeedback';
import { useSmsIngestToken } from '@/hooks/useSmsIngestToken';
import type { Language } from '@/i18n';
import { useAuth } from '@/store/authContext';
import { useBudgets } from '@/store/budgetsContext';
import { useCategories } from '@/store/categoriesContext';
import { useFixedExpenses } from '@/store/fixedExpensesContext';
import { useSettings } from '@/store/settingsContext';
import { formatAmount } from '@/store/transactionsContext';
import { createStyles, toggleStyles } from '@/styles/managementStyles';

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

function ToggleSwitch({ on, onToggle, colors }: { on: boolean; onToggle?: () => void; colors: ColorPalette }) {
  return (
    <Pressable onPress={onToggle} hitSlop={8}>
      <View style={[toggleStyles.track, { backgroundColor: on ? colors.ink : colors.line }]}>
        <View style={[toggleStyles.knob, { left: on ? 18 : 2 }]} />
      </View>
    </Pressable>
  );
}

export default function ManagementScreen() {
  const { t } = useTranslation();
  const { colors, themeMode, setThemeMode, language, setLanguage } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { categories, getCategoryMeta, refresh: refreshCategories } = useCategories();
  const { overallBudget, categoryBudgets } = useBudgets();
  const { fixedExpenses, toggleFixedExpense } = useFixedExpenses();
  const { session, signInWithKakao, signOut } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const { token: smsToken, issueToken } = useSmsIngestToken();
  const [isIssuing, setIsIssuing] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const { refreshing, justRefreshed, contentOpacity, run, onScrollBeginDrag, onScrollEndDrag } = useRefreshFeedback();

  const onRefresh = useCallback(() => run(refreshCategories), [run, refreshCategories]);

  const categoryBudgetEntries = Object.keys(categoryBudgets);
  const maskedToken = smsToken ? `${smsToken.slice(0, 8)}••••${smsToken.slice(-4)}` : '';

  const handleCopyToken = async () => {
    if (!smsToken) return;
    await Clipboard.setStringAsync(smsToken);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 1500);
  };

  const handleIssueToken = async () => {
    setIsIssuing(true);
    try {
      const issued = await issueToken();
      if (issued) {
        await Clipboard.setStringAsync(issued);
        Alert.alert(t('settings.smsTokenIssuedTitle'), t('settings.smsTokenIssuedBody'));
      }
    } finally {
      setIsIssuing(false);
    }
  };

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
      <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEndDrag}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} colors={[colors.ink]} />}>
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{t('management.budgetSetting')}</Text>
            <Pressable onPress={() => router.push({ pathname: '/budgetEdit', params: { target: 'new' } })}>
              <Text style={styles.addLink}>{t('management.addCategoryLink')}</Text>
            </Pressable>
          </View>
          <View style={styles.groupCard}>
            <Pressable
              style={[styles.row, categoryBudgetEntries.length === 0 && styles.rowLast]}
              onPress={() => router.push({ pathname: '/budgetEdit', params: { target: 'overall' } })}>
              <View style={[styles.iconSq, { backgroundColor: colors.ink }]}>
                <TargetIcon size={16} />
              </View>
              <View style={styles.rowMid}>
                <Text style={styles.rowName}>{t('management.monthlyGoal')}</Text>
                <Text style={styles.rowSub}>{t('management.budgetCaption')}</Text>
              </View>
              <Text style={styles.rowAmtNeutral}>{formatAmount(overallBudget)}</Text>
              <ChevronRightIcon size={14} color={colors.dashed} />
            </Pressable>
            {categoryBudgetEntries.map((key, i) => {
              const meta = getCategoryMeta(key);
              return (
                <Pressable
                  key={key}
                  style={[styles.row, i === categoryBudgetEntries.length - 1 && styles.rowLast]}
                  onPress={() => router.push({ pathname: '/budgetEdit', params: { target: 'category', key } })}>
                  <View style={[styles.iconSq, { backgroundColor: meta.color }]}>
                    <meta.Icon size={16} />
                  </View>
                  <Text style={[styles.rowName, styles.rowMid]}>{meta.name}</Text>
                  <Text style={styles.rowAmtNeutral}>{formatAmount(categoryBudgets[key])}</Text>
                  <ChevronRightIcon size={14} color={colors.dashed} />
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{t('management.fixedExpense')}</Text>
            <Pressable onPress={() => router.push('/fixedExpenseEdit')}>
              <Text style={styles.addLink}>{t('management.addLink')}</Text>
            </Pressable>
          </View>
          <View style={styles.groupCard}>
            {fixedExpenses.map((f, i) => (
              <Pressable
                key={f.id}
                style={[styles.row, i === fixedExpenses.length - 1 && styles.rowLast]}
                onPress={() => router.push({ pathname: '/fixedExpenseEdit', params: { id: f.id } })}>
                <View style={[styles.iconSq, { backgroundColor: f.on ? LedgerColors.fixed : colors.dashed }]}>
                  <FixedIcon size={16} />
                </View>
                <View style={styles.rowMid}>
                  <Text style={styles.rowName}>{f.name}</Text>
                  <Text style={styles.rowSub}>
                    {t('management.monthlyDayLabel', { day: f.dayOfMonth })}
                    {!f.on ? ` ${t('management.paused')}` : ''}
                  </Text>
                </View>
                <Text style={[styles.rowAmtExpense, !f.on && { color: colors.mutedLight }]}>
                  -{formatAmount(f.amount)}
                </Text>
                <ToggleSwitch on={f.on} onToggle={() => toggleFixedExpense(f.id)} colors={colors} />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{t('management.category')}</Text>
            <Pressable onPress={() => router.push('/categoryEdit')}>
              <Text style={styles.addLink}>{t('management.addLink')}</Text>
            </Pressable>
          </View>
          <View style={styles.groupCard}>
            {categories.map((c, i) => {
              const meta = getCategoryMeta(c.key);
              return (
                <Pressable
                  key={c.key}
                  style={[styles.row, i === categories.length - 1 && styles.rowLast]}
                  onPress={() => router.push({ pathname: '/categoryEdit', params: { id: c.key } })}>
                  <View style={[styles.iconSq, { backgroundColor: meta.color }]}>
                    <meta.Icon size={16} />
                  </View>
                  <View style={styles.rowMid}>
                    <Text style={styles.rowName}>{meta.name}</Text>
                    {c.subcategories.length > 0 && <Text style={styles.rowSub}>{c.subcategories.join(', ')}</Text>}
                  </View>
                  <ChevronRightIcon size={14} color={colors.dashed} />
                </Pressable>
              );
            })}
          </View>
        </View>

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

        {session && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.smsIngest')}</Text>
            <View style={styles.groupCard}>
              <View style={[styles.row, styles.rowLast, styles.smsRow]}>
                <Text style={[styles.rowName, styles.mutedText, styles.smsHint]}>{t('settings.smsIngestHint')}</Text>
                {smsToken && <Text style={styles.smsToken}>{maskedToken}</Text>}
                <View style={styles.smsActions}>
                  {smsToken && (
                    <Pressable style={styles.smsCopyBtn} onPress={handleCopyToken}>
                      <Text style={styles.smsCopyBtnText}>
                        {tokenCopied ? t('aiSettlement.copied') : t('settings.smsCopyToken')}
                      </Text>
                    </Pressable>
                  )}
                  <Pressable style={styles.smsIssueBtn} onPress={handleIssueToken} disabled={isIssuing}>
                    <Text style={styles.smsIssueBtnText}>
                      {smsToken ? t('settings.smsReissueToken') : t('settings.smsIssueToken')}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
      </Animated.View>
      <RefreshToast visible={justRefreshed} label={t('common.refreshed')} />
    </View>
  );
}
