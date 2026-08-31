import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold } from '@expo-google-fonts/manrope';
import { SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AuthProvider } from '@/store/authContext';
import { BudgetsProvider } from '@/store/budgetsContext';
import { CategoryPickerBridgeProvider } from '@/store/categoryPickerBridge';
import { CategoriesProvider } from '@/store/categoriesContext';
import { FixedExpensesProvider } from '@/store/fixedExpensesContext';
import { MonthProvider } from '@/store/monthContext';
import { SettingsProvider, useSettings } from '@/store/settingsContext';
import { TransactionsProvider } from '@/store/transactionsContext';

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
                    <Stack.Screen name="categoryPicker" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="categoryEdit" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="budgetEdit" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="fixedExpenseEdit" options={{ presentation: 'modal' }} />
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
