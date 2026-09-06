import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { CheckIcon, ChevronDownIcon, ChevronRightIcon } from '@/components/icons';
import { INCOME_CATEGORY_KEY, UNCATEGORIZED_META } from '@/constants/categories';
import type { ColorPalette } from '@/constants/themePalettes';
import { useCategories } from '@/store/categoriesContext';
import { useCategoryPickerBridge } from '@/store/categoryPickerBridge';
import { useSettings } from '@/store/settingsContext';
import { formatAmount, useTransactions, type Transaction } from '@/store/transactionsContext';
import { createStyles } from '@/styles/uncategorizedCleanupStyles';

// sms-ingest 등에서 카테고리를 못 알아맞혔을 때 쓰는 관례적 기본 카테고리 키.
// 삭제된 카테고리를 참조하는 "진짜 미지정"과는 다르지만, 사실상 분류가 안 된
// 상태라는 점은 같아서 같은 화면에서 다루되 섹션은 구분한다.
const ETC_CATEGORY_KEY = 'etc';

type Group = { key: string; label: string; items: Transaction[] };

function groupByMemo(items: Transaction[], keyPrefix: string, noMemoLabel: string): Group[] {
  // 그룹 식별자(key)는 항상 고유해야 하므로 메모가 없으면 거래 id를 그대로 쓴다.
  // 화면에 보여줄 라벨(label)은 이 식별자와 별개로 계산한다 — 메모 없는 거래가
  // 여러 건이면 key는 전부 다르지만 label은 전부 "메모 없음"이 될 수 있어서다.
  // keyPrefix로 섹션을 구분해서, 같은 상호명이 두 섹션 모두에 있어도 키가 안 겹치게 한다.
  const byKey = new Map<string, Transaction[]>();
  for (const tx of items) {
    const base = tx.memo?.trim() || tx.id;
    const key = `${keyPrefix}:${base}`;
    const list = byKey.get(key) ?? [];
    list.push(tx);
    byKey.set(key, list);
  }
  return Array.from(byKey.entries())
    .map(([key, its]) => ({
      key,
      label: its[0].memo?.trim() || noMemoLabel,
      items: its.sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1)),
    }))
    .sort((a, b) => b.items.length - a.items.length);
}

function Checkbox({ checked, onToggle, colors }: { checked: boolean; onToggle: () => void; colors: ColorPalette }) {
  return (
    <Pressable
      onPress={onToggle}
      hitSlop={8}
      style={[
        { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
        { borderColor: checked ? colors.ink : colors.line, backgroundColor: checked ? colors.ink : 'transparent' },
      ]}>
      {checked && <CheckIcon size={13} color={colors.bg} />}
    </Pressable>
  );
}

export default function UncategorizedCleanupModal() {
  const { t } = useTranslation();
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { transactions, bulkUpdateCategory } = useTransactions();
  const { categoryKeys } = useCategories();
  const { result: pickerResult, setResult: setPickerResult } = useCategoryPickerBridge();

  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});
  const [pickingKey, setPickingKey] = useState<string | null>(null);

  const sections = useMemo(() => {
    const validKeys = new Set([...categoryKeys, INCOME_CATEGORY_KEY]);
    const deletedCategory = transactions.filter((tx) => !validKeys.has(tx.categoryKey));
    const etcUnspecified = transactions.filter((tx) => tx.categoryKey === ETC_CATEGORY_KEY && !tx.subcategory);
    const noMemoLabel = t('uncategorizedCleanup.noMemo');

    return [
      {
        key: 'deletedCategory',
        title: t('uncategorizedCleanup.sectionDeleted'),
        groups: groupByMemo(deletedCategory, 'deleted', noMemoLabel),
      },
      {
        key: 'etcUnspecified',
        title: t('uncategorizedCleanup.sectionEtc'),
        groups: groupByMemo(etcUnspecified, 'etc', noMemoLabel),
      },
    ].filter((section) => section.groups.length > 0);
  }, [transactions, categoryKeys, t]);

  const allGroups = useMemo(() => sections.flatMap((section) => section.groups), [sections]);

  useEffect(() => {
    if (!pickerResult || !pickingKey) return;
    const group = allGroups.find((g) => g.key === pickingKey);
    if (group) {
      const ids = group.items.filter((tx) => checkedIds[tx.id]).map((tx) => tx.id);
      if (ids.length > 0) {
        bulkUpdateCategory(ids, pickerResult.categoryKey, pickerResult.subcategory);
      }
    }
    setPickingKey(null);
    setExpandedKey(null);
    setPickerResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickerResult, pickingKey]);

  const toggleExpand = (key: string, items: Transaction[]) => {
    if (expandedKey === key) {
      setExpandedKey(null);
      return;
    }
    setExpandedKey(key);
    setCheckedIds(Object.fromEntries(items.map((tx) => [tx.id, true])));
  };

  const toggleChecked = (id: string) => {
    setCheckedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openCategoryPicker = (key: string) => {
    setPickingKey(key);
    router.push({ pathname: '/categoryPicker', params: { current: '', currentSub: '' } });
  };

  return (
    <View style={styles.sheet}>
      <View style={styles.handle} />
      <View style={styles.sheetHead}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.btnCancel}>{t('common.cancel')}</Text>
        </Pressable>
        <Text style={styles.sheetTitle}>{t('uncategorizedCleanup.title')}</Text>
        <View style={styles.headSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.introText}>{t('uncategorizedCleanup.introText')}</Text>

        {sections.length === 0 ? (
          <Text style={styles.emptyText}>{t('uncategorizedCleanup.empty')}</Text>
        ) : (
          sections.map((section) => (
            <View key={section.key} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.groups.map((group) => {
                const expanded = expandedKey === group.key;
                const checkedCount = group.items.filter((tx) => checkedIds[tx.id]).length;
                return (
                  <View key={group.key} style={styles.card}>
                    <Pressable style={styles.cardHead} onPress={() => toggleExpand(group.key, group.items)}>
                      <View style={[styles.iconCircle, { backgroundColor: UNCATEGORIZED_META.color }]}>
                        <UNCATEGORIZED_META.Icon size={18} />
                      </View>
                      <View style={styles.cardInfo}>
                        <Text style={styles.memoText}>{group.label}</Text>
                        <Text style={styles.countText}>
                          {t('uncategorizedCleanup.groupCount', { count: group.items.length })}
                        </Text>
                      </View>
                      {expanded ? (
                        <ChevronDownIcon size={16} color={colors.muted} />
                      ) : (
                        <ChevronRightIcon size={16} color={colors.muted} />
                      )}
                    </Pressable>

                    {expanded && (
                      <View style={styles.expandedBody}>
                        {group.items.map((tx) => (
                          <Pressable key={tx.id} style={styles.itemRow} onPress={() => toggleChecked(tx.id)}>
                            <Checkbox checked={!!checkedIds[tx.id]} onToggle={() => toggleChecked(tx.id)} colors={colors} />
                            <Text style={styles.itemWhen}>
                              {tx.date} {tx.time}
                            </Text>
                            <Text style={[styles.itemAmt, tx.type === 'income' && styles.itemAmtIncome]}>
                              {tx.type === 'income' ? '+' : '-'}
                              {formatAmount(tx.amount)}
                            </Text>
                          </Pressable>
                        ))}
                        <Pressable
                          style={[styles.applyBtn, checkedCount === 0 && styles.applyBtnDisabled]}
                          disabled={checkedCount === 0}
                          onPress={() => openCategoryPicker(group.key)}>
                          <Text style={styles.applyBtnText}>
                            {t('uncategorizedCleanup.applyButton', { count: checkedCount })}
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
