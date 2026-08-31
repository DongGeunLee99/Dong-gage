import { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type FixedExpense = {
  id: string;
  name: string;
  amount: number;
  dayOfMonth: number;
  on: boolean;
};

type FixedExpenseInput = Omit<FixedExpense, 'id'>;

type FixedExpensesContextValue = {
  fixedExpenses: FixedExpense[];
  addFixedExpense: (input: FixedExpenseInput) => void;
  updateFixedExpense: (id: string, input: FixedExpenseInput) => void;
  deleteFixedExpense: (id: string) => void;
  toggleFixedExpense: (id: string) => void;
  getFixedExpenseById: (id: string) => FixedExpense | undefined;
};

const INITIAL_FIXED_EXPENSES: FixedExpense[] = [
  { id: 'rent', name: '월세', amount: 700_000, dayOfMonth: 25, on: true },
  { id: 'phone', name: '통신비', amount: 55_000, dayOfMonth: 25, on: true },
  { id: 'netflix', name: '넷플릭스 구독', amount: 13_500, dayOfMonth: 5, on: true },
  { id: 'gym', name: '헬스장', amount: 89_000, dayOfMonth: 1, on: false },
];

const FixedExpensesContext = createContext<FixedExpensesContextValue | null>(null);

export function FixedExpensesProvider({ children }: { children: React.ReactNode }) {
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>(INITIAL_FIXED_EXPENSES);

  const addFixedExpense = useCallback((input: FixedExpenseInput) => {
    setFixedExpenses((prev) => [...prev, { ...input, id: `fixed-${Date.now()}` }]);
  }, []);

  const updateFixedExpense = useCallback((id: string, input: FixedExpenseInput) => {
    setFixedExpenses((prev) => prev.map((f) => (f.id === id ? { ...input, id } : f)));
  }, []);

  const deleteFixedExpense = useCallback((id: string) => {
    setFixedExpenses((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const toggleFixedExpense = useCallback((id: string) => {
    setFixedExpenses((prev) => prev.map((f) => (f.id === id ? { ...f, on: !f.on } : f)));
  }, []);

  const getFixedExpenseById = useCallback((id: string) => fixedExpenses.find((f) => f.id === id), [fixedExpenses]);

  const value = useMemo(
    () => ({ fixedExpenses, addFixedExpense, updateFixedExpense, deleteFixedExpense, toggleFixedExpense, getFixedExpenseById }),
    [fixedExpenses, addFixedExpense, updateFixedExpense, deleteFixedExpense, toggleFixedExpense, getFixedExpenseById],
  );

  return <FixedExpensesContext.Provider value={value}>{children}</FixedExpensesContext.Provider>;
}

export function useFixedExpenses() {
  const ctx = useContext(FixedExpensesContext);
  if (!ctx) {
    throw new Error('useFixedExpenses must be used within a FixedExpensesProvider');
  }
  return ctx;
}
