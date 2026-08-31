import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChevronLeftIcon, ChevronRightIcon, FilterIcon } from '@/components/icons';
import { LedgerFonts } from '@/constants/ledger-colors';
import type { ColorPalette } from '@/constants/theme-palettes';
import { formatFullDateWithWeekday, formatYearMonth } from '@/i18n/format';
import { useCategories } from '@/store/categories-context';
import { useMonth } from '@/store/month-context';
import { useSettings } from '@/store/settings-context';
import { TODAY, formatAmount, getMonthTransactions, useTransactions, type Transaction } from '@/store/transactions-context';

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
    iconBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
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
    segmented: {
      marginHorizontal: 20,
      marginBottom: 14,
      backgroundColor: colors.lineLight,
      borderRadius: 12,
      padding: 3,
      flexDirection: 'row',
      gap: 2,
    },
    segment: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 9 },
    segmentActive: {
      backgroundColor: colors.card,
      shadowColor: '#15130F',
      shadowOpacity: 0.12,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    segmentText: { fontFamily: LedgerFonts.bodyBold, fontSize: 13, color: colors.muted },
    segmentTextActive: { color: colors.ink },
    content: { paddingHorizontal: 20, paddingBottom: 32, gap: 16 },
    emptyText: { fontFamily: LedgerFonts.body, fontSize: 13, color: colors.muted, textAlign: 'center', paddingTop: 32 },
    dayGroup: { gap: 8 },
    dayHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 4 },
    dayHeadLeft: { fontFamily: LedgerFonts.bodyBold, fontSize: 12.5, color: colors.muted },
    dayHeadRight: { fontFamily: LedgerFonts.headingBold, fontSize: 12.5 },
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
    txAmt: { fontFamily: LedgerFonts.headingBold, fontSize: 14.5 },
    txTime: { fontFamily: LedgerFonts.body, fontSize: 11, color: colors.muted },
  });
}
