import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { ChevronDownIcon, ChevronRightIcon } from '@/components/icons';
import type { Category } from '@/constants/categories';
import { useCategories } from '@/store/categoriesContext';
import { useCategoryPickerBridge } from '@/store/categoryPickerBridge';
import { useSettings } from '@/store/settingsContext';
import { createStyles } from '@/styles/categoryPickerStyles';

export default function CategoryPickerModal() {
  const { t } = useTranslation();
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { current, currentSub } = useLocalSearchParams<{ current?: string; currentSub?: string }>();
  const { categories, getCategoryMeta, updateCategory } = useCategories();
  const { setResult } = useCategoryPickerBridge();
  const [expandedKey, setExpandedKey] = useState<string | null>(current && typeof current === 'string' ? current : null);
  const [newSub, setNewSub] = useState('');

  const handleRowPress = (key: string, hasSubcategories: boolean) => {
    if (!hasSubcategories) {
      setResult({ categoryKey: key });
      router.back();
      return;
    }
    setNewSub('');
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  const handlePickSubcategory = (categoryKey: string, subcategory?: string) => {
    setResult({ categoryKey, subcategory });
    router.back();
  };

  // 소분류 즉석 추가: 카테고리의 subcategories에 append해서 Supabase에 반영(categoryEdit과 동일 경로) 후 바로 선택.
  const handleAddSubcategory = (cat: Category) => {
    const name = newSub.trim();
    if (!name) return;
    if (!cat.subcategories.includes(name)) {
      updateCategory(cat.key, {
        name: cat.name,
        colorId: cat.colorId,
        iconId: cat.iconId,
        subcategories: [...cat.subcategories, name],
      });
    }
    setNewSub('');
    handlePickSubcategory(cat.key, name);
  };

  return (
    <View style={styles.sheet}>
      <View style={styles.handle} />
      <View style={styles.sheetHead}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.btnCancel}>{t('common.cancel')}</Text>
        </Pressable>
        <Text style={styles.sheetTitle}>{t('categoryPicker.title')}</Text>
        <View style={styles.headSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {categories.map((cat: Category) => {
          const meta = getCategoryMeta(cat.key);
          const selected = cat.key === current;
          const hasSubcategories = cat.subcategories.length > 0;
          const expanded = expandedKey === cat.key;
          return (
            <View key={cat.key} style={[styles.card, selected && styles.cardSelected]}>
              <Pressable style={styles.row} onPress={() => handleRowPress(cat.key, hasSubcategories)}>
                <View style={[styles.iconCircle, { backgroundColor: meta.color }]}>
                  <meta.Icon size={20} />
                </View>
                <Text style={styles.rowName}>{meta.name}</Text>
                {hasSubcategories &&
                  (expanded ? (
                    <ChevronDownIcon size={16} color={colors.muted} />
                  ) : (
                    <ChevronRightIcon size={16} color={colors.muted} />
                  ))}
              </Pressable>
              {expanded && (
                <>
                  <View style={styles.chipWrap}>
                    <Pressable
                      style={[styles.chip, !currentSub && selected && styles.chipSelected]}
                      onPress={() => handlePickSubcategory(cat.key, undefined)}>
                      <Text style={[styles.chipText, !currentSub && selected && styles.chipTextSelected]}>
                        {t('common.unspecified')}
                      </Text>
                    </Pressable>
                    {cat.subcategories.map((sub) => {
                      const subSelected = selected && sub === currentSub;
                      return (
                        <Pressable
                          key={sub}
                          style={[styles.chip, subSelected && styles.chipSelected]}
                          onPress={() => handlePickSubcategory(cat.key, sub)}>
                          <Text style={[styles.chipText, subSelected && styles.chipTextSelected]}>{sub}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <View style={styles.addSubRow}>
                    <TextInput
                      style={styles.addSubInput}
                      placeholder={t('categoryEdit.subcategoryPlaceholder')}
                      placeholderTextColor={colors.mutedLight}
                      value={newSub}
                      onChangeText={setNewSub}
                      onSubmitEditing={() => handleAddSubcategory(cat)}
                      returnKeyType="done"
                    />
                    <Pressable style={styles.addSubBtn} onPress={() => handleAddSubcategory(cat)}>
                      <Text style={styles.addSubBtnText}>{t('common.add')}</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
