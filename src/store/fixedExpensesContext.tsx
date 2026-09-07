import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/authContext';

export type FixedExpense = {
  id: string;
  name: string;
  amount: number;
  categoryKey: string;
  subcategory?: string;
  /** SMS 자동매칭용 상호명. 계좌이체 등 SMS가 안 오는 항목은 비워둔다 — 그 경우 자동매칭을 시도하지 않는다. */
  merchantName?: string;
  /** 알림용 예상 결제일. 확정 날짜가 아니라 대략적인 기준이라 없어도 된다. */
  expectedDay?: number;
  on: boolean;
};

type FixedExpenseRow = {
  id: string;
  name: string;
  amount: number;
  category_key: string;
  subcategory: string | null;
  merchant_name: string | null;
  expected_day: number | null;
  is_on: boolean;
  sort_order: number;
};

function fromRow(row: FixedExpenseRow): FixedExpense {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount,
    categoryKey: row.category_key,
    subcategory: row.subcategory ?? undefined,
    merchantName: row.merchant_name ?? undefined,
    expectedDay: row.expected_day ?? undefined,
    on: row.is_on,
  };
}

type FixedExpenseInput = Omit<FixedExpense, 'id'>;

function toRow(input: FixedExpenseInput) {
  return {
    name: input.name,
    amount: input.amount,
    category_key: input.categoryKey,
    subcategory: input.subcategory ?? null,
    merchant_name: input.merchantName ?? null,
    expected_day: input.expectedDay ?? null,
    is_on: input.on,
  };
}

type FixedExpensesContextValue = {
  fixedExpenses: FixedExpense[];
  addFixedExpense: (input: FixedExpenseInput) => void;
  updateFixedExpense: (id: string, input: FixedExpenseInput) => void;
  deleteFixedExpense: (id: string) => void;
  toggleFixedExpense: (id: string) => void;
  getFixedExpenseById: (id: string) => FixedExpense | undefined;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

const SELECT_COLUMNS = 'id, name, amount, category_key, subcategory, merchant_name, expected_day, is_on, sort_order';

const FixedExpensesContext = createContext<FixedExpensesContextValue | null>(null);

export function FixedExpensesProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setFixedExpenses([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    supabase
      .from('fixed_expenses')
      .select(SELECT_COLUMNS)
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn('Failed to load fixed expenses', error);
          setFixedExpenses([]);
        } else {
          setFixedExpenses((data ?? []).map(fromRow));
        }
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const addFixedExpense = useCallback(
    (input: FixedExpenseInput) => {
      if (!userId) return;
      const id = `fixed-${Date.now()}`;
      setFixedExpenses((prev) => [...prev, { ...input, id }]);
      supabase
        .from('fixed_expenses')
        .insert({ id, user_id: userId, ...toRow(input), sort_order: fixedExpenses.length })
        .then(({ error }) => {
          if (error) console.warn('Failed to add fixed expense', error);
        });
    },
    [userId, fixedExpenses.length],
  );

  const updateFixedExpense = useCallback(
    (id: string, input: FixedExpenseInput) => {
      if (!userId) return;
      setFixedExpenses((prev) => prev.map((f) => (f.id === id ? { ...input, id } : f)));
      supabase
        .from('fixed_expenses')
        .update(toRow(input))
        .eq('user_id', userId)
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('Failed to update fixed expense', error);
        });
    },
    [userId],
  );

  const deleteFixedExpense = useCallback(
    (id: string) => {
      if (!userId) return;
      setFixedExpenses((prev) => prev.filter((f) => f.id !== id));
      supabase
        .from('fixed_expenses')
        .delete()
        .eq('user_id', userId)
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('Failed to delete fixed expense', error);
        });
    },
    [userId],
  );

  const toggleFixedExpense = useCallback(
    (id: string) => {
      if (!userId) return;
      const next = !fixedExpenses.find((f) => f.id === id)?.on;
      setFixedExpenses((prev) => prev.map((f) => (f.id === id ? { ...f, on: !f.on } : f)));
      supabase
        .from('fixed_expenses')
        .update({ is_on: next })
        .eq('user_id', userId)
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('Failed to toggle fixed expense', error);
        });
    },
    [userId, fixedExpenses],
  );

  /** 당겨서 새로고침 등 수동 갱신용. */
  const refresh = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('fixed_expenses')
      .select(SELECT_COLUMNS)
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });
    if (error) {
      console.warn('Failed to refresh fixed expenses', error);
      return;
    }
    setFixedExpenses((data ?? []).map(fromRow));
  }, [userId]);

  const getFixedExpenseById = useCallback((id: string) => fixedExpenses.find((f) => f.id === id), [fixedExpenses]);

  const value = useMemo(
    () => ({
      fixedExpenses,
      addFixedExpense,
      updateFixedExpense,
      deleteFixedExpense,
      toggleFixedExpense,
      getFixedExpenseById,
      isLoading,
      refresh,
    }),
    [fixedExpenses, addFixedExpense, updateFixedExpense, deleteFixedExpense, toggleFixedExpense, getFixedExpenseById, isLoading, refresh],
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
