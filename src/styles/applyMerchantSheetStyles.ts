import { StyleSheet } from 'react-native';

import { LedgerFonts } from '@/constants/ledgerColors';
import type { ColorPalette } from '@/constants/themePalettes';

export function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    sheet: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: colors.bg,
      borderRadius: 22,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 20,
      gap: 12,
      shadowColor: '#15130F',
      shadowOpacity: 0.18,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    title: { fontFamily: LedgerFonts.headingBold, fontSize: 16, color: colors.ink },
    subtitle: { fontFamily: LedgerFonts.body, fontSize: 13, color: colors.muted, marginBottom: 4 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 7,
      borderWidth: 1.6,
      borderColor: colors.line,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxOn: { backgroundColor: colors.ink, borderColor: colors.ink },
    rowLabel: { fontFamily: LedgerFonts.bodySemiBold, fontSize: 15, color: colors.ink },
    actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
    cancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 12, backgroundColor: colors.lineLight },
    cancelText: { fontFamily: LedgerFonts.bodyBold, fontSize: 14, color: colors.ink },
    applyBtn: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 12, backgroundColor: colors.ink },
    applyBtnDisabled: { opacity: 0.4 },
    applyText: { fontFamily: LedgerFonts.bodyBold, fontSize: 14, color: colors.bg },
  });
}
