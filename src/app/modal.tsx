import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ApplyMerchantSheet } from '@/components/applyMerchantSheet';
import { CalendarTabIcon, ChevronDownIcon, ChevronRightIcon, ChevronUpIcon, FixedIcon, PencilIcon } from '@/components/icons';
import { ToggleSwitch } from '@/components/toggleSwitch';
import { INCOME_CATEGORY_KEY } from '@/constants/categories';
import { LedgerColors } from '@/constants/ledgerColors';
import type { ColorPalette } from '@/constants/themePalettes';
import { formatFullDateWithYear } from '@/i18n/format';
import { useCategories } from '@/store/categoriesContext';
import { useCategoryPickerBridge } from '@/store/categoryPickerBridge';
import { useSettings } from '@/store/settingsContext';
import { formatAmount, parseTags, TODAY, useTransactions, type TransactionType } from '@/store/transactionsContext';
import { createStyles } from '@/styles/transactionModalStyles';

const MAX_DIGITS = 10;
const MAX_AMOUNT = 9_999_999_999; // MAX_DIGITS 자리수 상한
const QUICK_ADD_AMOUNTS = [5000, 10000] as const;
const KEYBOARD_ACCESSORY_ID = 'transaction-modal-accessory';
const FIELD_ORDER = ['amount', 'date', 'memo', 'note'] as const;
type FieldName = (typeof FIELD_ORDER)[number];

function dateTimeStringsToDate(dateStr: string, timeStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

function FieldNavBar({
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  onDone,
  doneLabel,
  colors,
}: {
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onDone: () => void;
  doneLabel: string;
  colors: ColorPalette;
}) {
  const styles = createStyles(colors);
  return (
    <View style={styles.accessoryBar}>
      <View style={styles.accessoryNav}>
        <Pressable onPress={onPrev} disabled={!canGoPrev} hitSlop={8}>
          <ChevronUpIcon size={20} color={canGoPrev ? colors.ink : colors.mutedLight} />
        </Pressable>
        <Pressable onPress={onNext} disabled={!canGoNext} hitSlop={8}>
          <ChevronDownIcon size={20} color={canGoNext ? colors.ink : colors.mutedLight} />
        </Pressable>
      </View>
      <Pressable onPress={onDone} hitSlop={8}>
        <Text style={styles.accessoryDoneText}>{doneLabel}</Text>
      </Pressable>
    </View>
  );
}

export default function TransactionModal() {
  const { t, i18n } = useTranslation();
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const language = i18n.language as 'ko' | 'en' | 'ja';

  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingId = typeof id === 'string' ? id : undefined;
  const { addTransaction, updateTransaction, deleteTransaction, getTransactionById, transactions, bulkUpdateFields } =
    useTransactions();
  const { categories, getCategoryMeta } = useCategories();
  const { result: pickerResult, setResult: setPickerResult } = useCategoryPickerBridge();
  const existing = editingId ? getTransactionById(editingId) : undefined;
  const isEditing = !!existing;

  const [type, setType] = useState<TransactionType>(existing?.type ?? 'expense');
  const [digits, setDigits] = useState(existing ? String(existing.amount) : '');
  const [categoryKey, setCategoryKey] = useState<string>(
    existing && existing.categoryKey !== INCOME_CATEGORY_KEY ? existing.categoryKey : (categories[0]?.key ?? ''),
  );
  const [subcategory, setSubcategory] = useState<string | undefined>(existing?.subcategory);
  const [memo, setMemo] = useState(existing?.memo ?? '');
  const [note, setNote] = useState(existing?.note ?? '');
  const [excludeFromBudget, setExcludeFromBudget] = useState(existing?.excludedFromBudget ?? false);
  const [dateStr, setDateStr] = useState(existing?.date ?? TODAY.dateStr);
  const [timeStr, setTimeStr] = useState(existing?.time ?? new Date().toTimeString().slice(0, 5));
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activeField, setActiveField] = useState<FieldName | null>(null);
  const [applySheetVisible, setApplySheetVisible] = useState(false);

  // 사용자가 카테고리를 직접 고른 적 있는지 — 자동채움(prefill)이 사용자가 고른 값을 덮지 않게.
  const categoryTouchedRef = useRef(false);

  const amountInputRef = useRef<TextInput>(null);
  const memoInputRef = useRef<TextInput>(null);
  const noteInputRef = useRef<TextInput>(null);
  const fieldRefs: Partial<Record<FieldName, React.RefObject<TextInput | null>>> = {
    amount: amountInputRef,
    memo: memoInputRef,
    note: noteInputRef,
  };

  const amount = useMemo(() => (digits ? parseInt(digits, 10) : 0), [digits]);
  const dateTimeAsDate = useMemo(() => dateTimeStringsToDate(dateStr, timeStr), [dateStr, timeStr]);
  const selectedCategoryMeta = getCategoryMeta(categoryKey);

  const trimmedMemo = memo.trim();
  // 현재 거래와 상호명(memo)이 정확히 같은 다른 거래들(일괄 적용 대상).
  const sameMerchant = useMemo(
    () =>
      trimmedMemo ? transactions.filter((tx) => tx.id !== editingId && (tx.memo?.trim() ?? '') === trimmedMemo) : [],
    [transactions, trimmedMemo, editingId],
  );

  // 자동저장: 모달을 떠날 때(쓸어내림/뒤로) 현재 값을 커밋한다. 취소/삭제는 discard로 커밋을 건너뛴다.
  const navigation = useNavigation();
  const discardRef = useRef(false);
  const commitRef = useRef<() => void>(() => {});
  useEffect(() => {
    commitRef.current = () => {
      if (amount <= 0) return; // 빈 금액: 신규는 생성 안 함 / 기존은 값 유지(저장 스킵)
      const input = {
        date: dateStr,
        time: timeStr,
        type,
        categoryKey: type === 'income' ? INCOME_CATEGORY_KEY : categoryKey,
        subcategory: type === 'expense' ? subcategory : undefined,
        amount,
        memo: memo.trim() || undefined,
        note: note.trim() || undefined,
        tags: note.trim() ? parseTags(note) : undefined,
        excludedFromBudget: excludeFromBudget,
      };
      if (isEditing && editingId) updateTransaction(editingId, input);
      else addTransaction(input);
    };
  });
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', () => {
      if (!discardRef.current) commitRef.current();
    });
    return unsub;
  }, [navigation]);

  const cancelAndClose = () => {
    discardRef.current = true;
    router.back();
  };

  const activeIndex = activeField ? FIELD_ORDER.indexOf(activeField) : -1;
  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex >= 0 && activeIndex < FIELD_ORDER.length - 1;

  const goToField = (field: FieldName) => {
    if (field === 'date') {
      Keyboard.dismiss();
      setShowTimePicker(true);
    } else {
      setShowTimePicker(false);
      fieldRefs[field]?.current?.focus();
    }
    setActiveField(field);
  };
  const handlePrevField = () => {
    if (canGoPrev) goToField(FIELD_ORDER[activeIndex - 1]);
  };
  const handleNextField = () => {
    if (canGoNext) goToField(FIELD_ORDER[activeIndex + 1]);
  };
  const handleDoneField = () => {
    setShowTimePicker(false);
    Keyboard.dismiss();
  };

  useEffect(() => {
    if (!pickerResult) return;
    categoryTouchedRef.current = true;
    setCategoryKey(pickerResult.categoryKey);
    setSubcategory(pickerResult.subcategory);
    setPickerResult(null);
  }, [pickerResult, setPickerResult]);

  const openCategoryPicker = () => {
    router.push({ pathname: '/categoryPicker', params: { current: categoryKey, currentSub: subcategory ?? '' } });
  };

  const handleAmountChange = (text: string) => {
    const onlyDigits = text.replace(/[^0-9]/g, '');
    setDigits(onlyDigits.slice(0, MAX_DIGITS));
  };

  // ④ 금액 빠른 추가(+5,000 / +10,000). MAX_DIGITS(10자리) 상한 유지.
  const addAmount = (delta: number) => {
    setDigits((prev) => String(Math.min((prev ? parseInt(prev, 10) : 0) + delta, MAX_AMOUNT)));
  };

  // ③ 자동채움: 신규 거래에서 상호명이 과거 거래와 일치하면, 사용자가 안 건드린 카테고리/메모를 최근 값으로 채운다.
  const handleMemoBlur = () => {
    if (isEditing) return;
    const m = memo.trim();
    if (!m) return;
    const match = transactions
      .filter((tx) => (tx.memo?.trim() ?? '') === m)
      .sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1))[0];
    if (!match) return;
    if (!categoryTouchedRef.current && type === 'expense' && match.type === 'expense') {
      setCategoryKey(match.categoryKey);
      setSubcategory(match.subcategory);
    }
    if (!note.trim() && match.note) setNote(match.note);
  };

  // ②③ 같은 상호명 거래에 현재 값을 일괄 적용(통일). 체크한 항목만 적용하고, 현재 편집 중인 거래도 함께 저장한다.
  const handleApplySheet = (selection: { category: boolean; note: boolean }) => {
    setApplySheetVisible(false);
    const ids = sameMerchant.map((tx) => tx.id);
    if (ids.length === 0) return;
    const fields: Parameters<typeof bulkUpdateFields>[1] = {};
    if (selection.category) {
      fields.categoryKey = type === 'income' ? INCOME_CATEGORY_KEY : categoryKey;
      fields.subcategory = type === 'expense' ? subcategory : undefined;
    }
    if (selection.note) {
      fields.note = note.trim() || undefined;
      fields.tags = note.trim() ? parseTags(note) : undefined;
    }
    bulkUpdateFields(ids, fields);
    router.back(); // 닫히면서 자동저장(beforeRemove)으로 현재 거래도 커밋됨
  };

  const handleDateTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (event.type === 'dismissed' || !selected) return;
    const y = selected.getFullYear();
    const mo = String(selected.getMonth() + 1).padStart(2, '0');
    const d = String(selected.getDate()).padStart(2, '0');
    const hh = String(selected.getHours()).padStart(2, '0');
    const mm = String(selected.getMinutes()).padStart(2, '0');
    setDateStr(`${y}-${mo}-${d}`);
    setTimeStr(`${hh}:${mm}`);
  };

  const handleDelete = () => {
    if (!editingId) return;
    Alert.alert(t('modal.deleteConfirmTitle'), t('modal.deleteConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          discardRef.current = true; // 삭제 후엔 자동저장(재추가) 되지 않게
          deleteTransaction(editingId);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={styles.sheet}>
      <View style={styles.handle} />
      <View style={styles.sheetHead}>
        <Pressable onPress={cancelAndClose}>
          <Text style={styles.btnCancel}>{t('common.cancel')}</Text>
        </Pressable>
        <Text style={styles.sheetTitle}>{isEditing ? t('modal.titleEdit') : t('modal.titleAdd')}</Text>
        <View style={styles.headSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.segmented}>
          <Pressable style={[styles.seg, type === 'expense' && styles.segActiveExpense]} onPress={() => setType('expense')}>
            <Text style={type === 'expense' ? styles.segTextExpense : styles.segText}>{t('common.expense')}</Text>
          </Pressable>
          <Pressable style={[styles.seg, type === 'income' && styles.segActiveIncome]} onPress={() => setType('income')}>
            <Text style={type === 'income' ? styles.segTextIncome : styles.segText}>{t('common.income')}</Text>
          </Pressable>
        </View>

        {/* 금액은 상태에서 바로 그리는 Text로 표시한다. 편집용 TextInput의 렌더값으로 숫자를 보여주면
            값이 바뀌어도 네이티브가 다시 안 그려(터치해야 갱신되는) 표시 지연 버그가 난다.
            그래서 숫자는 Text가 담당하고, 입력/키보드는 투명 TextInput이 겹쳐서 받는다. */}
        <Pressable style={styles.amountWrap} onPress={() => goToField('amount')}>
          <Text
            style={[
              styles.amountInput,
              { color: amount > 0 ? (type === 'income' ? LedgerColors.income : LedgerColors.expense) : colors.mutedLight },
            ]}
            numberOfLines={1}>
            {formatAmount(amount)}
          </Text>
          <Text style={styles.amountUnit}>{t('common.won')}</Text>
          <TextInput
            ref={amountInputRef}
            style={styles.amountHiddenInput}
            value={digits}
            onChangeText={handleAmountChange}
            onFocus={() => setActiveField('amount')}
            keyboardType="number-pad"
            inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
            caretHidden
          />
        </Pressable>

        <View style={styles.quickAddRow}>
          {QUICK_ADD_AMOUNTS.map((delta) => (
            <Pressable key={delta} style={styles.quickAddBtn} onPress={() => addAmount(delta)}>
              <Text style={styles.quickAddBtnText}>+{formatAmount(delta)}</Text>
            </Pressable>
          ))}
        </View>

        {type === 'expense' && (
          <Pressable style={styles.categoryPill} onPress={openCategoryPicker}>
            <View style={[styles.catCircle, { backgroundColor: selectedCategoryMeta.color }]}>
              <selectedCategoryMeta.Icon size={20} />
            </View>
            <Text style={styles.categoryPillText}>
              {selectedCategoryMeta.name}
              {subcategory ? ` · ${subcategory}` : ''}
            </Text>
            <ChevronRightIcon size={16} color={colors.muted} />
          </Pressable>
        )}

        <View style={styles.formCard}>
          <Pressable
            style={styles.formRow}
            onPress={() => {
              if (showTimePicker) {
                setShowTimePicker(false);
                setActiveField(null);
              } else {
                goToField('date');
              }
            }}>
            <CalendarTabIcon size={18} color={colors.muted} />
            <Text style={styles.formLabel}>{t('modal.date')}</Text>
            <Text style={styles.formValue}>
              {formatFullDateWithYear(dateStr, language)} {timeStr}
            </Text>
          </Pressable>
          {showTimePicker && (
            <View style={styles.timePickerWrap}>
              <DateTimePicker
                value={dateTimeAsDate}
                mode="datetime"
                is24Hour
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateTimeChange}
              />
            </View>
          )}
          <Pressable style={styles.formRow} onPress={() => goToField('memo')}>
            <PencilIcon size={18} />
            <TextInput
              ref={memoInputRef}
              style={styles.memoInput}
              placeholder={t('modal.memoPlaceholder')}
              placeholderTextColor={colors.mutedLight}
              value={memo}
              onChangeText={setMemo}
              onFocus={() => setActiveField('memo')}
              onBlur={handleMemoBlur}
              inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
            />
          </Pressable>
          <Pressable style={[styles.formRow, styles.formRowLast, styles.noteRow]} onPress={() => goToField('note')}>
            <TextInput
              ref={noteInputRef}
              style={styles.noteInput}
              placeholder={t('modal.notePlaceholder')}
              placeholderTextColor={colors.mutedLight}
              value={note}
              onChangeText={setNote}
              onFocus={() => setActiveField('note')}
              inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
              multiline
            />
          </Pressable>
        </View>
        {sameMerchant.length > 0 && (
          <Pressable style={styles.applySameMerchant} onPress={() => setApplySheetVisible(true)}>
            <Text style={styles.applySameMerchantText}>
              {t('modal.applySameMerchant', { count: sameMerchant.length })}
            </Text>
          </Pressable>
        )}
        <View style={styles.formCard}>
          <View style={[styles.formRow, styles.formRowLast]}>
            <FixedIcon size={18} color={colors.muted} />
            <Text style={styles.formLabel}>{t('modal.excludeFromBudget')}</Text>
            <ToggleSwitch on={excludeFromBudget} onToggle={() => setExcludeFromBudget((v) => !v)} colors={colors} />
          </View>
        </View>
        {isEditing && (
          <Pressable style={styles.deleteRow} onPress={handleDelete}>
            <Text style={styles.deleteRowText}>{t('modal.deleteTransaction')}</Text>
          </Pressable>
        )}
      </ScrollView>

      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={KEYBOARD_ACCESSORY_ID}>
          <FieldNavBar
            canGoPrev={canGoPrev}
            canGoNext={canGoNext}
            onPrev={handlePrevField}
            onNext={handleNextField}
            onDone={handleDoneField}
            doneLabel={t('common.done')}
            colors={colors}
          />
        </InputAccessoryView>
      )}

      <ApplyMerchantSheet
        visible={applySheetVisible}
        count={sameMerchant.length}
        colors={colors}
        onCancel={() => setApplySheetVisible(false)}
        onApply={handleApplySheet}
      />
    </View>
  );
}
