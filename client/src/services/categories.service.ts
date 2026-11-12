import { api } from './api';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  display_order?: number;
  is_active?: boolean;
}

export const categoriesService = {
  async getCategories(): Promise<Category[]> {
    try {
      const res = await api.get<{ categories: Category[] }>('/categories');
      // The API wraps payloads in { status, data: { categories } }.
      // Accept the legacy top-level shape too while deployments are rolling forward.
      return res.data?.data?.categories || res.data?.categories || [];
    } catch (err) {
      console.warn('Could not fetch categories from server, using fallback', err);
      return [];
    }
  },

  async createCategory(name: string): Promise<Category | null> {
    try {
      const res = await api.post<{ category: Category }>('/categories', { name: name.trim() });
      return res.data.category;
    } catch (err) {
      console.warn('Could not create custom category', err);
      return null;
    }
  }
};

