import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ChevronRightIcon, FixedIcon, TargetIcon } from '@/components/icons';
import type { ColorPalette } from '@/constants/themePalettes';
import { useBudgets } from '@/store/budgetsContext';
import { useCategories } from '@/store/categoriesContext';
import { useFixedExpenses } from '@/store/fixedExpensesContext';
import { useSettings } from '@/store/settingsContext';
import { formatAmount } from '@/store/transactionsContext';
import { createStyles, toggleStyles } from '@/styles/managementStyles';

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
      </ScrollView>
    </View>
  );
}
