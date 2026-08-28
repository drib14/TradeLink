// Listings service — marketplace API calls
import { api, type ApiResponse } from './api';
import type { Listing, Campus, TradeMode, ConditionGrade } from '../types';

export interface ListingsFilters {
  campus?: string;
  category?: string;
  tradeMode?: string;
  condition?: string;
  search?: string;
  sortBy?: string;
  priceMin?: number;
  priceMax?: number;
  page?: number;
  limit?: number;
}

// Map snake_case API response to camelCase Listing type
function mapListingFromApi(raw: any): Listing {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    price: parseFloat(raw.price) || 0,
    originalSrp: parseFloat(raw.originalSrp ?? raw.original_srp) || 0,
    tradeMode: raw.tradeMode || raw.trade_mode || 'buy_sell',
    swapPreference: raw.swapPreference || raw.swap_preference,
    category: raw.category || '',
    tags: raw.tags || [],
    condition: raw.condition || 'Gently Used',
    images: raw.images || [],
    sellerId: raw.sellerId || raw.seller_id || '',
    sellerName: raw.sellerName || raw.seller_name || '',
    sellerAvatar: raw.sellerAvatar || raw.seller_avatar || '',
    sellerCampus: raw.sellerCampus || raw.seller_campus || 'UC Main',
    sellerCollege: raw.sellerCollege || raw.seller_college || 'General Student',
    sellerIsVerified: Boolean(raw.sellerIsVerified ?? raw.seller_is_verified),
    sellerTrustScore: raw.sellerTrustScore ?? raw.seller_trust_score ?? 60,
    preferredMeetupSpots: raw.preferredMeetupSpots || raw.preferred_meetup_spots || [],
    customMeetupSpot: raw.customMeetupSpot || raw.custom_meetup_spot,
    isBoosted: Boolean(raw.isBoosted ?? raw.is_boosted),
    isSold: Boolean(raw.isSold ?? raw.is_sold),
    courseCode: raw.courseCode || raw.course_code,
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    views: raw.views ?? 0,
    favoritesCount: raw.favoritesCount ?? raw.favorites_count ?? 0,
  };
}

export const listingsService = {
  async getListings(filters?: ListingsFilters): Promise<Listing[]> {
    const res = await api.get<{ listings: any[] }>('/listings', filters as any, { skipAuth: true });
    const rawListings = res.data?.listings || res.data || [];
    if (Array.isArray(rawListings)) {
      return rawListings.map(mapListingFromApi);
    }
    return [];
  },

  async getListing(id: string): Promise<Listing> {
    const res = await api.get<{ listing: any }>(`/listings/${id}`, undefined, { skipAuth: true });
    return mapListingFromApi(res.data?.listing || res.data);
  },

  async createListing(data: Partial<Listing>): Promise<Listing> {
    const payload = {
      title: data.title,
      description: data.description,
      price: data.price,
      originalSrp: data.originalSrp,
      tradeMode: data.tradeMode,
      swapPreference: data.swapPreference,
      category: data.category,
      tags: data.tags,
      condition: data.condition,
      images: data.images,
      courseCode: data.courseCode,
      preferredMeetupSpots: data.preferredMeetupSpots,
      customMeetupSpot: data.customMeetupSpot,
    };
    const res = await api.post<{ listing: any }>('/listings', payload);
    return mapListingFromApi(res.data?.listing || res.data);
  },

  async updateListing(id: string, data: Partial<Listing>): Promise<Listing> {
    const res = await api.put<{ listing: any }>(`/listings/${id}`, data);
    return mapListingFromApi(res.data?.listing || res.data);
  },

  async deleteListing(id: string): Promise<void> {
    await api.delete(`/listings/${id}`);
  },

  async boostListing(id: string): Promise<void> {
    await api.patch(`/listings/${id}/boost`);
  },

  async markAsSold(id: string, isSold: boolean): Promise<void> {
    await api.patch(`/listings/${id}`, { isSold });
  },

  async incrementViews(id: string): Promise<void> {
    try {
      await api.post(`/listings/${id}/view`, undefined, { skipAuth: true });
    } catch {
      // Non-critical — silently fail
    }
  },

  async flagListing(id: string, reason: string): Promise<void> {
    await api.post(`/listings/${id}/flag`, { reason });
  },
};

export { mapListingFromApi };
