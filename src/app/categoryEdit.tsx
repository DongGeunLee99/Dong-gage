import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { COLOR_OPTIONS, getColorHex, getIconComponent, ICON_OPTIONS } from '@/constants/categories';
import { useCategories } from '@/store/categoriesContext';
import { useSettings } from '@/store/settingsContext';
import { createStyles } from '@/styles/categoryEditStyles';

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
