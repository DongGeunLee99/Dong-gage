import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/auth-context';

export type TransactionType = 'expense' | 'income';

export type Transaction = {
  id: string;
  date: string;
  time: string;
  type: TransactionType;
  categoryKey: string;
  subcategory?: string;
  amount: number;
  memo?: string;
  note?: string;
  tags?: string[];
  excludedFromBudget?: boolean;
};

export function parseTags(text: string) {
  const matches = text.match(/#(\S+)/g) ?? [];
  return matches.map((t) => t.slice(1));
}

type TransactionRow = {
  id: string;
  date: string;
  time: string;
  type: TransactionType;
  category_key: string;
  subcategory: string | null;
  amount: number;
  memo: string | null;
  note: string | null;
  tags: string[];
  excluded_from_budget: boolean;
};

function fromRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    date: row.date,
    time: row.time.slice(0, 5),
    type: row.type,
    categoryKey: row.category_key,
    subcategory: row.subcategory ?? undefined,
    amount: row.amount,
    memo: row.memo ?? undefined,
    note: row.note ?? undefined,
    tags: row.tags.length ? row.tags : undefined,
    excludedFromBudget: row.excluded_from_budget || undefined,
  };
}

type AddTransactionInput = Omit<Transaction, 'id'>;

function toRow(userId: string, input: AddTransactionInput) {
  return {
    user_id: userId,
    date: input.date,
    time: input.time.length === 5 ? `${input.time}:00` : input.time,
    type: input.type,
    category_key: input.categoryKey,
    subcategory: input.subcategory ?? null,
    amount: input.amount,
    memo: input.memo ?? null,
    note: input.note ?? null,
    tags: input.tags ?? [],
    excluded_from_budget: input.excludedFromBudget ?? false,
  };
}

type TransactionsContextValue = {
  transactions: Transaction[];
  isLoading: boolean;
  addTransaction: (input: AddTransactionInput) => void;
  updateTransaction: (id: string, input: AddTransactionInput) => void;
  deleteTransaction: (id: string) => void;
  getTransactionById: (id: string) => Transaction | undefined;
};

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

export function TransactionsProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    supabase
      .from('transactions')
      .select('id, date, time, type, category_key, subcategory, amount, memo, note, tags, excluded_from_budget')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('time', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn('Failed to load transactions', error);
          setTransactions([]);
        } else {
          setTransactions((data ?? []).map(fromRow));
        }
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const addTransaction = useCallback(
    (input: AddTransactionInput) => {
      if (!userId) return;
      const tempId = `temp-${Date.now()}`;
      setTransactions((prev) => [{ ...input, id: tempId }, ...prev]);
      supabase
        .from('transactions')
        .insert(toRow(userId, input))
        .select('id, date, time, type, category_key, subcategory, amount, memo, note, tags, excluded_from_budget')
        .single()
        .then(({ data, error }) => {
          if (error || !data) {
            console.warn('Failed to add transaction', error);
            setTransactions((prev) => prev.filter((t) => t.id !== tempId));
            return;
          }
          setTransactions((prev) => prev.map((t) => (t.id === tempId ? fromRow(data) : t)));
        });
    },
    [userId],
  );

  const updateTransaction = useCallback(
    (id: string, input: AddTransactionInput) => {
      if (!userId) return;
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...input, id } : t)));
      supabase
        .from('transactions')
        .update(toRow(userId, input))
        .eq('user_id', userId)
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('Failed to update transaction', error);
        });
    },
    [userId],
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      if (!userId) return;
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      supabase
        .from('transactions')
        .delete()
        .eq('user_id', userId)
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('Failed to delete transaction', error);
        });
    },
    [userId],
  );

  const getTransactionById = useCallback((id: string) => transactions.find((t) => t.id === id), [transactions]);

  const value = useMemo(
    () => ({ transactions, isLoading, addTransaction, updateTransaction, deleteTransaction, getTransactionById }),
    [transactions, isLoading, addTransaction, updateTransaction, deleteTransaction, getTransactionById],
  );

  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>;
}

export function useTransactions() {
  const ctx = useContext(TransactionsContext);
  if (!ctx) {
    throw new Error('useTransactions must be used within a TransactionsProvider');
  }
  return ctx;
}

export function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function getMonthTransactions(transactions: Transaction[], year: number, month: number) {
  const prefix = monthKey(year, month);
  return transactions.filter((t) => t.date.startsWith(prefix));
}

export function getDayTransactions(transactions: Transaction[], dateStr: string) {
  return transactions.filter((t) => t.date === dateStr);
}

export function monthSummary(transactions: Transaction[], year: number, month: number) {
  const monthTx = getMonthTransactions(transactions, year, month);
  const income = monthTx.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = monthTx.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  return { income, expense, balance: income - expense };
}

export function trackedExpenseTotal(transactions: Transaction[], year: number, month: number) {
  return getMonthTransactions(transactions, year, month)
    .filter((t) => t.type === 'expense' && !t.excludedFromBudget)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function categoryBreakdown(transactions: Transaction[], year: number, month: number, categoryKeys: string[]) {
  const monthTx = getMonthTransactions(transactions, year, month).filter((t) => t.type === 'expense');
  const totalExpense = monthTx.reduce((sum, t) => sum + t.amount, 0);

  return categoryKeys.map((key) => {
    const total = monthTx.filter((t) => t.categoryKey === key).reduce((sum, t) => sum + t.amount, 0);
    const pct = totalExpense > 0 ? Math.round((total / totalExpense) * 100) : 0;
    return { key, total, pct };
  })
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);
}

export function lastSixMonthsTrend(transactions: Transaction[], year: number, month: number) {
  const months: { year: number; month: number; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: `${d.getMonth() + 1}월` });
  }
  const sums = months.map((m) => ({ label: m.label, ...monthSummary(transactions, m.year, m.month) }));
  const maxValue = Math.max(1, ...sums.flatMap((s) => [s.income, s.expense]));
  return sums.map((s) => ({
    label: s.label,
    incomeHeight: Math.round((s.income / maxValue) * 90),
    expenseHeight: Math.round((s.expense / maxValue) * 90),
  }));
}

export function formatAmount(amount: number) {
  return amount.toLocaleString('ko-KR');
}

export function formatCompactAmount(amount: number) {
  const abs = Math.abs(amount);
  if (abs >= 10000) {
    const man = amount / 10000;
    const rounded = Math.round(man * 10) / 10;
    return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}만`;
  }
  return amount.toLocaleString('ko-KR');
}

export function buildMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startWeekday = firstDay.getDay();

  const cells: ({ day: number; dateStr: string } | null)[] = [];
  for (let i = 0; i < startWeekday; i++) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, dateStr: `${monthKey(year, month)}-${String(day).padStart(2, '0')}` });
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export const TODAY = { year: 2026, month: 8, day: 30, dateStr: '2026-08-30' };
