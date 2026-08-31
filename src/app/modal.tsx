import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
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

import { CalendarTabIcon, ChevronDownIcon, ChevronRightIcon, ChevronUpIcon, FixedIcon, PencilIcon } from '@/components/icons';
import { INCOME_CATEGORY_KEY } from '@/constants/categories';
import { LedgerColors } from '@/constants/ledgerColors';
import type { ColorPalette } from '@/constants/themePalettes';
import { formatFullDateWithYear } from '@/i18n/format';
import { useCategories } from '@/store/categoriesContext';
import { useCategoryPickerBridge } from '@/store/categoryPickerBridge';
import { useSettings } from '@/store/settingsContext';
import { formatAmount, parseTags, TODAY, useTransactions, type TransactionType } from '@/store/transactionsContext';
import { createStyles, toggleStyles } from '@/styles/transactionModalStyles';

function ToggleSwitch({ on, onToggle, colors }: { on: boolean; onToggle?: () => void; colors: ColorPalette }) {
  return (
    <Pressable onPress={onToggle} hitSlop={8}>
      <View style={[toggleStyles.track, { backgroundColor: on ? colors.ink : colors.line }]}>
        <View style={[toggleStyles.knob, { left: on ? 18 : 2 }]} />
      </View>
    </Pressable>
  );
}

const MAX_DIGITS = 10;
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
  const { addTransaction, updateTransaction, deleteTransaction, getTransactionById } = useTransactions();
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

  const handleSave = () => {
    if (amount <= 0) {
      router.back();
      return;
    }
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
      excludedFromBudget: type === 'expense' ? excludeFromBudget : undefined,
    };
    if (isEditing && editingId) {
      updateTransaction(editingId, input);
    } else {
      addTransaction(input);
    }
    router.back();
  };

  const handleDelete = () => {
    if (!editingId) return;
    Alert.alert(t('modal.deleteConfirmTitle'), t('modal.deleteConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
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
        <Pressable onPress={() => router.back()}>
          <Text style={styles.btnCancel}>{t('common.cancel')}</Text>
        </Pressable>
        <Text style={styles.sheetTitle}>{isEditing ? t('modal.titleEdit') : t('modal.titleAdd')}</Text>
        <Pressable onPress={handleSave}>
          <Text style={styles.btnSave}>{t('common.save')}</Text>
        </Pressable>
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

        <Pressable style={styles.amountWrap} onPress={() => goToField('amount')}>
          <TextInput
            ref={amountInputRef}
            style={[styles.amountInput, { color: type === 'income' ? LedgerColors.income : LedgerColors.expense }]}
            value={formatAmount(amount)}
            onChangeText={handleAmountChange}
            onFocus={() => setActiveField('amount')}
            keyboardType="number-pad"
            inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
            selectTextOnFocus
          />
          <Text style={styles.amountUnit}>{t('common.won')}</Text>
        </Pressable>

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
        {type === 'expense' && (
          <View style={styles.formCard}>
            <View style={[styles.formRow, styles.formRowLast]}>
              <FixedIcon size={18} color={colors.muted} />
              <Text style={styles.formLabel}>{t('modal.excludeFromBudget')}</Text>
              <ToggleSwitch on={excludeFromBudget} onToggle={() => setExcludeFromBudget((v) => !v)} colors={colors} />
            </View>
          </View>
        )}
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
    </View>
  );
}
