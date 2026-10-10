import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Animated, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, SparkleIcon } from '@/components/icons';
import { RefreshToast } from '@/components/refreshToast';
import { LedgerColors } from '@/constants/ledgerColors';
import { useRefreshFeedback } from '@/hooks/useRefreshFeedback';
import { formatFullDateWithWeekday, formatYearMonth } from '@/i18n/format';
import { useCategories } from '@/store/categoriesContext';
import { useEditMode } from '@/store/editModeContext';
import { useMonth } from '@/store/monthContext';
import { useSettings } from '@/store/settingsContext';
import { TODAY, formatAmount, getMonthTransactions, useTransactions, type Transaction } from '@/store/transactionsContext';
import { createStyles } from '@/styles/listStyles';

// Adjust this to nudge the header up/down while tuning the top spacing.
const TOP_OFFSET = 0;

export default function ListScreen() {
  const { t, i18n } = useTranslation();
  const { colors, hideExcludedFromBudget } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { transactions, bulkDelete, refresh: refreshTransactions } = useTransactions();
  const { getCategoryMeta, refresh: refreshCategories } = useCategories();
  const { year, month, goMonth, goToToday, isOnToday } = useMonth();
  const { editMode, setEditMode } = useEditMode();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { refreshing, justRefreshed, contentOpacity, run, onScrollBeginDrag, onScrollEndDrag } = useRefreshFeedback();

  const onRefresh = useCallback(
    () => run(async () => { await Promise.all([refreshTransactions(), refreshCategories()]); }),
    [run, refreshTransactions, refreshCategories],
  );

  const language = i18n.language as 'ko' | 'en' | 'ja';
  type Segment = 'all' | 'expense' | 'income' | 'excluded';
  const SEGMENTS: { key: Segment; label: string }[] = [
    { key: 'all', label: t('list.segmentAll') },
    { key: 'expense', label: t('common.expense') },
    { key: 'income', label: t('common.income') },
    { key: 'excluded', label: t('list.segmentExcluded') },
  ];
  const [segment, setSegment] = useState<Segment>('all');

  const groups = useMemo(() => {
    const isExcludedSegment = segment === 'excluded';
    const monthTx = getMonthTransactions(transactions, year, month).filter((t) => {
      if (isExcludedSegment) return t.excludedFromBudget;
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
        // "제외됨" 탭은 제외 목록을 확인하는 화면이라, 예산 제외 필터/가리기 설정과
        // 무관하게 항상 전부 보여주고 순잔액도 실제 항목 그대로 계산한다.
        const trackedItems = isExcludedSegment ? items : items.filter((t) => !t.excludedFromBudget);
        const income = trackedItems.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = trackedItems.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const net = income - expense;
        const visibleItems = isExcludedSegment || !hideExcludedFromBudget ? items : trackedItems;
        return {
          date,
          items: visibleItems.sort((a, b) => (a.time < b.time ? 1 : -1)),
          net,
        };
      })
      .filter((group) => group.items.length > 0);
  }, [transactions, year, month, segment, hideExcludedFromBudget]);

  // 현재 화면에 보이는 거래 id (전체 선택/해제 기준). 선택은 항상 이 범위 안에서만 유지된다.
  const visibleIds = useMemo(() => groups.flatMap((g) => g.items.map((i) => i.id)), [groups]);
  const allSelected = visibleIds.length > 0 && selectedIds.size === visibleIds.length;

  // 월/세그먼트(보이는 범위)가 바뀌면 편집모드와 선택을 초기화 — 안 보이는 거래가 선택에 남지 않게.
  useEffect(() => {
    setEditMode(false);
    setSelectedIds(new Set());
  }, [year, month, segment, setEditMode]);

  const exitEditMode = useCallback(() => {
    setEditMode(false);
    setSelectedIds(new Set());
  }, [setEditMode]);

  const enterEditMode = useCallback(
    (id: string) => {
      setEditMode(true);
      setSelectedIds(new Set([id]));
    },
    [setEditMode],
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => (prev.size === visibleIds.length ? new Set() : new Set(visibleIds)));
  }, [visibleIds]);

  const handleBulkDelete = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    Alert.alert(t('list.deleteConfirmTitle', { count: ids.length }), t('modal.deleteConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          bulkDelete(ids);
          exitEditMode();
        },
      },
    ]);
  }, [selectedIds, bulkDelete, exitEditMode, t]);

  return (
    <View style={styles.root}>
      {editMode ? (
        <View style={[styles.header, { marginTop: TOP_OFFSET }]}>
          <Text style={styles.editCount}>{t('list.selectedCount', { count: selectedIds.size })}</Text>
          <View style={styles.headerActions}>
            <Pressable style={styles.editActionBtn} hitSlop={8} onPress={toggleSelectAll}>
              <Text style={styles.editActionText}>{allSelected ? t('list.deselectAll') : t('list.selectAll')}</Text>
            </Pressable>
            <Pressable
              style={[styles.editActionBtn, selectedIds.size === 0 && styles.editActionBtnDisabled]}
              hitSlop={8}
              onPress={handleBulkDelete}
              disabled={selectedIds.size === 0}>
              <Text style={[styles.editActionText, styles.editDeleteText]}>{t('common.delete')}</Text>
            </Pressable>
            <Pressable style={styles.editActionBtn} hitSlop={8} onPress={exitEditMode}>
              <Text style={styles.editActionText}>{t('common.cancel')}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
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
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn} hitSlop={8} onPress={() => router.push('/aiSettlement')}>
              <SparkleIcon size={18} color={colors.ink} />
              <Text style={styles.iconBtnText}>{t('list.settleButton')}</Text>
            </Pressable>
          </View>
        </View>
      )}
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

      <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEndDrag}
          refreshControl={
            editMode ? undefined : (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} colors={[colors.ink]} />
            )
          }>
        {groups.length === 0 && <Text style={styles.emptyText}>{t('list.noTransactionsMonth')}</Text>}
        {groups.map((group) => (
          <View key={group.date} style={styles.dayGroup}>
            <View style={styles.dayHead}>
              <Text style={styles.dayHeadLeft}>
                {formatFullDateWithWeekday(group.date, language)}
                {group.date === TODAY.dateStr ? ` · ${t('common.today')}` : ''}
              </Text>
              <Text style={[styles.dayHeadRight, { color: group.net >= 0 ? LedgerColors.income : LedgerColors.expense }]}>
                {group.net >= 0 ? '+' : '-'}
                {formatAmount(Math.abs(group.net))}
              </Text>
            </View>
            {group.items.map((item) => {
              const meta = getCategoryMeta(item.categoryKey);
              const selected = selectedIds.has(item.id);
              return (
                <Pressable
                  key={item.id}
                  style={[styles.txRow, editMode && selected && styles.txRowSelected]}
                  onPress={() =>
                    editMode ? toggleSelect(item.id) : router.push({ pathname: '/modal', params: { id: item.id } })
                  }
                  onLongPress={() => {
                    if (!editMode) enterEditMode(item.id);
                  }}
                  delayLongPress={300}>
                  {editMode && (
                    <View style={[styles.checkbox, selected && styles.checkboxOn]}>
                      {selected && <CheckIcon size={16} color={colors.bg} />}
                    </View>
                  )}
                  <View style={[styles.catCircle, { backgroundColor: meta.color }]}>
                    <meta.Icon />
                  </View>
                  <View style={styles.txMid}>
                    <View style={styles.txNameRow}>
                      <Text style={styles.txName}>
                        {meta.name}
                        {item.subcategory ? ` · ${item.subcategory}` : ''}
                      </Text>
                      {!!item.excludedFromBudget && (
                        <View style={styles.excludedPill}>
                          <Text style={styles.excludedPillText}>{t('list.segmentExcluded')}</Text>
                        </View>
                      )}
                    </View>
                    {!!item.memo && <Text style={styles.txMemo}>{item.memo}</Text>}
                  </View>
                  <View style={styles.txRight}>
                    <Text style={[styles.txAmt, { color: item.type === 'income' ? LedgerColors.income : LedgerColors.expense }]}>
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
      </Animated.View>
      <RefreshToast visible={justRefreshed} label={t('common.refreshed')} />
    </View>
  );
}
