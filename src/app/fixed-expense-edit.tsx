import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { LedgerFonts } from '@/constants/ledger-colors';
import type { ColorPalette } from '@/constants/theme-palettes';
import { useFixedExpenses } from '@/store/fixed-expenses-context';
import { useSettings } from '@/store/settings-context';
import { formatAmount } from '@/store/transactions-context';

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

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    sheet: { flex: 1, backgroundColor: colors.bg },
    handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.dashed, alignSelf: 'center', marginTop: 10, marginBottom: 6 },
    sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 12 },
    btnCancel: { fontFamily: LedgerFonts.bodySemiBold, fontSize: 15, color: colors.muted, padding: 4 },
    btnSave: { fontFamily: LedgerFonts.bodyBold, fontSize: 15, color: colors.ink, padding: 4 },
    sheetTitle: { fontFamily: LedgerFonts.bodyBold, fontSize: 16, color: colors.ink },
    body: { paddingHorizontal: 20, paddingBottom: 32, gap: 18 },
    nameInput: {
      fontFamily: LedgerFonts.headingBold,
      fontSize: 18,
      color: colors.ink,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      paddingVertical: 6,
    },
    amountWrap: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 4, paddingVertical: 4 },
    amountInput: { fontFamily: LedgerFonts.headingBold, fontSize: 36, color: colors.expense, padding: 0, minWidth: 60, textAlign: 'right' },
    amountUnit: { fontFamily: LedgerFonts.bodySemiBold, fontSize: 18, color: colors.muted },
    dayRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingVertical: 13,
      paddingHorizontal: 14,
      shadowColor: '#15130F',
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    dayLabel: { fontFamily: LedgerFonts.bodySemiBold, fontSize: 14, color: colors.ink },
    dayInput: {
      fontFamily: LedgerFonts.headingBold,
      fontSize: 16,
      color: colors.ink,
      minWidth: 40,
      textAlign: 'right',
      padding: 0,
    },
    deleteRow: { alignItems: 'center', paddingVertical: 10 },
    deleteRowText: { fontFamily: LedgerFonts.bodyBold, fontSize: 13.5, color: colors.expense },
  });
}
