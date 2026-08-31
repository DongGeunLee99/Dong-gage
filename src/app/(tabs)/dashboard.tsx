import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Circle, G, Svg } from 'react-native-svg';

import { ChevronLeftIcon, ChevronRightIcon, TrendUpIcon } from '@/components/icons';
import { LedgerFonts } from '@/constants/ledger-colors';
import type { ColorPalette } from '@/constants/theme-palettes';
import { formatYearMonth } from '@/i18n/format';
import { useBudgets } from '@/store/budgets-context';
import { useCategories } from '@/store/categories-context';
import { useMonth } from '@/store/month-context';
import { useSettings } from '@/store/settings-context';
import {
  categoryBreakdown,
  formatAmount,
  lastSixMonthsTrend,
  monthSummary,
  trackedExpenseTotal,
  useTransactions,
} from '@/store/transactions-context';

const DONUT_R = 70;
const CIRCUMFERENCE = 2 * Math.PI * DONUT_R;

// Adjust this to nudge the header up/down while tuning the top spacing.
const TOP_OFFSET = 0;

export default function DashboardScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { transactions } = useTransactions();
  const { categoryKeys, getCategoryMeta } = useCategories();
  const { year, month, goMonth, goToToday, isOnToday } = useMonth();
  const { overallBudget, categoryBudgets } = useBudgets();

  const language = i18n.language as 'ko' | 'en' | 'ja';

  const summary = useMemo(() => monthSummary(transactions, year, month), [transactions, year, month]);
  const breakdown = useMemo(
    () => categoryBreakdown(transactions, year, month, categoryKeys),
    [transactions, year, month, categoryKeys],
  );
  const trend = useMemo(() => lastSixMonthsTrend(transactions, year, month), [transactions, year, month]);

  const budgetTrackedTotal = useMemo(
    () => trackedExpenseTotal(transactions, year, month),
    [transactions, year, month],
  );
  const budgetPct = Math.min(100, Math.round((budgetTrackedTotal / overallBudget) * 100));
  const budgetRemain = overallBudget - budgetTrackedTotal;
  const won = t('common.won');

  let offset = 0;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { marginTop: TOP_OFFSET }]}>
        <View style={styles.monthNav}>
          <Pressable hitSlop={8} onPress={() => goMonth(-1)}>
            <ChevronLeftIcon color={colors.ink2} />
          </Pressable>
          <Text style={styles.monthLabel}>{formatYearMonth(year, month, language)}</Text>
          <Pressable hitSlop={8} onPress={() => goMonth(1)}>
            <ChevronRightIcon color={colors.ink2} />
          </Pressable>
          <Pressable style={[styles.todayBtn, isOnToday && styles.todayBtnDim]} onPress={goToToday} hitSlop={4}>
            <Text style={[styles.todayBtnText, isOnToday && styles.todayBtnTextDim]}>{t('common.today')}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.summaryTop}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{t('dashboard.totalIncome')}</Text>
              <Text style={[styles.summaryValue, { color: colors.income }]}>{formatAmount(summary.income)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{t('dashboard.totalExpense')}</Text>
              <Text style={[styles.summaryValue, { color: colors.expense }]}>{formatAmount(summary.expense)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{t('dashboard.netBalance')}</Text>
              <Text style={styles.summaryValue}>{formatAmount(summary.balance)}</Text>
            </View>
          </View>
          {/* <View style={styles.deltaRow}>
            <TrendUpIcon size={14} color="#006300" />
            <Text style={styles.deltaText}>{t('dashboard.categoriesActive', { count: breakdown.length })}</Text>
          </View> */}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {t('dashboard.budgetTitle')} <Text style={styles.budgetCaption}>{t('dashboard.budgetCaption')}</Text>
          </Text>
          <View style={{ marginTop: 12 }}>
            <View style={styles.budgetOverallRow}>
              <Text style={styles.budgetUsed}>{formatAmount(budgetTrackedTotal)}</Text>
              <Text style={styles.budgetSlash}>/</Text>
              <Text style={styles.budgetGoal}>
                {formatAmount(overallBudget)}
                {won}
              </Text>
            </View>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFg,
                  { width: `${budgetPct}%`, backgroundColor: budgetPct >= 100 ? colors.expense : colors.ink },
                ]}
              />
            </View>
            <Text style={styles.budgetRemain}>
              {t('dashboard.budgetRemainPrefix')}{' '}
              <Text style={styles.budgetRemainBold}>
                {formatAmount(Math.max(0, budgetRemain))}
                {won}
              </Text>{' '}
              · {budgetPct}
              {t('dashboard.budgetUsedSuffix')}
            </Text>
          </View>

          <View style={styles.budgetCatList}>
            {Object.entries(categoryBudgets).map(([key, budget]) => {
              const cat = breakdown.find((c) => c.key === key);
              const used = cat?.total ?? 0;
              const pct = Math.min(100, Math.round((used / budget) * 100));
              const remain = budget - used;
              const meta = getCategoryMeta(key);
              return (
                <View key={key}>
                  <View style={styles.budgetCatHead}>
                    <View style={[styles.rankDot, { backgroundColor: meta.color }]} />
                    <Text style={styles.budgetCatName}>{meta.name}</Text>
                    <Text style={styles.budgetCatNums}>
                      {formatAmount(used)} / {formatAmount(budget)}
                    </Text>
                  </View>
                  <View style={[styles.progressBg, styles.progressBgSmall]}>
                    <View
                      style={[styles.progressFg, { width: `${pct}%`, backgroundColor: pct >= 90 ? colors.expense : meta.color }]}
                    />
                  </View>
                  <Text style={[styles.budgetCatRemain, pct >= 90 && styles.budgetCatRemainWarn]}>
                    {remain >= 0
                      ? `${t('dashboard.budgetRemainPrefix')} ${formatAmount(remain)}${won} · ${pct}${t('dashboard.budgetUsedSuffix')}`
                      : `${formatAmount(-remain)}${won} ${t('dashboard.budgetOverBy')}`}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('dashboard.categorySpending')}</Text>
          {breakdown.length === 0 ? (
            <Text style={styles.emptyText}>{t('dashboard.noExpensesMonth')}</Text>
          ) : (
            <>
              <View style={styles.donutWrap}>
                <Svg width={180} height={180} viewBox="0 0 200 200">
                  <Circle cx="100" cy="100" r={DONUT_R} fill="none" stroke={colors.lineLighter} strokeWidth={26} />
                  <G transform="rotate(-90, 100, 100)">
                    {breakdown.map((slice) => {
                      const meta = getCategoryMeta(slice.key);
                      const len = (slice.pct / 100) * CIRCUMFERENCE;
                      const el = (
                        <Circle
                          key={slice.key}
                          cx="100"
                          cy="100"
                          r={DONUT_R}
                          fill="none"
                          stroke={meta.color}
                          strokeWidth={26}
                          strokeDasharray={`${len} ${CIRCUMFERENCE - len}`}
                          strokeDashoffset={-offset}
                        />
                      );
                      offset += len;
                      return el;
                    })}
                  </G>
                </Svg>
                <View style={styles.donutCenter} pointerEvents="none">
                  <Text style={styles.donutTotal}>{formatAmount(summary.expense)}</Text>
                  <Text style={styles.donutSub}>{t('dashboard.thisMonthExpense')}</Text>
                </View>
              </View>

              {breakdown.map((slice) => {
                const meta = getCategoryMeta(slice.key);
                return (
                  <View key={slice.key} style={styles.rankRow}>
                    <View style={[styles.rankDot, { backgroundColor: meta.color }]} />
                    <Text style={styles.rankName}>{meta.name}</Text>
                    <View style={styles.rankBarBg}>
                      <View style={[styles.rankBarFg, { width: `${slice.pct}%`, backgroundColor: meta.color }]} />
                    </View>
                    <Text style={styles.rankAmt}>
                      {formatAmount(slice.total)} · {slice.pct}%
                    </Text>
                  </View>
                );
              })}
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>{t('dashboard.sixMonthTrend')}</Text>
          <View style={styles.trendLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.income }]} />
              <Text style={styles.legendText}>{t('common.income')}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.expense }]} />
              <Text style={styles.legendText}>{t('common.expense')}</Text>
            </View>
          </View>
          <View style={styles.trendChart}>
            {trend.map((m) => (
              <View key={m.label} style={styles.trendCol}>
                <View style={styles.trendBars}>
                  <View style={[styles.bar, { height: Math.max(2, m.incomeHeight), backgroundColor: colors.income }]} />
                  <View style={[styles.bar, { height: Math.max(2, m.expenseHeight), backgroundColor: colors.expense }]} />
                </View>
                <Text style={styles.trendMonth}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 12,
    },
    monthNav: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    monthLabel: { fontFamily: LedgerFonts.headingBold, fontSize: 18, color: colors.ink },
    todayBtn: {
      marginLeft: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: colors.lineLight,
    },
    todayBtnDim: { backgroundColor: 'transparent' },
    todayBtnText: { fontFamily: LedgerFonts.bodyBold, fontSize: 12, color: colors.ink },
    todayBtnTextDim: { color: colors.mutedLight },
    content: { paddingHorizontal: 20, paddingBottom: 32, gap: 14 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 18,
      shadowColor: '#15130F',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    summaryTop: { flexDirection: 'row', justifyContent: 'space-between' },
    summaryItem: { gap: 4 },
    summaryLabel: { fontFamily: LedgerFonts.bodySemiBold, fontSize: 11.5, color: colors.muted },
    summaryValue: { fontFamily: LedgerFonts.headingBold, fontSize: 16, color: colors.ink },
    deltaRow: {
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.lineLight,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    deltaText: { fontFamily: LedgerFonts.body, fontSize: 12.5, color: colors.ink2 },
    emptyText: { fontFamily: LedgerFonts.body, fontSize: 13, color: colors.muted, paddingTop: 8 },
    sectionTitle: { fontFamily: LedgerFonts.bodyBold, fontSize: 14, color: colors.ink },
    budgetCaption: { fontFamily: LedgerFonts.bodySemiBold, color: colors.muted, fontSize: 12 },
    budgetOverallRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    budgetUsed: { fontFamily: LedgerFonts.headingBold, fontSize: 20, color: colors.ink },
    budgetSlash: { fontFamily: LedgerFonts.body, fontSize: 14, color: colors.muted },
    budgetGoal: { fontFamily: LedgerFonts.bodySemiBold, fontSize: 14, color: colors.muted },
    progressBg: { height: 8, borderRadius: 4, backgroundColor: colors.lineLighter, overflow: 'hidden', marginTop: 9, marginBottom: 7 },
    progressBgSmall: { height: 6, marginTop: 0 },
    progressFg: { height: '100%', borderRadius: 4 },
    budgetRemain: { fontFamily: LedgerFonts.body, fontSize: 12, color: colors.ink2 },
    budgetRemainBold: { fontFamily: LedgerFonts.bodyBold, color: colors.ink },
    budgetCatList: { gap: 14, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.lineLight },
    budgetCatHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 },
    budgetCatName: { flex: 1, fontFamily: LedgerFonts.bodyBold, fontSize: 13, color: colors.ink },
    budgetCatNums: { fontFamily: LedgerFonts.bodySemiBold, fontSize: 12.5, color: colors.ink2 },
    budgetCatRemain: { fontFamily: LedgerFonts.body, fontSize: 11.5, color: colors.muted },
    budgetCatRemainWarn: { color: colors.food, fontFamily: LedgerFonts.bodyBold },
    donutWrap: { width: 180, height: 180, alignSelf: 'center', marginTop: 6, marginBottom: 4, alignItems: 'center', justifyContent: 'center' },
    donutCenter: { position: 'absolute', alignItems: 'center', gap: 2 },
    donutTotal: { fontFamily: LedgerFonts.headingBold, fontSize: 19, color: colors.ink },
    donutSub: { fontFamily: LedgerFonts.body, fontSize: 11, color: colors.muted },
    rankRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
    rankDot: { width: 10, height: 10, borderRadius: 5 },
    rankName: { fontFamily: LedgerFonts.bodySemiBold, fontSize: 13, width: 60, color: colors.ink },
    rankBarBg: { flex: 1, height: 7, borderRadius: 4, backgroundColor: colors.lineLighter, overflow: 'hidden' },
    rankBarFg: { height: '100%', borderRadius: 4 },
    rankAmt: { fontFamily: LedgerFonts.headingBold, fontSize: 12.5, color: colors.ink2, width: 100, textAlign: 'right' },
    trendLegend: { flexDirection: 'row', gap: 16, paddingBottom: 8 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 2 },
    legendText: { fontFamily: LedgerFonts.bodySemiBold, fontSize: 12, color: colors.ink2 },
    trendChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 100 },
    trendCol: { alignItems: 'center', gap: 6 },
    trendBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 90 },
    bar: { width: 9, borderRadius: 3 },
    trendMonth: { fontFamily: LedgerFonts.bodySemiBold, fontSize: 10.5, color: colors.muted },
  });
}
