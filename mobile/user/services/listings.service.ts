import { mobileApi } from './api';
import { Listing } from '../types';

export const mobileListingsService = {
  async getListings(filters: Record<string, any> = {}): Promise<Listing[]> {
    const res = await mobileApi.get('/listings', filters);
    const list = res.data?.listings || [];
    return Array.isArray(list) ? list : [];
  },

  async getListingById(id: string): Promise<Listing> {
    const res = await mobileApi.get(`/listings/${id}`);
    return res.data?.listing;
  },

  async createListing(listingData: Partial<Listing>): Promise<Listing> {
    const res = await mobileApi.post('/listings', listingData);
    return res.data?.listing;
  },

  async updateListing(id: string, updates: Partial<Listing>): Promise<void> {
    await mobileApi.patch(`/listings/${id}`, updates);
  },

  async deleteListing(id: string): Promise<void> {
    await mobileApi.delete(`/listings/${id}`);
  },


  async markAsSold(id: string, isSold: boolean): Promise<void> {
    await mobileApi.patch(`/listings/${id}/sold`, { isSold });
  },

  async reportListing(id: string, reason: string): Promise<any> {
    const res = await mobileApi.post(`/listings/${id}/report`, { reason });
    return res.data;
  },

  async getFavorites(): Promise<string[]> {
    try {
      const res = await mobileApi.get('/favorites');
      return res.data?.favorites || [];
    } catch {
      return [];
    }
  },

  async toggleFavorite(id: string): Promise<{ isFavorited: boolean }> {
    const res = await mobileApi.post(`/favorites/${id}/toggle`);
    return res.data || { isFavorited: false };
  },
};
