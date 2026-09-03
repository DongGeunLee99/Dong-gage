import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LayoutAnimation } from 'react-native';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/authContext';

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

/** 문자에서 들어와 아직 사람이 승인하지 않은 거래. 원본 문자를 같이 들고 있다. */
export type PendingTransaction = Transaction & { rawMessage?: string };

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
  raw_message?: string | null;
};

const ROW_COLUMNS = 'id, date, time, type, category_key, subcategory, amount, memo, note, tags, excluded_from_budget';
const PENDING_ROW_COLUMNS = `${ROW_COLUMNS}, raw_message`;

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

function fromPendingRow(row: TransactionRow): PendingTransaction {
  return { ...fromRow(row), rawMessage: row.raw_message ?? undefined };
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
  pendingTransactions: PendingTransaction[];
  isLoading: boolean;
  addTransaction: (input: AddTransactionInput) => void;
  updateTransaction: (id: string, input: AddTransactionInput) => void;
  deleteTransaction: (id: string) => void;
  getTransactionById: (id: string) => Transaction | undefined;
  getPendingById: (id: string) => PendingTransaction | undefined;
  approvePending: (id: string, input?: AddTransactionInput) => void;
  rejectPending: (id: string) => void;
  refresh: () => Promise<void>;
  refreshPending: () => Promise<void>;
};

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

export function TransactionsProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
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
      .select(ROW_COLUMNS)
      .eq('user_id', userId)
      // 문자로 들어온 검토 대기 건은 승인 전까지 가계부에 섞이면 안 된다.
      .eq('status', 'confirmed')
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

  const refreshPending = useCallback(async () => {
    if (!userId) {
      setPendingTransactions([]);
      return;
    }
    const { data, error } = await supabase
      .from('transactions')
      .select(PENDING_ROW_COLUMNS)
      .eq('user_id', userId)
      .eq('status', 'pending_review')
      .order('date', { ascending: false })
      .order('time', { ascending: false });
    if (error) {
      console.warn('Failed to load pending transactions', error);
      return;
    }
    setPendingTransactions((data ?? []).map(fromPendingRow));
  }, [userId]);

  useEffect(() => {
    refreshPending();
  }, [refreshPending]);

  /** 당겨서 새로고침 등 수동 갱신용 — 확정된 거래만 다시 불러온다. */
  const refresh = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('transactions')
      .select(ROW_COLUMNS)
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .order('date', { ascending: false })
      .order('time', { ascending: false });
    if (error) {
      console.warn('Failed to refresh transactions', error);
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTransactions((data ?? []).map(fromRow));
  }, [userId]);

  const addTransaction = useCallback(
    (input: AddTransactionInput) => {
      if (!userId) return;
      const tempId = `temp-${Date.now()}`;
      setTransactions((prev) => [{ ...input, id: tempId }, ...prev]);
      supabase
        .from('transactions')
        .insert(toRow(userId, input))
        .select(ROW_COLUMNS)
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

  const getPendingById = useCallback(
    (id: string) => pendingTransactions.find((t) => t.id === id),
    [pendingTransactions],
  );

  /** 검토 대기 건을 확정으로 넘긴다. 검토 화면에서 고친 값이 있으면 같이 반영한다. */
  const approvePending = useCallback(
    (id: string, input?: AddTransactionInput) => {
      if (!userId) return;
      const pending = pendingTransactions.find((t) => t.id === id);
      if (!pending) return;

      const { rawMessage: _rawMessage, ...pendingWithoutRaw } = pending;
      const approved: Transaction = input ? { ...input, id } : pendingWithoutRaw;
      setPendingTransactions((prev) => prev.filter((t) => t.id !== id));
      setTransactions((prev) =>
        [approved, ...prev].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)),
      );

      supabase
        .from('transactions')
        .update({ ...(input ? toRow(userId, input) : {}), status: 'confirmed' })
        .eq('user_id', userId)
        .eq('id', id)
        .then(({ error }) => {
          if (!error) return;
          console.warn('Failed to approve transaction', error);
          setTransactions((prev) => prev.filter((t) => t.id !== id));
          setPendingTransactions((prev) => [pending, ...prev]);
        });
    },
    [userId, pendingTransactions],
  );

  const rejectPending = useCallback(
    (id: string) => {
      if (!userId) return;
      const pending = pendingTransactions.find((t) => t.id === id);
      if (!pending) return;

      setPendingTransactions((prev) => prev.filter((t) => t.id !== id));
      supabase
        .from('transactions')
        .delete()
        .eq('user_id', userId)
        .eq('id', id)
        .then(({ error }) => {
          if (!error) return;
          console.warn('Failed to reject transaction', error);
          setPendingTransactions((prev) => [pending, ...prev]);
        });
    },
    [userId, pendingTransactions],
  );

  const value = useMemo(
    () => ({
      transactions,
      pendingTransactions,
      isLoading,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      getTransactionById,
      getPendingById,
      approvePending,
      rejectPending,
      refresh,
      refreshPending,
    }),
    [
      transactions,
      pendingTransactions,
      isLoading,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      getTransactionById,
      getPendingById,
      approvePending,
      rejectPending,
      refresh,
      refreshPending,
    ],
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

/**
 * 앱이 켜진 시점의 기기 날짜. 캘린더 초기 포커스, 새 거래의 기본 날짜,
 * AI 정산의 "오늘 거래" 후보가 전부 이 값을 본다.
 * 모듈 로드 시 한 번 계산하므로, 앱을 켜둔 채 자정을 넘기면 다음 실행 때 갱신된다.
 */
function today() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  return { year, month, day, dateStr: `${year}-${pad(month)}-${pad(day)}` };
}

export const TODAY = today();
