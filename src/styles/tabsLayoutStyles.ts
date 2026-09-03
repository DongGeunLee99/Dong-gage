import { StyleSheet } from 'react-native';

import type { ColorPalette } from '@/constants/themePalettes';

export function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    tabBar: {
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.lineLight,
      shadowOpacity: 0,
      elevation: 0,
    },
    tabItem: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabIndicator: {
      backgroundColor: colors.accent,
      height: 2.5,
    },
  });
}
