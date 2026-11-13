// Reviews service
import { api } from './api';
import type { Review } from '../types';

export const reviewsService = {
  async getReviewsForUser(userId: string): Promise<Review[]> {
    const res = await api.get<{ reviews: any[] }>(`/users/${userId}/reviews`, undefined, { skipAuth: true });
    const list = res.data?.reviews || res.data || [];
    if (Array.isArray(list)) {
      return list.map((r) => ({
        id: r.id,
        transactionId: r.transactionId || r.transaction_id || '',
        reviewerId: r.reviewerId || r.reviewer_id || '',
        reviewerName: r.reviewerName || r.reviewer_name || '',
        reviewerAvatar: r.reviewerAvatar || r.reviewer_avatar || '',
        reviewerCampus: r.reviewerCampus || r.reviewer_campus || 'UC Main',
        targetUserId: r.targetUserId || r.target_user_id || userId,
        rating: Number.isFinite(Number(r.rating)) ? Number(r.rating) : 0,
        comment: r.comment || '',
        itemTitle: r.itemTitle || r.item_title || '',
        tradeType: r.tradeType || r.trade_type || 'Buy / Sell',
        wasPunctual: Boolean(r.wasPunctual ?? r.was_punctual),
        traitBadges: r.traitBadges || r.trait_badges || [],
        createdAt: r.createdAt || r.created_at || new Date().toISOString()
      }));
    }
    return [];
  },

  async createReview(data: {
    transactionId: string;
    targetUserId: string;
    rating: number;
    comment: string;
    itemTitle: string;
    tradeType: string;
    wasPunctual: boolean;
    traitBadges?: string[];
  }): Promise<Review> {
    const res = await api.post<{ review: any }>('/reviews', data);
    return res.data?.review || res.data;
  }
};
