import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { createStyles } from '@/styles/budgetEditStyles';
import { useBudgets } from '@/store/budgetsContext';
import { useCategories } from '@/store/categoriesContext';
import { useSettings } from '@/store/settingsContext';
import { formatAmount } from '@/store/transactionsContext';

const MAX_DIGITS = 10;

export default function BudgetEditModal() {
  const { t } = useTranslation();
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { target, key } = useLocalSearchParams<{ target?: string; key?: string }>();
  const { overallBudget, setOverallBudget, categoryBudgets, setCategoryBudget, removeCategoryBudget } = useBudgets();
  const { categories, getCategoryMeta } = useCategories();

  const isOverall = target === 'overall';
  const isNew = target === 'new';
  const editingKey = typeof key === 'string' ? key : undefined;

  const initialAmount = isOverall ? overallBudget : editingKey ? (categoryBudgets[editingKey] ?? 0) : 0;
  const [digits, setDigits] = useState(initialAmount ? String(initialAmount) : '');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | undefined>(editingKey);
  const [step, setStep] = useState<'pick' | 'amount'>(isNew ? 'pick' : 'amount');

  const amount = digits ? parseInt(digits, 10) : 0;
  const availableCategories = useMemo(
    () => categories.filter((c) => !(c.key in categoryBudgets)),
    [categories, categoryBudgets],
  );

  const handleAmountChange = (text: string) => {
    setDigits(text.replace(/[^0-9]/g, '').slice(0, MAX_DIGITS));
  };

  const handlePickCategory = (categoryKey: string) => {
    setSelectedCategoryKey(categoryKey);
    setStep('amount');
  };

  const handleSave = () => {
    if (isOverall) {
      setOverallBudget(amount);
    } else if (selectedCategoryKey) {
      setCategoryBudget(selectedCategoryKey, amount);
    }
    router.back();
  };

  const handleDelete = () => {
    if (!editingKey) return;
    Alert.alert(t('budgetEdit.deleteConfirmTitle'), t('budgetEdit.deleteConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          removeCategoryBudget(editingKey);
          router.back();
        },
      },
    ]);
  };

  const title = isOverall ? t('budgetEdit.titleOverall') : isNew ? t('budgetEdit.titleNew') : t('budgetEdit.titleCategory');
  const selectedMeta = selectedCategoryKey ? getCategoryMeta(selectedCategoryKey) : undefined;

  return (
    <View style={styles.sheet}>
      <View style={styles.handle} />
      <View style={styles.sheetHead}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.btnCancel}>{t('common.cancel')}</Text>
        </Pressable>
        <Text style={styles.sheetTitle}>{title}</Text>
        {step === 'amount' ? (
          <Pressable onPress={handleSave}>
            <Text style={styles.btnSave}>{t('common.save')}</Text>
          </Pressable>
        ) : (
          <View style={styles.headSpacer} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {step === 'pick' && (
          <>
            {availableCategories.length === 0 && <Text style={styles.emptyText}>{t('budgetEdit.noCategoriesLeft')}</Text>}
            {availableCategories.map((cat) => {
              const meta = getCategoryMeta(cat.key);
              return (
                <Pressable key={cat.key} style={styles.row} onPress={() => handlePickCategory(cat.key)}>
                  <View style={[styles.iconCircle, { backgroundColor: meta.color }]}>
                    <meta.Icon size={20} />
                  </View>
                  <Text style={styles.rowName}>{meta.name}</Text>
                </Pressable>
              );
            })}
          </>
        )}

        {step === 'amount' && (
          <>
            {selectedMeta && (
              <View style={styles.previewRow}>
                <View style={[styles.iconCircle, { backgroundColor: selectedMeta.color }]}>
                  <selectedMeta.Icon size={20} />
                </View>
                <Text style={styles.rowName}>{selectedMeta.name}</Text>
              </View>
            )}
            <View style={styles.amountWrap}>
              <TextInput
                style={styles.amountInput}
                value={formatAmount(amount)}
                onChangeText={handleAmountChange}
                keyboardType="number-pad"
                selectTextOnFocus
                autoFocus
              />
              <Text style={styles.amountUnit}>{t('common.won')}</Text>
            </View>
            {!isOverall && editingKey && (
              <Pressable style={styles.deleteRow} onPress={handleDelete}>
                <Text style={styles.deleteRowText}>{t('budgetEdit.deleteBudget')}</Text>
              </Pressable>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
