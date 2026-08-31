import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { COLOR_OPTIONS, getColorHex, getIconComponent, ICON_OPTIONS } from '@/constants/categories';
import { LedgerFonts } from '@/constants/ledger-colors';
import type { ColorPalette } from '@/constants/theme-palettes';
import { useCategories } from '@/store/categories-context';
import { useSettings } from '@/store/settings-context';

export default function CategoryEditModal() {
  const { t } = useTranslation();
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingKey = typeof id === 'string' ? id : undefined;
  const { getCategoryById, addCategory, updateCategory, deleteCategory } = useCategories();
  const existing = editingKey ? getCategoryById(editingKey) : undefined;
  const isEditing = !!existing;

  const [name, setName] = useState(existing?.name ?? '');
  const [iconId, setIconId] = useState(existing?.iconId ?? ICON_OPTIONS[0].id);
  const [colorId, setColorId] = useState(existing?.colorId ?? COLOR_OPTIONS[0].id);
  const [subcategories, setSubcategories] = useState<string[]>(existing?.subcategories ?? []);
  const [subInput, setSubInput] = useState('');

  const PreviewIcon = getIconComponent(iconId);

  const handleAddSub = () => {
    const trimmed = subInput.trim();
    if (!trimmed || subcategories.includes(trimmed)) {
      setSubInput('');
      return;
    }
    setSubcategories((prev) => [...prev, trimmed]);
    setSubInput('');
  };

  const handleRemoveSub = (sub: string) => {
    setSubcategories((prev) => prev.filter((s) => s !== sub));
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      router.back();
      return;
    }
    const input = { name: trimmedName, colorId, iconId, subcategories };
    if (isEditing && editingKey) {
      updateCategory(editingKey, input);
    } else {
      addCategory(input);
    }
    router.back();
  };

  const handleDelete = () => {
    if (!editingKey) return;
    Alert.alert(t('categoryEdit.deleteConfirmTitle'), t('categoryEdit.deleteConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          deleteCategory(editingKey);
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
        <Text style={styles.sheetTitle}>{isEditing ? t('categoryEdit.titleEdit') : t('categoryEdit.titleAdd')}</Text>
        <Pressable onPress={handleSave}>
          <Text style={styles.btnSave}>{t('common.save')}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.previewRow}>
          <View style={[styles.previewCircle, { backgroundColor: getColorHex(colorId) }]}>
            <PreviewIcon size={22} />
          </View>
          <TextInput
            style={styles.nameInput}
            placeholder={t('categoryEdit.namePlaceholder')}
            placeholderTextColor={colors.mutedLight}
            value={name}
            onChangeText={setName}
          />
        </View>

        <Text style={styles.sectionLabel}>{t('categoryEdit.icon')}</Text>
        <View style={styles.paletteRow}>
          {ICON_OPTIONS.map((opt) => (
            <Pressable
              key={opt.id}
              style={[styles.paletteIconBtn, iconId === opt.id && styles.paletteIconBtnSelected]}
              onPress={() => setIconId(opt.id)}>
              <opt.Icon size={20} color={colors.ink} />
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>{t('categoryEdit.color')}</Text>
        <View style={styles.paletteRow}>
          {COLOR_OPTIONS.map((opt) => (
            <Pressable
              key={opt.id}
              style={[styles.colorSwatch, { backgroundColor: opt.hex }, colorId === opt.id && styles.colorSwatchSelected]}
              onPress={() => setColorId(opt.id)}
            />
          ))}
        </View>

        <Text style={styles.sectionLabel}>{t('categoryEdit.subcategory')}</Text>
        <View style={styles.subInputRow}>
          <TextInput
            style={styles.subInput}
            placeholder={t('categoryEdit.subcategoryPlaceholder')}
            placeholderTextColor={colors.mutedLight}
            value={subInput}
            onChangeText={setSubInput}
            onSubmitEditing={handleAddSub}
            returnKeyType="done"
          />
          <Pressable style={styles.subAddBtn} onPress={handleAddSub}>
            <Text style={styles.subAddBtnText}>{t('common.add')}</Text>
          </Pressable>
        </View>
        {subcategories.length > 0 && (
          <View style={styles.subChipWrap}>
            {subcategories.map((sub) => (
              <View key={sub} style={styles.subChip}>
                <Text style={styles.subChipText}>{sub}</Text>
                <Pressable onPress={() => handleRemoveSub(sub)} hitSlop={8}>
                  <Text style={styles.subChipRemove}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {isEditing && (
          <Pressable style={styles.deleteRow} onPress={handleDelete}>
            <Text style={styles.deleteRowText}>{t('categoryEdit.deleteCategory')}</Text>
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
    previewRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    previewCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
    nameInput: {
      flex: 1,
      fontFamily: LedgerFonts.headingBold,
      fontSize: 18,
      color: colors.ink,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      paddingVertical: 6,
    },
    sectionLabel: {
      fontFamily: LedgerFonts.bodyBold,
      fontSize: 12.5,
      color: colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      marginBottom: -8,
    },
    paletteRow: { flexDirection: 'row', gap: 12 },
    paletteIconBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.lineLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    paletteIconBtnSelected: { borderWidth: 2, borderColor: colors.ink },
    colorSwatch: { width: 36, height: 36, borderRadius: 18 },
    colorSwatchSelected: { borderWidth: 3, borderColor: colors.ink },
    subInputRow: { flexDirection: 'row', gap: 8 },
    subInput: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 11,
      fontFamily: LedgerFonts.bodySemiBold,
      fontSize: 14,
      color: colors.ink,
      shadowColor: '#15130F',
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    subAddBtn: {
      paddingHorizontal: 18,
      borderRadius: 12,
      backgroundColor: colors.ink,
      alignItems: 'center',
      justifyContent: 'center',
    },
    subAddBtnText: { fontFamily: LedgerFonts.bodyBold, fontSize: 13.5, color: '#fff' },
    subChipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: -8 },
    subChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.lineLight,
      borderRadius: 14,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    subChipText: { fontFamily: LedgerFonts.bodySemiBold, fontSize: 13, color: colors.ink },
    subChipRemove: { fontFamily: LedgerFonts.bodyBold, fontSize: 15, color: colors.muted },
    deleteRow: { alignItems: 'center', paddingVertical: 10 },
    deleteRowText: { fontFamily: LedgerFonts.bodyBold, fontSize: 13.5, color: colors.expense },
  });
}
