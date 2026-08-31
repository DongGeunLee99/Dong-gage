import { createMaterialTopTabNavigator, type MaterialTopTabNavigationEventMap, type MaterialTopTabNavigationOptions } from '@react-navigation/material-top-tabs';
import type { ParamListBase, TabNavigationState } from '@react-navigation/native';
import { withLayoutContext } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalendarTabIcon, ChartTabIcon, ListTabIcon, SettingsTabIcon, WalletTabIcon } from '@/components/icons';
import { LedgerFonts } from '@/constants/ledger-colors';
import type { ColorPalette } from '@/constants/theme-palettes';
import { useSettings } from '@/store/settings-context';

const { Navigator } = createMaterialTopTabNavigator();

const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useSettings();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <MaterialTopTabs
      screenOptions={{
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.mutedLight,
        tabBarShowIcon: true,
        tabBarStyle: [styles.tabBar, { paddingTop: insets.top, height: insets.top + 56 }],
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarIndicatorStyle: styles.tabIndicator,
        tabBarPressColor: colors.lineLight,
        tabBarScrollEnabled: false,
      }}>
      <MaterialTopTabs.Screen
        name="index"
        options={{
          title: t('tabs.calendar'),
          tabBarIcon: ({ color }) => <CalendarTabIcon color={color} />,
        }}
      />
      <MaterialTopTabs.Screen
        name="list"
        options={{
          title: t('tabs.list'),
          tabBarIcon: ({ color }) => <ListTabIcon color={color} />,
        }}
      />
      <MaterialTopTabs.Screen
        name="dashboard"
        options={{
          title: t('tabs.dashboard'),
          tabBarIcon: ({ color }) => <ChartTabIcon color={color} />,
        }}
      />
      <MaterialTopTabs.Screen
        name="management"
        options={{
          title: t('tabs.management'),
          tabBarIcon: ({ color }) => <WalletTabIcon color={color} />,
        }}
      />
      <MaterialTopTabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color }) => <SettingsTabIcon color={color} />,
        }}
      />
    </MaterialTopTabs>
  );
}

function createStyles(colors: ColorPalette) {
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
