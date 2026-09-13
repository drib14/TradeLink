// Listings service — marketplace API calls
import { api } from './api';
import type { Listing, ListingMediaItem } from '../types';

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
  let resolvedMedia: ListingMediaItem[] = [];

  if (Array.isArray(raw.media) && raw.media.length > 0) {
    resolvedMedia = raw.media.map((m: any, idx: number) => {
      if (typeof m === 'string') {
        const isVid = m.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) || m.includes('/video/upload/');
        return {
          id: `med-${idx}`,
          url: m,
          mediaType: isVid ? 'video' : 'image',
          isPrimary: idx === 0
        };
      }
      return {
        id: m.id || `med-${idx}`,
        url: m.url || m.media_url || m.mediaUrl || '',
        mediaType: m.mediaType || m.media_type || 'image',
        thumbnailUrl: m.thumbnailUrl || m.thumbnail_url || null,
        isPrimary: Boolean(m.isPrimary ?? m.is_primary ?? (idx === 0))
      };
    });
  } else if (Array.isArray(raw.images)) {
    resolvedMedia = raw.images
      .filter((img: any) => typeof img === 'string' && img.trim() !== '')
      .map((url: string, idx: number) => ({
        id: `med-${idx}`,
        url,
        mediaType: (url.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) || url.includes('/video/upload/')) ? 'video' : 'image',
        isPrimary: idx === 0
      }));
  }

  const resolvedImages = resolvedMedia.map((m) => m.url);
  const hasVideo = resolvedMedia.some((m) => m.mediaType === 'video');

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
    condition: raw.condition || 'Gently Used',
    media: resolvedMedia,
    images: resolvedImages,
    hasVideo,
    sellerId: raw.sellerId || raw.seller_id || '',
    sellerName: raw.sellerName || raw.seller_name || 'Student',
    sellerAvatar,
    sellerCampus: raw.sellerCampus || raw.seller_campus || 'UC Main',
    sellerCollege: raw.sellerCollege || raw.seller_college || 'General Student',
    sellerIsVerified: Boolean(raw.sellerIsVerified ?? raw.seller_is_verified),
    sellerTrustScore: Number(raw.sellerTrustScore ?? raw.seller_trust_score ?? 0),
    quantity: raw.quantity !== undefined && raw.quantity !== null ? Math.max(0, parseInt(raw.quantity, 10) || 0) : 1,
    isSold: Boolean((raw.isSold ?? raw.is_sold) || (raw.quantity !== undefined && Number(raw.quantity) === 0)),
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    views: Number(raw.views ?? 0)
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

  async createListing(data: any): Promise<Listing> {
    const payload = {
      title: data.title,
      description: data.description,
      price: data.price,
      originalSrp: data.originalSrp,
      tradeMode: data.tradeMode,
      swapPreference: data.swapPreference,
      category: data.category,
      condition: data.condition,
      quantity: data.quantity !== undefined ? Number(data.quantity) : 1,
      media: data.media || data.images || [],
      images: data.images || [],
      campus: data.campus,
      department: data.department
    };
    const res = await api.post<{ listing: any }>('/listings', payload);
    return mapListingFromApi(res.data?.listing || res.data);
  },

  async updateListing(id: string, data: Partial<Listing>): Promise<Listing> {
    const res = await api.patch<{ listing: any }>(`/listings/${id}`, data);
    return mapListingFromApi(res.data?.listing || res.data);
  },

  async updateListingQuantity(id: string, quantity: number): Promise<Listing> {
    const res = await api.patch<{ listing: any }>(`/listings/${id}`, { quantity, isSold: quantity === 0 });
    return mapListingFromApi(res.data?.listing || res.data);
  },

  async deleteListing(id: string): Promise<void> {
    await api.delete(`/listings/${id}`);
  },

  async markAsSold(id: string, isSold: boolean): Promise<void> {
    await api.patch(`/listings/${id}`, { isSold, quantity: isSold ? 0 : 1 });
  },

  async incrementViews(id: string): Promise<void> {
    try {
      await api.post(`/listings/${id}/view`, undefined, { skipAuth: true });
    } catch {
      // Non-critical — silently fail
    }
  },

  async flagListing(id: string, reason: string): Promise<void> {
    await api.post(`/listings/${id}/report`, { reason });
  },

  // Legacy stubs (favorites schema dropped)
  async getFavorites(): Promise<string[]> {
    return [];
  },

  async toggleFavorite(listingId: string): Promise<{ isFavorited: boolean; listingId: string }> {
    return { isFavorited: false, listingId };
  }
};

export { mapListingFromApi };
