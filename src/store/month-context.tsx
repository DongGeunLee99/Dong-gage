import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { TODAY } from '@/store/transactions-context';

type MonthContextValue = {
  year: number;
  month: number;
  goMonth: (delta: number) => void;
  goToToday: () => void;
  isOnToday: boolean;
};

const MonthContext = createContext<MonthContextValue | null>(null);

export function MonthProvider({ children }: { children: React.ReactNode }) {
  const [ym, setYm] = useState({ year: TODAY.year, month: TODAY.month });

  const goMonth = useCallback((delta: number) => {
    setYm((prev) => {
      const d = new Date(prev.year, prev.month - 1 + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
  }, []);

  const goToToday = useCallback(() => {
    setYm({ year: TODAY.year, month: TODAY.month });
  }, []);

  const isOnToday = ym.year === TODAY.year && ym.month === TODAY.month;

  const value = useMemo(
    () => ({ year: ym.year, month: ym.month, goMonth, goToToday, isOnToday }),
    [ym, goMonth, goToToday, isOnToday],
  );

  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>;
}

export function useMonth() {
  const ctx = useContext(MonthContext);
  if (!ctx) {
    throw new Error('useMonth must be used within a MonthProvider');
  }
  return ctx;
}
