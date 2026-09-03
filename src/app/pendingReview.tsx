import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useCategories } from '@/store/categoriesContext';
import { useCategoryPickerBridge } from '@/store/categoryPickerBridge';
import { useSettings } from '@/store/settingsContext';
import { formatAmount, useTransactions } from '@/store/transactionsContext';
import { createStyles } from '@/styles/pendingReviewStyles';

export default function PendingReviewModal() {
  const { t } = useTranslation();
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { pendingTransactions, approvePending, rejectPending } = useTransactions();
  const { getCategoryMeta } = useCategories();
  const { result: pickerResult, setResult: setPickerResult } = useCategoryPickerBridge();

  // 카테고리·상호명을 고쳐도 승인 전까지는 화면에만 반영한다.
  type Edit = { categoryKey?: string; subcategory?: string; memo?: string };
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [pickingId, setPickingId] = useState<string | null>(null);

  useEffect(() => {
    if (!pickerResult || !pickingId) return;
    setEdits((prev) => ({
      ...prev,
      [pickingId]: {
        ...prev[pickingId],
        categoryKey: pickerResult.categoryKey,
        subcategory: pickerResult.subcategory,
      },
    }));
    setPickingId(null);
    setPickerResult(null);
  }, [pickerResult, pickingId, setPickerResult]);

  const editMemo = (id: string, memo: string) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], memo } }));
  };

  const openCategoryPicker = (id: string, categoryKey: string, subcategory?: string) => {
    setPickingId(id);
    router.push({ pathname: '/categoryPicker', params: { current: categoryKey, currentSub: subcategory ?? '' } });
  };

  const handleApprove = (id: string) => {
    const pending = pendingTransactions.find((p) => p.id === id);
    if (!pending) return;
    const edit = edits[id];
    approvePending(
      id,
      edit
        ? {
            date: pending.date,
            time: pending.time,
            type: pending.type,
            categoryKey: edit.categoryKey ?? pending.categoryKey,
            subcategory: 'categoryKey' in edit ? edit.subcategory : pending.subcategory,
            amount: pending.amount,
            memo: edit.memo?.trim() || pending.memo,
            note: pending.note,
            tags: pending.tags,
            excludedFromBudget: pending.excludedFromBudget,
          }
        : undefined,
    );
  };

  return (
    <KeyboardAvoidingView style={styles.sheet} behavior={Platform.OS === 'android' ? 'height' : undefined}>
      <View style={styles.handle} />
      <View style={styles.sheetHead}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.btnCancel}>{t('common.cancel')}</Text>
        </Pressable>
        <Text style={styles.sheetTitle}>{t('pendingReview.title')}</Text>
        <View style={styles.headSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        <Text style={styles.introText}>{t('pendingReview.introText')}</Text>

        {pendingTransactions.length === 0 ? (
          <Text style={styles.emptyText}>{t('pendingReview.empty')}</Text>
        ) : (
          pendingTransactions.map((tx) => {
            const edit = edits[tx.id];
            const categoryKey = edit?.categoryKey ?? tx.categoryKey;
            const subcategory = edit && 'categoryKey' in edit ? edit.subcategory : tx.subcategory;
            const memo = edit?.memo ?? tx.memo ?? '';
            const meta = getCategoryMeta(categoryKey);
            return (
              <View key={tx.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.iconCircle, { backgroundColor: meta.color }]}>
                    <meta.Icon size={19} />
                  </View>
                  <View style={styles.cardInfo}>
                    {/* 이체로 들어온 건("카카오페이" 등)을 "회식 술값"처럼 고쳐 넣을 수 있어야 한다. */}
                    <TextInput
                      style={styles.merchantInput}
                      value={memo}
                      onChangeText={(text) => editMemo(tx.id, text)}
                      placeholder={t('pendingReview.merchantPlaceholder')}
                      placeholderTextColor={colors.mutedLight}
                      returnKeyType="done"
                    />
                    <Text style={styles.when}>
                      {tx.date} {tx.time}
                    </Text>
                  </View>
                  <Text style={[styles.amount, tx.type === 'income' && styles.amountIncome]}>
                    {tx.type === 'income' ? '+' : '-'}
                    {formatAmount(tx.amount)}
                    {t('common.won')}
                  </Text>
                </View>

                <View style={styles.categoryRow}>
                  <Text style={styles.categoryLabel}>{t('pendingReview.category')}</Text>
                  <Pressable
                    style={styles.categoryBtn}
                    onPress={() => openCategoryPicker(tx.id, categoryKey, subcategory)}>
                    <View style={[styles.categoryDot, { backgroundColor: meta.color }]} />
                    <Text style={styles.categoryBtnText}>{subcategory ? `${meta.name} · ${subcategory}` : meta.name}</Text>
                  </Pressable>
                  {!edit?.categoryKey && <Text style={styles.guessTag}>{t('pendingReview.guessed')}</Text>}
                </View>

                <View style={styles.actions}>
                  <Pressable style={styles.approveBtn} onPress={() => handleApprove(tx.id)}>
                    <Text style={styles.approveBtnText}>{t('pendingReview.approve')}</Text>
                  </Pressable>
                  <Pressable style={styles.rejectBtn} onPress={() => rejectPending(tx.id)}>
                    <Text style={styles.rejectBtnText}>{t('pendingReview.reject')}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
