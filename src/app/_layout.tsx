import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold } from '@expo-google-fonts/manrope';
import { SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AuthProvider } from '@/store/auth-context';
import { BudgetsProvider } from '@/store/budgets-context';
import { CategoryPickerBridgeProvider } from '@/store/category-picker-bridge';
import { CategoriesProvider } from '@/store/categories-context';
import { FixedExpensesProvider } from '@/store/fixed-expenses-context';
import { MonthProvider } from '@/store/month-context';
import { SettingsProvider, useSettings } from '@/store/settings-context';
import { TransactionsProvider } from '@/store/transactions-context';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { colors } = useSettings();

  return (
    <AuthProvider>
      <CategoriesProvider>
        <CategoryPickerBridgeProvider>
          <TransactionsProvider>
            <MonthProvider>
              <BudgetsProvider>
                <FixedExpensesProvider>
                  <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="category-picker" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="category-edit" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="budget-edit" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="fixed-expense-edit" options={{ presentation: 'modal' }} />
                  </Stack>
                </FixedExpensesProvider>
              </BudgetsProvider>
            </MonthProvider>
          </TransactionsProvider>
        </CategoryPickerBridgeProvider>
      </CategoriesProvider>
    </AuthProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SettingsProvider>
      <RootLayoutNav />
    </SettingsProvider>
  );
}
