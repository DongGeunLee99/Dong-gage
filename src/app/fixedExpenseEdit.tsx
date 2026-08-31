import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

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
  const existing = editingId ? getFixedExpenseById(editingId) : undefined;
  const isEditing = !!existing;

  const [name, setName] = useState(existing?.name ?? '');
  const [digits, setDigits] = useState(existing ? String(existing.amount) : '');
  const [dayDigits, setDayDigits] = useState(existing ? String(existing.dayOfMonth) : '1');

  const amount = digits ? parseInt(digits, 10) : 0;
  const dayOfMonth = Math.min(31, Math.max(1, dayDigits ? parseInt(dayDigits, 10) : 1));

  const handleAmountChange = (text: string) => {
    setDigits(text.replace(/[^0-9]/g, '').slice(0, MAX_DIGITS));
  };

  const handleDayChange = (text: string) => {
    setDayDigits(text.replace(/[^0-9]/g, '').slice(0, 2));
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName || amount <= 0) {
      router.back();
      return;
    }
    const input = { name: trimmedName, amount, dayOfMonth, on: existing?.on ?? true };
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

        <View style={styles.dayRow}>
          <Text style={styles.dayLabel}>{t('fixedExpenseEdit.dayOfMonth')}</Text>
          <TextInput
            style={styles.dayInput}
            value={String(dayOfMonth)}
            onChangeText={handleDayChange}
            keyboardType="number-pad"
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
