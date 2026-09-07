import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/authContext';

type BudgetsContextValue = {
  overallBudget: number;
  setOverallBudget: (amount: number) => void;
  categoryBudgets: Record<string, number>;
  setCategoryBudget: (categoryKey: string, amount: number) => void;
  removeCategoryBudget: (categoryKey: string) => void;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

const BudgetsContext = createContext<BudgetsContextValue | null>(null);

async function loadBudgets(userId: string) {
  const [{ data: budgetRow, error: budgetError }, { data: categoryRows, error: categoryError }] = await Promise.all([
    supabase.from('budgets').select('overall_budget').eq('user_id', userId).maybeSingle(),
    supabase.from('category_budgets').select('category_key, amount').eq('user_id', userId),
  ]);
  if (budgetError) console.warn('Failed to load budget', budgetError);
  if (categoryError) console.warn('Failed to load category budgets', categoryError);

  const categoryBudgets: Record<string, number> = {};
  for (const row of categoryRows ?? []) categoryBudgets[row.category_key] = row.amount;

  return { overallBudget: budgetRow?.overall_budget ?? 0, categoryBudgets };
}

export function BudgetsProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [overallBudget, setOverallBudgetState] = useState(0);
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setOverallBudgetState(0);
      setCategoryBudgets({});
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    loadBudgets(userId).then((next) => {
      if (cancelled) return;
      setOverallBudgetState(next.overallBudget);
      setCategoryBudgets(next.categoryBudgets);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const setOverallBudget = useCallback(
    (amount: number) => {
      if (!userId) return;
      setOverallBudgetState(amount);
      supabase
        .from('budgets')
        .upsert({ user_id: userId, overall_budget: amount })
        .then(({ error }) => {
          if (error) console.warn('Failed to save overall budget', error);
        });
    },
    [userId],
  );

  const setCategoryBudget = useCallback(
    (categoryKey: string, amount: number) => {
      if (!userId) return;
      setCategoryBudgets((prev) => ({ ...prev, [categoryKey]: amount }));
      supabase
        .from('category_budgets')
        .upsert({ user_id: userId, category_key: categoryKey, amount })
        .then(({ error }) => {
          if (error) console.warn('Failed to save category budget', error);
        });
    },
    [userId],
  );

  const removeCategoryBudget = useCallback(
    (categoryKey: string) => {
      if (!userId) return;
      setCategoryBudgets((prev) => {
        const next = { ...prev };
        delete next[categoryKey];
        return next;
      });
      supabase
        .from('category_budgets')
        .delete()
        .eq('user_id', userId)
        .eq('category_key', categoryKey)
        .then(({ error }) => {
          if (error) console.warn('Failed to delete category budget', error);
        });
    },
    [userId],
  );

  /** 당겨서 새로고침 등 수동 갱신용. */
  const refresh = useCallback(async () => {
    if (!userId) return;
    const next = await loadBudgets(userId);
    setOverallBudgetState(next.overallBudget);
    setCategoryBudgets(next.categoryBudgets);
  }, [userId]);

  const value = useMemo(
    () => ({
      overallBudget,
      setOverallBudget,
      categoryBudgets,
      setCategoryBudget,
      removeCategoryBudget,
      isLoading,
      refresh,
    }),
    [overallBudget, setOverallBudget, categoryBudgets, setCategoryBudget, removeCategoryBudget, isLoading, refresh],
  );

  return <BudgetsContext.Provider value={value}>{children}</BudgetsContext.Provider>;
}

export function useBudgets() {
  const ctx = useContext(BudgetsContext);
  if (!ctx) {
    throw new Error('useBudgets must be used within a BudgetsProvider');
  }
  return ctx;
}
