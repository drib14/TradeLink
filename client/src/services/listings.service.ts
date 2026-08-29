// Listings service — marketplace API calls
import { api } from './api';
import type { Listing } from '../types';

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
  let resolvedImages: string[] = [];
  if (Array.isArray(raw.images)) {
    resolvedImages = raw.images.filter((img: any) => typeof img === 'string' && img.trim() !== '');
  } else if (typeof raw.images === 'string' && raw.images.trim()) {
    try {
      const parsed = JSON.parse(raw.images);
      resolvedImages = Array.isArray(parsed) ? parsed.filter((img: any) => typeof img === 'string' && img.trim() !== '') : [raw.images.trim()];
    } catch {
      resolvedImages = raw.images.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  } else if (raw.image_url || raw.imageUrl) {
    const single = (raw.image_url || raw.imageUrl).trim();
    if (single) resolvedImages = [single];
  }

  const rawAvatar = raw.sellerAvatar ?? raw.seller_avatar ?? null;
  const sellerAvatar = typeof rawAvatar === 'string' && rawAvatar.trim() !== '' ? rawAvatar.trim() : null;

  return {
    id: raw.id,
    title: raw.title || '',
    description: raw.description || '',
    price: parseFloat(raw.price) || 0,
    originalSrp: parseFloat(raw.originalSrp ?? raw.original_srp) || 0,
    tradeMode: raw.tradeMode || raw.trade_mode || 'buy_sell',
    swapPreference: raw.swapPreference || raw.swap_preference || null,
    category: raw.category || '',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    condition: raw.condition || 'Gently Used',
    images: resolvedImages,
    sellerId: raw.sellerId || raw.seller_id || '',
    sellerName: raw.sellerName || raw.seller_name || 'Student',
    sellerAvatar,
    sellerCampus: raw.sellerCampus || raw.seller_campus || 'UC Main',
    sellerCollege: raw.sellerCollege || raw.seller_college || 'General Student',
    sellerIsVerified: Boolean(raw.sellerIsVerified ?? raw.seller_is_verified),
    sellerTrustScore: raw.sellerTrustScore ?? raw.seller_trust_score ?? 60,
    preferredMeetupSpots: Array.isArray(raw.preferredMeetupSpots || raw.preferred_meetup_spots)
      ? (raw.preferredMeetupSpots || raw.preferred_meetup_spots)
      : [],
    customMeetupSpot: raw.customMeetupSpot || raw.custom_meetup_spot || null,
    isBoosted: Boolean(raw.isBoosted ?? raw.is_boosted),
    quantity: raw.quantity !== undefined && raw.quantity !== null ? Math.max(0, parseInt(raw.quantity, 10) || 0) : 1,
    isSold: Boolean((raw.isSold ?? raw.is_sold) || (raw.quantity !== undefined && Number(raw.quantity) === 0)),
    courseCode: raw.courseCode || raw.course_code || null,
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    views: Number(raw.views ?? 0),
    favoritesCount: Number(raw.favoritesCount ?? raw.favorites_count ?? 0),
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
