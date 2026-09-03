import { createMaterialTopTabNavigator, type MaterialTopTabNavigationEventMap, type MaterialTopTabNavigationOptions } from '@react-navigation/material-top-tabs';
import type { ParamListBase, TabNavigationState } from '@react-navigation/native';
import { withLayoutContext } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalendarTabIcon, ChartTabIcon, ListTabIcon, WalletTabIcon } from '@/components/icons';
import { useSettings } from '@/store/settingsContext';
import { createStyles } from '@/styles/tabsLayoutStyles';

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
    <View style={styles.root}>
      <MaterialTopTabs
        screenOptions={{
          tabBarActiveTintColor: colors.ink,
          tabBarInactiveTintColor: colors.mutedLight,
          tabBarShowIcon: true,
          tabBarShowLabel: false,
          tabBarStyle: [styles.tabBar, { paddingTop: insets.top, height: insets.top + 46 }],
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
      </MaterialTopTabs>
    </View>
  );
}
