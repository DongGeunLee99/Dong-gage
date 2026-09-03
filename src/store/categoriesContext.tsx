import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LayoutAnimation } from 'react-native';

import {
  getColorHex,
  getIconComponent,
  INCOME_CATEGORY_KEY,
  INCOME_META,
  UNCATEGORIZED_META,
  type Category,
  type CategoryMeta,
} from '@/constants/categories';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/authContext';

type CategoryRow = {
  key: string;
  name: string;
  color_id: string;
  icon_id: string;
  subcategories: string[];
  sort_order: number;
};

function fromRow(row: CategoryRow): Category {
  return { key: row.key, name: row.name, colorId: row.color_id, iconId: row.icon_id, subcategories: row.subcategories };
}

type CategoryInput = {
  name: string;
  colorId: string;
  iconId: string;
  subcategories: string[];
};

type CategoriesContextValue = {
  categories: Category[];
  categoryKeys: string[];
  isLoading: boolean;
  addCategory: (input: CategoryInput) => void;
  updateCategory: (key: string, input: CategoryInput) => void;
  deleteCategory: (key: string) => void;
  getCategoryById: (key: string) => Category | undefined;
  getCategoryMeta: (key: string) => CategoryMeta;
  refresh: () => Promise<void>;
};

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setCategories([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    supabase
      .from('categories')
      .select('key, name, color_id, icon_id, subcategories, sort_order')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn('Failed to load categories', error);
          setCategories([]);
        } else {
          setCategories((data ?? []).map(fromRow));
        }
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const addCategory = useCallback(
    (input: CategoryInput) => {
      if (!userId) return;
      const key = `cat-${Date.now()}`;
      setCategories((prev) => [...prev, { ...input, key }]);
      supabase
        .from('categories')
        .insert({
          user_id: userId,
          key,
          name: input.name,
          color_id: input.colorId,
          icon_id: input.iconId,
          subcategories: input.subcategories,
          sort_order: categories.length,
        })
        .then(({ error }) => {
          if (error) console.warn('Failed to add category', error);
        });
    },
    [userId, categories.length],
  );

  const updateCategory = useCallback(
    (key: string, input: CategoryInput) => {
      if (!userId) return;
      setCategories((prev) => prev.map((c) => (c.key === key ? { ...input, key } : c)));
      supabase
        .from('categories')
        .update({ name: input.name, color_id: input.colorId, icon_id: input.iconId, subcategories: input.subcategories })
        .eq('user_id', userId)
        .eq('key', key)
        .then(({ error }) => {
          if (error) console.warn('Failed to update category', error);
        });
    },
    [userId],
  );

  const deleteCategory = useCallback(
    (key: string) => {
      if (!userId) return;
      setCategories((prev) => prev.filter((c) => c.key !== key));
      supabase
        .from('categories')
        .delete()
        .eq('user_id', userId)
        .eq('key', key)
        .then(({ error }) => {
          if (error) console.warn('Failed to delete category', error);
        });
    },
    [userId],
  );

  /** 당겨서 새로고침 등 수동 갱신용. */
  const refresh = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('categories')
      .select('key, name, color_id, icon_id, subcategories, sort_order')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });
    if (error) {
      console.warn('Failed to refresh categories', error);
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCategories((data ?? []).map(fromRow));
  }, [userId]);

  const getCategoryById = useCallback((key: string) => categories.find((c) => c.key === key), [categories]);

  const getCategoryMeta = useCallback(
    (key: string): CategoryMeta => {
      if (key === INCOME_CATEGORY_KEY) return INCOME_META;
      const cat = categories.find((c) => c.key === key);
      if (!cat) return UNCATEGORIZED_META;
      return { name: cat.name, color: getColorHex(cat.colorId), Icon: getIconComponent(cat.iconId) };
    },
    [categories],
  );

  const categoryKeys = useMemo(() => categories.map((c) => c.key), [categories]);

  const value = useMemo(
    () => ({
      categories,
      categoryKeys,
      isLoading,
      addCategory,
      updateCategory,
      deleteCategory,
      getCategoryById,
      getCategoryMeta,
      refresh,
    }),
    [categories, categoryKeys, isLoading, addCategory, updateCategory, deleteCategory, getCategoryById, getCategoryMeta, refresh],
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return ctx;
}
