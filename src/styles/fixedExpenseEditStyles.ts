import { StyleSheet } from 'react-native';

import { LedgerColors, LedgerFonts } from '@/constants/ledgerColors';
import type { ColorPalette } from '@/constants/themePalettes';

export function createStyles(colors: ColorPalette) {
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
    amountInput: { fontFamily: LedgerFonts.headingBold, fontSize: 36, color: LedgerColors.expense, padding: 0, minWidth: 60, textAlign: 'right' },
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
    deleteRowText: { fontFamily: LedgerFonts.bodyBold, fontSize: 13.5, color: LedgerColors.expense },
  });
}
