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

    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 14,
      marginBottom: 12,
      gap: 12,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    cardInfo: { flex: 1 },
    merchant: { fontFamily: LedgerFonts.bodySemiBold, fontSize: 14.5, color: colors.ink },
    merchantInput: {
      fontFamily: LedgerFonts.bodySemiBold,
      fontSize: 14.5,
      color: colors.ink,
      backgroundColor: colors.lineLight,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    when: { fontFamily: LedgerFonts.body, fontSize: 11.5, color: colors.muted, marginTop: 2 },
    amount: { fontFamily: LedgerFonts.headingBold, fontSize: 15, color: colors.ink },
    amountIncome: { color: LedgerColors.income },

    categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    categoryLabel: { fontFamily: LedgerFonts.body, fontSize: 11.5, color: colors.muted },
    categoryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.lineLight,
      borderRadius: 10,
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    categoryDot: { width: 10, height: 10, borderRadius: 5 },
    categoryBtnText: { fontFamily: LedgerFonts.bodySemiBold, fontSize: 12.5, color: colors.ink },
    guessTag: { fontFamily: LedgerFonts.body, fontSize: 11, color: colors.mutedLight },

    actions: { flexDirection: 'row', gap: 8 },
    approveBtn: {
      flex: 1,
      backgroundColor: colors.ink,
      borderRadius: 12,
      paddingVertical: 11,
      alignItems: 'center',
    },
    approveBtnText: { fontFamily: LedgerFonts.bodyBold, fontSize: 13.5, color: colors.bg },
    rejectBtn: {
      paddingHorizontal: 16,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
      backgroundColor: colors.lineLight,
    },
    rejectBtnText: { fontFamily: LedgerFonts.bodyBold, fontSize: 13.5, color: colors.muted },
  });
}
