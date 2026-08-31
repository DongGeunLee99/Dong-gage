import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChevronLeftIcon, ChevronRightIcon, FilterIcon } from '@/components/icons';
import { LedgerFonts } from '@/constants/ledger-colors';
import type { ColorPalette } from '@/constants/theme-palettes';
import { formatFullDateWithWeekday, formatYearMonth, getWeekdayLabels } from '@/i18n/format';
import { useCategories } from '@/store/categories-context';
import { useMonth } from '@/store/month-context';
import { useSettings } from '@/store/settings-context';
import {
  TODAY,
  buildMonthGrid,
  formatAmount,
  formatCompactAmount,
  getDayTransactions,
  getMonthTransactions,
  monthSummary,
  useTransactions,
} from '@/store/transactions-context';

// Adjust this to nudge the header up/down while tuning the top spacing.
const TOP_OFFSET = 0;

export default function CalendarScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { transactions } = useTransactions();
  const { getCategoryMeta } = useCategories();
  const { year, month, goMonth, goToToday: goToTodayMonth, isOnToday: isOnTodayMonth } = useMonth();
  const [selectedDate, setSelectedDate] = useState(TODAY.dateStr);

  const language = i18n.language as 'ko' | 'en' | 'ja';
  const weekdayLabels = useMemo(() => getWeekdayLabels(language), [language]);

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const summary = useMemo(() => monthSummary(transactions, year, month), [transactions, year, month]);

  const dayTotals = useMemo(() => {
    const map = new Map<string, { pos: number; neg: number }>();
    for (const t of getMonthTransactions(transactions, year, month)) {
      const entry = map.get(t.date) ?? { pos: 0, neg: 0 };
      if (t.type === 'income') entry.pos += t.amount;
      else entry.neg += t.amount;
      map.set(t.date, entry);
    }
    return map;
  }, [transactions, year, month]);

  const selectedTx = useMemo(() => getDayTransactions(transactions, selectedDate), [transactions, selectedDate]);

  const isOnToday = isOnTodayMonth && selectedDate === TODAY.dateStr;
  const goToToday = () => {
    goToTodayMonth();
    setSelectedDate(TODAY.dateStr);
  };

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
        <Pressable style={styles.filterBtn} hitSlop={8}>
          <FilterIcon color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('common.income')}</Text>
            <Text style={[styles.summaryValue, { color: colors.income }]}>+{formatAmount(summary.income)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('common.expense')}</Text>
            <Text style={[styles.summaryValue, { color: colors.expense }]}>-{formatAmount(summary.expense)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('calendar.balance')}</Text>
            <Text style={styles.summaryValue}>{formatAmount(summary.balance)}</Text>
          </View>
        </View>

        <View style={styles.calCard}>
          <View style={styles.weekdayRow}>
            {weekdayLabels.map((w, i) => (
              <Text key={i} style={styles.weekdayLabel}>
                {w}
              </Text>
            ))}
          </View>
          <View style={styles.calGrid}>
            {grid.map((cell, i) => {
              if (!cell) return <View key={i} style={styles.dayCell} />;
              const totals = dayTotals.get(cell.dateStr);
              const isToday = cell.dateStr === TODAY.dateStr;
              const isSelected = cell.dateStr === selectedDate;
              return (
                <Pressable
                  key={cell.dateStr}
                  style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                  onPress={() => setSelectedDate(cell.dateStr)}>
                  <View style={isToday ? styles.todayBadge : undefined}>
                    <Text style={isToday ? styles.todayNum : styles.dayNum}>{cell.day}</Text>
                  </View>
                  {!!totals?.neg && (
                    <Text style={[styles.dayAmt, { color: colors.expense }]}>-{formatCompactAmount(totals.neg)}</Text>
                  )}
                  {!!totals?.pos && (
                    <Text style={[styles.dayAmt, { color: colors.income }]}>+{formatCompactAmount(totals.pos)}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={styles.previewTitle}>
          {formatFullDateWithWeekday(selectedDate, language)}
          {selectedDate === TODAY.dateStr ? ` · ${t('common.today')}` : ''}
        </Text>
        {selectedTx.length === 0 && <Text style={styles.emptyText}>{t('calendar.noTransactions')}</Text>}
        {selectedTx.map((t) => {
          const meta = getCategoryMeta(t.categoryKey);
          return (
            <Pressable
              key={t.id}
              style={styles.txRow}
              onPress={() => router.push({ pathname: '/modal', params: { id: t.id } })}>
              <View style={[styles.catCircle, { backgroundColor: meta.color }]}>
                <meta.Icon />
              </View>
              <View style={styles.txMid}>
                <Text style={styles.txName}>
                  {meta.name}
                  {t.subcategory ? ` · ${t.subcategory}` : ''}
                </Text>
                {!!t.memo && <Text style={styles.txMemo}>{t.memo}</Text>}
              </View>
              <View style={styles.txRight}>
                <Text style={[styles.txAmt, { color: t.type === 'income' ? colors.income : colors.expense }]}>
                  {t.type === 'income' ? '+' : '-'}
                  {formatAmount(t.amount)}
                </Text>
                <Text style={styles.txTime}>{t.time}</Text>
              </View>
            </Pressable>
          );
        })}
        <Pressable style={styles.addRow} onPress={() => router.push('/modal')}>
          <Text style={styles.addRowText}>{t('calendar.addTransaction')}</Text>
        </Pressable>
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
    filterBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: { paddingHorizontal: 20, paddingBottom: 32, gap: 14 },
    summaryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 18,
      paddingVertical: 16,
      paddingHorizontal: 8,
      shadowColor: '#15130F',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
    summaryLabel: { fontFamily: LedgerFonts.bodySemiBold, fontSize: 11, color: colors.muted },
    summaryValue: { fontFamily: LedgerFonts.headingBold, fontSize: 15, color: colors.ink },
    summaryDivider: { width: 1, height: 28, backgroundColor: colors.line },
    calCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      paddingTop: 14,
      paddingHorizontal: 10,
      paddingBottom: 6,
      shadowColor: '#15130F',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    weekdayRow: {
      flexDirection: 'row',
      paddingBottom: 8,
      marginBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.lineLight,
    },
    weekdayLabel: {
      flex: 1,
      textAlign: 'center',
      fontFamily: LedgerFonts.bodyBold,
      fontSize: 11,
      color: colors.muted,
    },
    calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: {
      width: `${100 / 7}%`,
      height: 56,
      alignItems: 'center',
      paddingTop: 4,
      gap: 3,
      borderRadius: 10,
    },
    dayCellSelected: { borderWidth: 2, borderColor: colors.selectedDay, backgroundColor: colors.card },
    dayNum: { fontFamily: LedgerFonts.bodySemiBold, fontSize: 13, color: colors.ink },
    todayBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.ink,
      alignItems: 'center',
      justifyContent: 'center',
    },
    todayNum: { fontFamily: LedgerFonts.bodyBold, fontSize: 13, color: colors.bg },
    dayAmt: { fontFamily: LedgerFonts.headingBold, fontSize: 8.5 },
    previewTitle: { fontFamily: LedgerFonts.bodyBold, fontSize: 13, color: colors.ink2, paddingHorizontal: 2 },
    emptyText: { fontFamily: LedgerFonts.body, fontSize: 13, color: colors.muted, paddingHorizontal: 2 },
    txRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 12,
      shadowColor: '#15130F',
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    catCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    txMid: { flex: 1, gap: 2 },
    txName: { fontFamily: LedgerFonts.bodySemiBold, fontSize: 14, color: colors.ink },
    txMemo: { fontFamily: LedgerFonts.body, fontSize: 12, color: colors.muted },
    txRight: { alignItems: 'flex-end', gap: 2 },
    txAmt: { fontFamily: LedgerFonts.headingBold, fontSize: 14 },
    txTime: { fontFamily: LedgerFonts.body, fontSize: 11, color: colors.muted },
    addRow: {
      borderWidth: 1.5,
      borderColor: colors.dashed,
      borderStyle: 'dashed',
      borderRadius: 16,
      padding: 12,
      alignItems: 'center',
    },
    addRowText: { fontFamily: LedgerFonts.bodyBold, fontSize: 13, color: colors.muted },
  });
}
