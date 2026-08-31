import { StyleSheet } from 'react-native';

import { LedgerColors, LedgerFonts } from '@/constants/ledgerColors';
import type { ColorPalette } from '@/constants/themePalettes';

export function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, gap: 22 },
    section: { gap: 8 },
    sectionTitle: {
      fontFamily: LedgerFonts.bodyBold,
      fontSize: 13,
      color: colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      paddingHorizontal: 2,
    },
    groupCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      shadowColor: '#15130F',
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.lineLighter,
    },
    rowLast: { borderBottomWidth: 0 },
    rowName: { fontFamily: LedgerFonts.bodySemiBold, fontSize: 14.5, color: colors.ink },
    rowNameFlex: { flex: 1 },
    mutedText: { color: colors.muted },
    selectedDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
    swatch: { width: 20, height: 20, borderRadius: 10 },
    loginBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.accent },
    loginBtnText: { fontFamily: LedgerFonts.bodyBold, fontSize: 13, color: '#fff' },
    logoutBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.line,
    },
    logoutBtnText: { fontFamily: LedgerFonts.bodyBold, fontSize: 13, color: LedgerColors.expense },
  });
}
