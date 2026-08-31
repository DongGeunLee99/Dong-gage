import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChevronDownIcon, ChevronRightIcon } from '@/components/icons';
import { LedgerFonts } from '@/constants/ledger-colors';
import type { ColorPalette } from '@/constants/theme-palettes';
import type { Category } from '@/constants/categories';
import { useCategories } from '@/store/categories-context';
import { useCategoryPickerBridge } from '@/store/category-picker-bridge';
import { useSettings } from '@/store/settings-context';

export default function CategoryPickerModal() {
  const { t } = useTranslation();
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { current, currentSub } = useLocalSearchParams<{ current?: string; currentSub?: string }>();
  const { categories, getCategoryMeta } = useCategories();
  const { setResult } = useCategoryPickerBridge();
  const [expandedKey, setExpandedKey] = useState<string | null>(current && typeof current === 'string' ? current : null);

  const handleRowPress = (key: string, hasSubcategories: boolean) => {
    if (!hasSubcategories) {
      setResult({ categoryKey: key });
      router.back();
      return;
    }
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  const handlePickSubcategory = (categoryKey: string, subcategory?: string) => {
    setResult({ categoryKey, subcategory });
    router.back();
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
              )}
            </View>
          );
        })}
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
    sheetTitle: { fontFamily: LedgerFonts.bodyBold, fontSize: 16, color: colors.ink },
    headSpacer: { width: 40 },
    body: { paddingHorizontal: 20, paddingBottom: 32, gap: 8 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      shadowColor: '#15130F',
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
      overflow: 'hidden',
    },
    cardSelected: { borderWidth: 1.5, borderColor: colors.ink },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
    iconCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    rowName: { flex: 1, fontFamily: LedgerFonts.bodySemiBold, fontSize: 14.5, color: colors.ink },
    chipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingHorizontal: 12,
      paddingBottom: 12,
      paddingTop: 2,
    },
    chip: {
      backgroundColor: colors.lineLight,
      borderRadius: 14,
      paddingVertical: 7,
      paddingHorizontal: 13,
    },
    chipSelected: { backgroundColor: colors.ink },
    chipText: { fontFamily: LedgerFonts.bodySemiBold, fontSize: 13, color: colors.ink2 },
    chipTextSelected: { color: colors.bg },
  });
}
