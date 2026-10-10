import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, Text, View } from 'react-native';

import { CheckIcon } from '@/components/icons';
import type { ColorPalette } from '@/constants/themePalettes';
import { createStyles } from '@/styles/applyMerchantSheetStyles';

type ApplyMerchantSheetProps = {
  visible: boolean;
  count: number;
  colors: ColorPalette;
  onCancel: () => void;
  onApply: (selection: { category: boolean; note: boolean }) => void;
};

/** 같은 상호명 거래 일괄 적용 — 카테고리/메모·태그를 체크박스로 골라 적용하는 바텀시트. */
export function ApplyMerchantSheet({ visible, count, colors, onCancel, onApply }: ApplyMerchantSheetProps) {
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [applyCategory, setApplyCategory] = useState(true);
  const [applyNote, setApplyNote] = useState(true);

  // 열릴 때마다 기본값(둘 다 체크)으로 초기화.
  useEffect(() => {
    if (visible) {
      setApplyCategory(true);
      setApplyNote(true);
    }
  }, [visible]);

  const canApply = applyCategory || applyNote;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>{t('modal.applySameMerchantTitle', { count })}</Text>
          <Text style={styles.subtitle}>{t('modal.applySameMerchantBody')}</Text>

          <Pressable style={styles.row} onPress={() => setApplyCategory((v) => !v)}>
            <View style={[styles.checkbox, applyCategory && styles.checkboxOn]}>
              {applyCategory && <CheckIcon size={16} color={colors.bg} />}
            </View>
            <Text style={styles.rowLabel}>{t('modal.applyFieldCategory')}</Text>
          </Pressable>

          <Pressable style={styles.row} onPress={() => setApplyNote((v) => !v)}>
            <View style={[styles.checkbox, applyNote && styles.checkboxOn]}>
              {applyNote && <CheckIcon size={16} color={colors.bg} />}
            </View>
            <Text style={styles.rowLabel}>{t('modal.applyFieldNote')}</Text>
          </Pressable>

          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              style={[styles.applyBtn, !canApply && styles.applyBtnDisabled]}
              onPress={() => onApply({ category: applyCategory, note: applyNote })}
              disabled={!canApply}>
              <Text style={styles.applyText}>{t('common.done')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
