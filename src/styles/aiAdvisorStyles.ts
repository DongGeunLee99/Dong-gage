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
    body: { paddingHorizontal: 20, paddingBottom: 20, gap: 10, flexGrow: 1 },

    introWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40, gap: 14 },
    introIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.lineLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    introText: { fontFamily: LedgerFonts.bodyMedium, fontSize: 14, color: colors.ink2, textAlign: 'center', lineHeight: 20 },
    suggestionWrap: { gap: 8, width: '100%' },
    suggestionChip: {
      backgroundColor: colors.card,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    suggestionText: { fontFamily: LedgerFonts.bodySemiBold, fontSize: 13.5, color: colors.ink2 },

    bubble: { maxWidth: '85%', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14 },
    bubbleUser: { alignSelf: 'flex-end', backgroundColor: colors.ink },
    bubbleModel: { alignSelf: 'flex-start', backgroundColor: colors.card },
    bubbleError: { backgroundColor: colors.lineLight },
    bubbleText: { fontFamily: LedgerFonts.bodyMedium, fontSize: 14, color: colors.ink, lineHeight: 20 },
    bubbleTextUser: { color: colors.bg },

    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 16,
      borderTopWidth: 1,
      borderTopColor: colors.line,
    },
    input: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 11,
      fontFamily: LedgerFonts.bodySemiBold,
      fontSize: 14,
      color: colors.ink,
      maxHeight: 100,
    },
    sendBtn: {
      backgroundColor: colors.ink,
      borderRadius: 14,
      paddingVertical: 11,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendBtnDisabled: { opacity: 0.35 },
    sendBtnText: { fontFamily: LedgerFonts.bodyBold, fontSize: 13.5, color: colors.bg },
  });
}
