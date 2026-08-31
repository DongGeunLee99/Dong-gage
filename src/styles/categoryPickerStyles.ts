import { StyleSheet } from 'react-native';

import { LedgerFonts } from '@/constants/ledgerColors';
import type { ColorPalette } from '@/constants/themePalettes';

export function createStyles(colors: ColorPalette) {
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
