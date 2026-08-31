import { StyleSheet } from 'react-native';

import { LedgerFonts } from '@/constants/ledgerColors';
import type { ColorPalette } from '@/constants/themePalettes';

export function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    sheet: { flex: 1, backgroundColor: colors.bg },
    handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.dashed, alignSelf: 'center', marginTop: 10, marginBottom: 6 },
    sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 12 },
    btnCancel: { fontFamily: LedgerFonts.bodySemiBold, fontSize: 15, color: colors.muted, padding: 4 },
    btnSave: { fontFamily: LedgerFonts.bodyBold, fontSize: 15, color: colors.ink, padding: 4 },
    sheetTitle: { fontFamily: LedgerFonts.bodyBold, fontSize: 16, color: colors.ink },
    headSpacer: { width: 40 },
    body: { paddingHorizontal: 20, paddingBottom: 32, gap: 8 },
    emptyText: { fontFamily: LedgerFonts.body, fontSize: 13, color: colors.muted, textAlign: 'center', paddingTop: 24 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 12,
      shadowColor: '#15130F',
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    previewRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 8 },
    iconCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    rowName: { flex: 1, fontFamily: LedgerFonts.bodySemiBold, fontSize: 14.5, color: colors.ink },
    amountWrap: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 4, paddingVertical: 16 },
    amountInput: { fontFamily: LedgerFonts.headingBold, fontSize: 36, color: colors.ink, padding: 0, minWidth: 60, textAlign: 'right' },
    amountUnit: { fontFamily: LedgerFonts.bodySemiBold, fontSize: 18, color: colors.muted },
    deleteRow: { alignItems: 'center', paddingVertical: 10 },
    deleteRowText: { fontFamily: LedgerFonts.bodyBold, fontSize: 13.5, color: colors.expense },
  });
}
