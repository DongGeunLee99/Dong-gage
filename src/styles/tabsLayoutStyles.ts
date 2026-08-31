import { StyleSheet } from 'react-native';

import { LedgerFonts } from '@/constants/ledgerColors';
import type { ColorPalette } from '@/constants/themePalettes';

export function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    tabBar: {
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.lineLight,
      shadowOpacity: 0,
      elevation: 0,
    },
    tabItem: {
      paddingTop: 4,
      paddingBottom: 8,
    },
    tabLabel: {
      fontFamily: LedgerFonts.bodySemiBold,
      fontSize: 10,
      textTransform: 'none',
      marginTop: 2,
    },
    tabIndicator: {
      backgroundColor: colors.accent,
      height: 2.5,
    },
  });
}
