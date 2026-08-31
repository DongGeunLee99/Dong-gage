import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ChevronLeftIcon, ChevronRightIcon, FilterIcon } from '@/components/icons';
import { formatFullDateWithWeekday, formatYearMonth, getWeekdayLabels } from '@/i18n/format';
import { useCategories } from '@/store/categoriesContext';
import { useMonth } from '@/store/monthContext';
import { useSettings } from '@/store/settingsContext';
import {
  TODAY,
  buildMonthGrid,
  formatAmount,
  formatCompactAmount,
  getDayTransactions,
  getMonthTransactions,
  monthSummary,
  useTransactions,
} from '@/store/transactionsContext';
import { createStyles } from '@/styles/calendarStyles';

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
