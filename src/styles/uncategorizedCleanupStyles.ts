import { StyleSheet } from 'react-native';

import { LedgerColors, LedgerFonts } from '@/constants/ledgerColors';
import type { ColorPalette } from '@/constants/themePalettes';

export function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    sheet: { flex: 1, backgroundColor: colors.bg },
    handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.dashed, alignSelf: 'center', marginTop: 10, marginBottom: 6 },
    sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 12 },
    btnCancel: { fontFamily: LedgerFonts.bodySemiBold, fontSize: 15, color: colors.muted, padding: 4 },
    sheetTitle: { fontFamily: LedgerFonts.bodyBold, fontSize: 16, color: colors.ink },
    headSpacer: { width: 40 },
    body: { paddingHorizontal: 20, paddingBottom: 40 },

    introText: { fontFamily: LedgerFonts.bodyMedium, fontSize: 13.5, color: colors.ink2, lineHeight: 20, marginBottom: 14 },
    emptyText: { fontFamily: LedgerFonts.body, fontSize: 13, color: colors.muted, paddingVertical: 24, textAlign: 'center' },

    section: { marginBottom: 18 },
    sectionTitle: {
      fontFamily: LedgerFonts.bodyBold,
      fontSize: 12,
      color: colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      marginBottom: 8,
      paddingHorizontal: 2,
    },

    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      marginBottom: 10,
      overflow: 'hidden',
    },
    cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
    iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    cardInfo: { flex: 1, gap: 2 },
    memoText: { fontFamily: LedgerFonts.bodySemiBold, fontSize: 14.5, color: colors.ink },
    countText: { fontFamily: LedgerFonts.body, fontSize: 12, color: colors.muted },

    expandedBody: {
      paddingHorizontal: 14,
      paddingBottom: 14,
      gap: 10,
      borderTopWidth: 1,
      borderTopColor: colors.lineLighter,
      paddingTop: 12,
    },
    itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    itemWhen: { flex: 1, fontFamily: LedgerFonts.body, fontSize: 12.5, color: colors.ink2 },
    itemAmt: { fontFamily: LedgerFonts.headingBold, fontSize: 13.5, color: LedgerColors.expense },
    itemAmtIncome: { color: LedgerColors.income },

    applyBtn: {
      backgroundColor: colors.ink,
      borderRadius: 12,
      paddingVertical: 11,
      alignItems: 'center',
      marginTop: 4,
    },
    applyBtnDisabled: { backgroundColor: colors.line },
    applyBtnText: { fontFamily: LedgerFonts.bodyBold, fontSize: 13.5, color: colors.bg },
  });
}
