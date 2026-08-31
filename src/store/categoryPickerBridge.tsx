import { createContext, useContext, useMemo, useState } from 'react';

export type CategoryPickerResult = {
  categoryKey: string;
  subcategory?: string;
};

type CategoryPickerBridgeValue = {
  result: CategoryPickerResult | null;
  setResult: (result: CategoryPickerResult | null) => void;
};

const CategoryPickerBridgeContext = createContext<CategoryPickerBridgeValue | null>(null);

export function CategoryPickerBridgeProvider({ children }: { children: React.ReactNode }) {
  const [result, setResult] = useState<CategoryPickerResult | null>(null);
  const value = useMemo(() => ({ result, setResult }), [result]);
  return <CategoryPickerBridgeContext.Provider value={value}>{children}</CategoryPickerBridgeContext.Provider>;
}

export function useCategoryPickerBridge() {
  const ctx = useContext(CategoryPickerBridgeContext);
  if (!ctx) {
    throw new Error('useCategoryPickerBridge must be used within a CategoryPickerBridgeProvider');
  }
  return ctx;
}
