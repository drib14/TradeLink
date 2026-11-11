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
      return res.data.categories || [];
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

