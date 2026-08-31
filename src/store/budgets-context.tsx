import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type BudgetsContextValue = {
  overallBudget: number;
  setOverallBudget: (amount: number) => void;
  categoryBudgets: Record<string, number>;
  setCategoryBudget: (categoryKey: string, amount: number) => void;
  removeCategoryBudget: (categoryKey: string) => void;
};

const DEFAULT_CATEGORY_BUDGETS: Record<string, number> = {
  food: 800_000,
  transport: 200_000,
};

const BudgetsContext = createContext<BudgetsContextValue | null>(null);

export function BudgetsProvider({ children }: { children: React.ReactNode }) {
  const [overallBudget, setOverallBudget] = useState(1_000_000);
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>(DEFAULT_CATEGORY_BUDGETS);

  const setCategoryBudget = useCallback((categoryKey: string, amount: number) => {
    setCategoryBudgets((prev) => ({ ...prev, [categoryKey]: amount }));
  }, []);

  const removeCategoryBudget = useCallback((categoryKey: string) => {
    setCategoryBudgets((prev) => {
      const next = { ...prev };
      delete next[categoryKey];
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ overallBudget, setOverallBudget, categoryBudgets, setCategoryBudget, removeCategoryBudget }),
    [overallBudget, categoryBudgets, setCategoryBudget, removeCategoryBudget],
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
