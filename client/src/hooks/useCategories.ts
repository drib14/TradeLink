import { useState, useEffect, useCallback } from 'react';
import { categoriesService, Category } from '../services/categories.service';

const FALLBACK_CATEGORIES: Category[] = [
  { id: '1', name: 'Electronics & Gadgets', slug: 'electronics-gadgets' },
  { id: '2', name: 'Textbooks & Reviewers', slug: 'textbooks-reviewers' },
  { id: '3', name: 'Uniforms & Apparel', slug: 'uniforms-apparel' },
  { id: '4', name: 'Calculators & Electronics', slug: 'calculators-electronics' },
  { id: '5', name: 'Fashion & Sneakers', slug: 'fashion-sneakers' },
  { id: '6', name: 'Music & Instruments', slug: 'music-instruments' },
  { id: '7', name: 'Audio & Gadgets', slug: 'audio-gadgets' },
  { id: '8', name: 'Dorm & Living', slug: 'dorm-living' },
  { id: '9', name: 'Gaming & Tech', slug: 'gaming-tech' },
  { id: '10', name: 'Medical Equipment', slug: 'medical-equipment' },
  { id: '11', name: 'Junior High School Books & Reviewers', slug: 'junior-high-school-books-reviewers' },
  { id: '12', name: 'Senior High Reviewers & Books', slug: 'senior-high-reviewers-books' },
  { id: '13', name: 'General Supplies', slug: 'general-supplies' }
];

let cachedCategories: Category[] | null = null;
const listeners = new Set<(cats: Category[]) => void>();

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>(cachedCategories || FALLBACK_CATEGORIES);
  const [isLoading, setIsLoading] = useState<boolean>(!cachedCategories);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await categoriesService.getCategories();
      if (data && data.length > 0) {
        cachedCategories = data;
        setCategories(data);
        listeners.forEach((cb) => cb(data));
      }
    } catch (err) {
      console.warn('useCategories error, using fallbacks', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleUpdate = (updated: Category[]) => {
      setCategories(updated);
    };
    listeners.add(handleUpdate);

    if (!cachedCategories) {
      fetchCategories();
    } else {
      setCategories(cachedCategories);
      setIsLoading(false);
    }

    return () => {
      listeners.delete(handleUpdate);
    };
  }, [fetchCategories]);

  const addCategory = async (name: string): Promise<Category | null> => {
    const created = await categoriesService.createCategory(name);
    if (created) {
      await fetchCategories();
    }
    return created;
  };

  return {
    categories,
    categoryNames: categories.map((c) => c.name),
    isLoading,
    refreshCategories: fetchCategories,
    addCategory
  };
};

