import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons';
import { useCategories } from '@/store/categoriesContext';
import { useCategoryPickerBridge } from '@/store/categoryPickerBridge';
import { useFixedExpenses } from '@/store/fixedExpensesContext';
import { useSettings } from '@/store/settingsContext';
import { formatAmount } from '@/store/transactionsContext';
import { createStyles } from '@/styles/fixedExpenseEditStyles';

const MAX_DIGITS = 10;

export default function FixedExpenseEditModal() {
  const { t } = useTranslation();
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingId = typeof id === 'string' ? id : undefined;
  const { getFixedExpenseById, addFixedExpense, updateFixedExpense, deleteFixedExpense } = useFixedExpenses();
  const { categories, getCategoryMeta } = useCategories();
  const { result: pickerResult, setResult: setPickerResult } = useCategoryPickerBridge();
  const existing = editingId ? getFixedExpenseById(editingId) : undefined;
  const isEditing = !!existing;

  const [name, setName] = useState(existing?.name ?? '');
  const [digits, setDigits] = useState(existing ? String(existing.amount) : '');
  const [dayDigits, setDayDigits] = useState(existing?.expectedDay ? String(existing.expectedDay) : '');
  const [categoryKey, setCategoryKey] = useState<string>(existing?.categoryKey ?? categories[0]?.key ?? '');
  const [subcategory, setSubcategory] = useState<string | undefined>(existing?.subcategory);
  const [merchantName, setMerchantName] = useState(existing?.merchantName ?? '');

  const amount = digits ? parseInt(digits, 10) : 0;
  const expectedDay = dayDigits ? Math.min(31, Math.max(1, parseInt(dayDigits, 10))) : undefined;
  const categoryMeta = categoryKey ? getCategoryMeta(categoryKey) : undefined;

  useEffect(() => {
    if (!pickerResult) return;
    setCategoryKey(pickerResult.categoryKey);
    setSubcategory(pickerResult.subcategory);
    setPickerResult(null);
  }, [pickerResult, setPickerResult]);

  const handleAmountChange = (text: string) => {
    setDigits(text.replace(/[^0-9]/g, '').slice(0, MAX_DIGITS));
  };

  const handleDayChange = (text: string) => {
    setDayDigits(text.replace(/[^0-9]/g, '').slice(0, 2));
  };

  const openCategoryPicker = () => {
    router.push({ pathname: '/categoryPicker', params: { current: categoryKey, currentSub: subcategory ?? '' } });
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName || amount <= 0 || !categoryKey) {
      router.back();
      return;
    }
    const input = {
      name: trimmedName,
      amount,
      categoryKey,
      subcategory,
      merchantName: merchantName.trim() || undefined,
      expectedDay,
      on: existing?.on ?? true,
    };
    if (isEditing && editingId) {
      updateFixedExpense(editingId, input);
    } else {
      addFixedExpense(input);
    }
    router.back();
  };

  const handleDelete = () => {
    if (!editingId) return;
    Alert.alert(t('fixedExpenseEdit.deleteConfirmTitle'), t('fixedExpenseEdit.deleteConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          deleteFixedExpense(editingId);
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
        <Text style={styles.sheetTitle}>{isEditing ? t('fixedExpenseEdit.titleEdit') : t('fixedExpenseEdit.titleAdd')}</Text>
        <Pressable onPress={handleSave}>
          <Text style={styles.btnSave}>{t('common.save')}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.nameInput}
          placeholder={t('fixedExpenseEdit.namePlaceholder')}
          placeholderTextColor={colors.mutedLight}
          value={name}
          onChangeText={setName}
        />

        <View style={styles.amountWrap}>
          <TextInput
            style={styles.amountInput}
            value={formatAmount(amount)}
            onChangeText={handleAmountChange}
            keyboardType="number-pad"
            selectTextOnFocus
          />
          <Text style={styles.amountUnit}>{t('common.won')}</Text>
        </View>

        <Pressable style={styles.categoryRow} onPress={openCategoryPicker}>
          {categoryMeta && (
            <View style={[styles.categoryIconSq, { backgroundColor: categoryMeta.color }]}>
              <categoryMeta.Icon size={16} />
            </View>
          )}
          <Text style={styles.categoryText}>
            {categoryMeta ? (subcategory ? `${categoryMeta.name} · ${subcategory}` : categoryMeta.name) : t('budgetEdit.chooseCategory')}
          </Text>
          <ChevronRightIcon size={14} color={colors.dashed} />
        </Pressable>

        <View style={styles.dayRow}>
          <Text style={styles.dayLabel}>{t('fixedExpenseEdit.merchantName')}</Text>
          <TextInput
            style={styles.merchantInput}
            value={merchantName}
            onChangeText={setMerchantName}
            placeholder={t('fixedExpenseEdit.merchantNamePlaceholder')}
            placeholderTextColor={colors.mutedLight}
            returnKeyType="done"
          />
        </View>
        <Text style={styles.fieldHint}>{t('fixedExpenseEdit.merchantNameHint')}</Text>

        <View style={styles.dayRow}>
          <Text style={styles.dayLabel}>{t('fixedExpenseEdit.expectedDay')}</Text>
          <TextInput
            style={styles.dayInput}
            value={dayDigits}
            onChangeText={handleDayChange}
            keyboardType="number-pad"
            placeholder="-"
            placeholderTextColor={colors.mutedLight}
            selectTextOnFocus
          />
        </View>

        {isEditing && (
          <Pressable style={styles.deleteRow} onPress={handleDelete}>
            <Text style={styles.deleteRowText}>{t('fixedExpenseEdit.deleteFixedExpense')}</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
