import { StyleSheet } from 'react-native';

import { LedgerFonts } from '@/constants/ledgerColors';
import type { ColorPalette } from '@/constants/themePalettes';

export function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.bg,
      paddingHorizontal: 10,
      paddingTop: 10,
      paddingBottom: 24,
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: colors.line,
    },
    row: { flexDirection: 'row', gap: 8 },
    key: {
      flex: 1,
      height: 52,
      borderRadius: 12,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keyText: { fontFamily: LedgerFonts.headingBold, fontSize: 22, color: colors.ink },
    keyOp: { backgroundColor: colors.lineLight },
    keyUtil: { backgroundColor: colors.lineLight },
    keyUtilText: { fontSize: 18, color: colors.muted },
    keyEquals: { backgroundColor: colors.ink },
    keyEqualsText: { color: colors.bg },
    keyDone: { backgroundColor: colors.lineLight },
    keyDoneText: { fontSize: 16 },
  });
}
