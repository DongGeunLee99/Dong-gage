import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ChevronLeftIcon, ChevronRightIcon, FilterIcon } from '@/components/icons';
import { formatFullDateWithWeekday, formatYearMonth } from '@/i18n/format';
import { useCategories } from '@/store/categoriesContext';
import { useMonth } from '@/store/monthContext';
import { useSettings } from '@/store/settingsContext';
import { TODAY, formatAmount, getMonthTransactions, useTransactions, type Transaction } from '@/store/transactionsContext';
import { createStyles } from '@/styles/listStyles';

// Adjust this to nudge the header up/down while tuning the top spacing.
const TOP_OFFSET = 0;

export default function ListScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { transactions } = useTransactions();
  const { getCategoryMeta } = useCategories();
  const { year, month, goMonth, goToToday, isOnToday } = useMonth();

  const language = i18n.language as 'ko' | 'en' | 'ja';
  type Segment = 'all' | 'expense' | 'income';
  const SEGMENTS: { key: Segment; label: string }[] = [
    { key: 'all', label: t('list.segmentAll') },
    { key: 'expense', label: t('common.expense') },
    { key: 'income', label: t('common.income') },
  ];
  const [segment, setSegment] = useState<Segment>('all');

  const groups = useMemo(() => {
    const monthTx = getMonthTransactions(transactions, year, month).filter((t) => {
      if (segment === 'expense') return t.type === 'expense';
      if (segment === 'income') return t.type === 'income';
      return true;
    });

    const byDate = new Map<string, Transaction[]>();
    for (const t of monthTx) {
      const list = byDate.get(t.date) ?? [];
      list.push(t);
      byDate.set(t.date, list);
    }

    return Array.from(byDate.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, items]) => {
        const income = items.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = items.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const net = income - expense;
        return {
          date,
          items: items.sort((a, b) => (a.time < b.time ? 1 : -1)),
          net,
        };
      });
  }, [transactions, year, month, segment]);

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
        <Pressable style={styles.iconBtn} hitSlop={8}>
          <FilterIcon color={colors.ink} />
        </Pressable>
      </View>
      <View style={styles.segmented}>
        {SEGMENTS.map((seg) => (
          <Pressable
            key={seg.key}
            style={[styles.segment, segment === seg.key && styles.segmentActive]}
            onPress={() => setSegment(seg.key)}>
            <Text style={[styles.segmentText, segment === seg.key && styles.segmentTextActive]}>{seg.label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {groups.length === 0 && <Text style={styles.emptyText}>{t('list.noTransactionsMonth')}</Text>}
        {groups.map((group) => (
          <View key={group.date} style={styles.dayGroup}>
            <View style={styles.dayHead}>
              <Text style={styles.dayHeadLeft}>
                {formatFullDateWithWeekday(group.date, language)}
                {group.date === TODAY.dateStr ? ` · ${t('common.today')}` : ''}
              </Text>
              <Text style={[styles.dayHeadRight, { color: group.net >= 0 ? colors.income : colors.expense }]}>
                {group.net >= 0 ? '+' : '-'}
                {formatAmount(Math.abs(group.net))}
              </Text>
            </View>
            {group.items.map((item) => {
              const meta = getCategoryMeta(item.categoryKey);
              return (
                <Pressable
                  key={item.id}
                  style={styles.txRow}
                  onPress={() => router.push({ pathname: '/modal', params: { id: item.id } })}>
                  <View style={[styles.catCircle, { backgroundColor: meta.color }]}>
                    <meta.Icon />
                  </View>
                  <View style={styles.txMid}>
                    <Text style={styles.txName}>
                      {meta.name}
                      {item.subcategory ? ` · ${item.subcategory}` : ''}
                    </Text>
                    {!!item.memo && <Text style={styles.txMemo}>{item.memo}</Text>}
                  </View>
                  <View style={styles.txRight}>
                    <Text style={[styles.txAmt, { color: item.type === 'income' ? colors.income : colors.expense }]}>
                      {item.type === 'income' ? '+' : '-'}
                      {formatAmount(item.amount)}
                    </Text>
                    <Text style={styles.txTime}>{item.time}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
