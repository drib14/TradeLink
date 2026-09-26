import { mobileApi } from './api';

export interface AutofillDraft {
  title: string;
  category: string;
  department: string;
  condition: string;
  description: string;
  estimated_price_min: number;
  estimated_price_max: number;
  suggested_price: number;
  tags: string[];
}

export interface ModerationResult {
  approved: boolean;
  flag_reasons: string[];
  risk_score: number;
  suggested_category: string;
  suggested_department: string;
  moderation_notes: string;
}

export interface BarterAppraisal {
  fair: boolean;
  fairness_score: number;
  offered_item_valuation_php: number;
  requested_item_valuation_php: number;
  suggested_cash_top_up_php: number;
  cash_top_up_payer: 'offered_party' | 'requested_party' | 'none';
  analysis: string;
  recommendation: string;
}

export interface SafeMeetupLocation {
  name: string;
  campus: string;
  landmark: string;
  safety_rating: string;
  best_hours: string;
}

export interface SafeMeetupSuggestion {
  recommended_locations: SafeMeetupLocation[];
  time_assessment: {
    is_within_campus_hours: boolean;
    advice: string;
  };
  safety_precautions: string[];
}

export const aiService = {
  async autofillListing(query: string): Promise<AutofillDraft> {
    const res = await mobileApi.post('/ai/autofill', { query });
    return res.data.draft;
  },

  async moderateListing(payload: {
    title: string;
    description?: string;
    category?: string;
    price?: number;
  }): Promise<ModerationResult> {
    const res = await mobileApi.post('/ai/moderate', payload);
    return res.data.moderation;
  },

  async estimateBarter(payload: {
    offeredItem?: { title: string; condition?: string; price?: number; description?: string };
    requestedItem?: { title: string; condition?: string; price?: number; description?: string };
    offeredListingId?: string;
    requestedListingId?: string;
  }): Promise<BarterAppraisal> {
    const res = await mobileApi.post('/ai/estimate-barter', payload);
    return res.data.appraisal;
  },

  async suggestSafeMeetup(payload: {
    buyerCampus?: string;
    sellerCampus?: string;
    proposedTime?: string;
  }): Promise<SafeMeetupSuggestion> {
    const res = await mobileApi.post('/ai/safe-meetup', payload);
    return res.data.suggestion;
  },
};
