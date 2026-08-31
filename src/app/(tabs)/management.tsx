import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChevronRightIcon, FixedIcon, TargetIcon } from '@/components/icons';
import { LedgerFonts } from '@/constants/ledger-colors';
import type { ColorPalette } from '@/constants/theme-palettes';
import { useBudgets } from '@/store/budgets-context';
import { useCategories } from '@/store/categories-context';
import { useFixedExpenses } from '@/store/fixed-expenses-context';
import { useSettings } from '@/store/settings-context';
import { formatAmount } from '@/store/transactions-context';

function ToggleSwitch({ on, onToggle, colors }: { on: boolean; onToggle?: () => void; colors: ColorPalette }) {
  return (
    <Pressable onPress={onToggle} hitSlop={8}>
      <View style={[toggleStyles.track, { backgroundColor: on ? colors.ink : colors.line }]}>
        <View style={[toggleStyles.knob, { left: on ? 18 : 2 }]} />
      </View>
    </Pressable>
  );
}

const toggleStyles = StyleSheet.create({
  track: { width: 38, height: 22, borderRadius: 11 },
  knob: {
    position: 'absolute',
    top: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
});

export default function ManagementScreen() {
  const { t } = useTranslation();
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { categories, getCategoryMeta } = useCategories();
  const { overallBudget, categoryBudgets } = useBudgets();
  const { fixedExpenses, toggleFixedExpense } = useFixedExpenses();

  const categoryBudgetEntries = Object.keys(categoryBudgets);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{t('management.budgetSetting')}</Text>
            <Pressable onPress={() => router.push({ pathname: '/budget-edit', params: { target: 'new' } })}>
              <Text style={styles.addLink}>{t('management.addCategoryLink')}</Text>
            </Pressable>
          </View>
          <View style={styles.groupCard}>
            <Pressable
              style={[styles.row, categoryBudgetEntries.length === 0 && styles.rowLast]}
              onPress={() => router.push({ pathname: '/budget-edit', params: { target: 'overall' } })}>
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
                  onPress={() => router.push({ pathname: '/budget-edit', params: { target: 'category', key } })}>
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
            <Pressable onPress={() => router.push('/fixed-expense-edit')}>
              <Text style={styles.addLink}>{t('management.addLink')}</Text>
            </Pressable>
          </View>
          <View style={styles.groupCard}>
            {fixedExpenses.map((f, i) => (
              <Pressable
                key={f.id}
                style={[styles.row, i === fixedExpenses.length - 1 && styles.rowLast]}
                onPress={() => router.push({ pathname: '/fixed-expense-edit', params: { id: f.id } })}>
                <View style={[styles.iconSq, { backgroundColor: f.on ? colors.fixed : colors.dashed }]}>
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
            <Pressable onPress={() => router.push('/category-edit')}>
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
                  onPress={() => router.push({ pathname: '/category-edit', params: { id: c.key } })}>
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
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, gap: 22 },
    section: { gap: 8 },
    sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
    sectionTitle: {
      fontFamily: LedgerFonts.bodyBold,
      fontSize: 13,
      color: colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    addLink: { fontFamily: LedgerFonts.bodyBold, fontSize: 13, color: colors.income },
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
      paddingVertical: 13,
      paddingHorizontal: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.lineLighter,
    },
    rowLast: { borderBottomWidth: 0 },
    iconSq: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    rowMid: { flex: 1, gap: 2 },
    rowName: { fontFamily: LedgerFonts.bodySemiBold, fontSize: 14.5, color: colors.ink },
    rowSub: { fontFamily: LedgerFonts.body, fontSize: 12, color: colors.muted },
    rowAmtExpense: { fontFamily: LedgerFonts.headingBold, fontSize: 14, color: colors.expense },
    rowAmtNeutral: { fontFamily: LedgerFonts.headingBold, fontSize: 14, color: colors.ink },
  });
}
