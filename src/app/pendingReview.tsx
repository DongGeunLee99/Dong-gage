import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { ChatIcon, PlusIcon, SquareMarkIcon, type IconProps } from '@/components/icons';
import { ToggleSwitch } from '@/components/toggleSwitch';
import { useCategories } from '@/store/categoriesContext';
import { useCategoryPickerBridge } from '@/store/categoryPickerBridge';
import { useSettings } from '@/store/settingsContext';
import { formatAmount, useTransactions, type PendingTransaction } from '@/store/transactionsContext';
import { createStyles } from '@/styles/pendingReviewStyles';

type SourceKey = 'kakaobank' | 'naverpay' | 'other';

/** 원본 문자에 찍힌 발신처 태그로 어디서 들어온 건인지 구분한다(스키마 변경 없이 raw_message만 본다). */
function detectSource(rawMessage?: string): SourceKey {
  if (rawMessage?.includes('[카카오뱅크]')) return 'kakaobank';
  if (rawMessage?.includes('[네이버페이]')) return 'naverpay';
  return 'other';
}

// 실제 로고가 아니라 브랜드를 연상시키는 정도의 색/아이콘 — 정확한 공식 브랜드 컬러 코드는 아님.
const KAKAO_BRAND_COLOR = '#00C2A8';
const NAVER_BRAND_COLOR = '#03C75A';

function getSourceBadge(key: SourceKey): { color?: string; Icon?: (props: IconProps) => React.JSX.Element } {
  if (key === 'kakaobank') return { color: KAKAO_BRAND_COLOR, Icon: ChatIcon };
  if (key === 'naverpay') return { color: NAVER_BRAND_COLOR, Icon: SquareMarkIcon };
  return {};
}

export default function PendingReviewModal() {
  const { t } = useTranslation();
  const { colors, selfName } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { pendingTransactions, approvePending, rejectPending, addTestPendingTransaction } = useTransactions();
  const { getCategoryMeta } = useCategories();
  const { result: pickerResult, setResult: setPickerResult } = useCategoryPickerBridge();

  // 카테고리·상호명·예산제외 여부를 고쳐도 승인 전까지는 화면에만 반영한다.
  type Edit = { categoryKey?: string; subcategory?: string; memo?: string; excludedFromBudget?: boolean };
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [pickingId, setPickingId] = useState<string | null>(null);

  const groupedPending = useMemo(() => {
    const groups: Record<SourceKey, PendingTransaction[]> = { kakaobank: [], naverpay: [], other: [] };
    for (const tx of pendingTransactions) {
      groups[detectSource(tx.rawMessage)].push(tx);
    }
    return (
      [
        { key: 'kakaobank' as const, label: t('pendingReview.sourceKakao'), items: groups.kakaobank },
        { key: 'naverpay' as const, label: t('pendingReview.sourceNaver'), items: groups.naverpay },
        { key: 'other' as const, label: t('pendingReview.sourceOther'), items: groups.other },
      ] satisfies { key: SourceKey; label: string; items: PendingTransaction[] }[]
    ).filter((group) => group.items.length > 0);
  }, [pendingTransactions, t]);

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

  const toggleExclude = (id: string, current: boolean) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], excludedFromBudget: !current } }));
  };

  const openCategoryPicker = (id: string, categoryKey: string, subcategory?: string) => {
    setPickingId(id);
    router.push({ pathname: '/categoryPicker', params: { current: categoryKey, currentSub: subcategory ?? '' } });
  };

  const handleApprove = (id: string) => {
    const pending = pendingTransactions.find((p) => p.id === id);
    if (!pending) return;
    const edit = edits[id];
    // 화면에 미리 켜둔 예산제외 기본값(내 이름 매칭)도 명시적으로 넘겨야 승인 시 반영된다.
    const selfNameMatch = !!selfName.trim() && !!pending.memo?.includes(selfName.trim());
    approvePending(id, {
      date: pending.date,
      time: pending.time,
      type: pending.type,
      categoryKey: edit?.categoryKey ?? pending.categoryKey,
      subcategory: edit && 'categoryKey' in edit ? edit.subcategory : pending.subcategory,
      amount: pending.amount,
      memo: edit?.memo?.trim() || pending.memo,
      note: pending.note,
      tags: pending.tags,
      excludedFromBudget: edit?.excludedFromBudget ?? (pending.excludedFromBudget || selfNameMatch),
    });
  };

  return (
    <KeyboardAvoidingView style={styles.sheet} behavior={Platform.OS === 'android' ? 'height' : undefined}>
      <View style={styles.handle} />
      <View style={styles.sheetHead}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.btnCancel}>{t('common.cancel')}</Text>
        </Pressable>
        <Text style={styles.sheetTitle}>{t('pendingReview.title')}</Text>
        <Pressable style={styles.testBtn} hitSlop={8} onPress={() => addTestPendingTransaction()}>
          <PlusIcon size={14} color={colors.ink} />
          <Text style={styles.testBtnText}>{t('pendingReview.testButton')}</Text>
        </Pressable>
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
          groupedPending.map((group) => {
            const { color: badgeColor, Icon: BadgeIcon } = getSourceBadge(group.key);
            return (
            <View key={group.key} style={styles.sourceGroup}>
              <View style={styles.sourceGroupRow}>
                {BadgeIcon && <BadgeIcon size={16} color={badgeColor} />}
                <Text style={[styles.sourceGroupLabel, badgeColor ? { color: badgeColor, fontSize: 14 } : null]}>
                  {group.label} · {group.items.length}
                </Text>
              </View>
              {group.items.map((tx) => {
                const edit = edits[tx.id];
                const categoryKey = edit?.categoryKey ?? tx.categoryKey;
                const subcategory = edit && 'categoryKey' in edit ? edit.subcategory : tx.subcategory;
                const memo = edit?.memo ?? tx.memo ?? '';
                // 이체 상대방 이름이 "내 이름"과 같으면(계좌간 이동) 예산제외 토글을 미리 켜둔다.
                // 최종 반영은 사람이 승인 버튼을 눌러야 하므로 자동 필터링은 아니다.
                const selfNameMatch = !!selfName.trim() && !!tx.memo?.includes(selfName.trim());
                const excluded = edit?.excludedFromBudget ?? (tx.excludedFromBudget || selfNameMatch);
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

                    <View style={styles.excludeRow}>
                      <Text style={styles.excludeLabel}>{t('pendingReview.excludeFromBudget')}</Text>
                      <ToggleSwitch on={excluded} onToggle={() => toggleExclude(tx.id, excluded)} colors={colors} />
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
              })}
            </View>
            );
          })
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
