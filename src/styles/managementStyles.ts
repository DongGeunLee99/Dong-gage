import { StyleSheet } from 'react-native';

import { LedgerFonts } from '@/constants/ledgerColors';
import type { ColorPalette } from '@/constants/themePalettes';

export const toggleStyles = StyleSheet.create({
  track: { width: 38, height: 22, borderRadius: 11 },
  knob: {
    position: 'absolute',
    top: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
});

export function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, gap: 22 },
    section: { gap: 8 },
    sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
    sectionTitle: {
      fontFamily: LedgerFonts.bodyBold,
      fontSize: 13,
      color: colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    addLink: { fontFamily: LedgerFonts.bodyBold, fontSize: 13, color: colors.income },
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
      paddingVertical: 13,
      paddingHorizontal: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.lineLighter,
    },
    rowLast: { borderBottomWidth: 0 },
    iconSq: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    rowMid: { flex: 1, gap: 2 },
    rowName: { fontFamily: LedgerFonts.bodySemiBold, fontSize: 14.5, color: colors.ink },
    rowSub: { fontFamily: LedgerFonts.body, fontSize: 12, color: colors.muted },
    rowAmtExpense: { fontFamily: LedgerFonts.headingBold, fontSize: 14, color: colors.expense },
    rowAmtNeutral: { fontFamily: LedgerFonts.headingBold, fontSize: 14, color: colors.ink },
  });
}
