import { api } from './api';

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
  fallback?: boolean;
}

export interface ModerationResult {
  approved: boolean;
  flag_reasons: string[];
  risk_score: number;
  suggested_category: string;
  suggested_department: string;
  moderation_notes: string;
  fallback?: boolean;
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
  fallback?: boolean;
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
  fallback?: boolean;
}

export interface DisputeSummary {
  summary_bullets: string[];
  buyer_position: string;
  seller_position: string;
  sentiment_level: string;
  policy_violations_detected: string[];
  recommended_resolution: string;
  fallback?: boolean;
}

export const aiService = {
  /**
   * Autofill listing fields from brief query
   */
  async autofillListing(query: string): Promise<AutofillDraft> {
    const res = await api.post<{ draft: AutofillDraft }>('/ai/autofill', { query });
    return res.data.draft;
  },

  /**
   * Scan listing for academic integrity and prohibited goods
   */
  async moderateListing(payload: {
    title: string;
    description?: string;
    category?: string;
    price?: number;
  }): Promise<ModerationResult> {
    const res = await api.post<{ moderation: ModerationResult }>('/ai/moderate', payload);
    return res.data.moderation;
  },

  /**
   * Evaluate fair-trade equality between two items
   */
  async estimateBarter(payload: {
    offeredItem?: { title: string; condition?: string; price?: number; description?: string };
    requestedItem?: { title: string; condition?: string; price?: number; description?: string };
    offeredListingId?: string;
    requestedListingId?: string;
  }): Promise<BarterAppraisal> {
    const res = await api.post<{ appraisal: BarterAppraisal }>('/ai/estimate-barter', payload);
    return res.data.appraisal;
  },

  /**
   * Suggest campus safety zones for physical meetups
   */
  async suggestSafeMeetup(payload: {
    buyerCampus?: string;
    sellerCampus?: string;
    proposedTime?: string;
  }): Promise<SafeMeetupSuggestion> {
    const res = await api.post<{ suggestion: SafeMeetupSuggestion }>('/ai/safe-meetup', payload);
    return res.data.suggestion;
  },

  /**
   * Fetch dispute summary dossier
   */
  async summarizeDispute(transactionId: string, disputeReason?: string): Promise<DisputeSummary> {
    const res = await api.post<{ disputeSummary: DisputeSummary }>('/ai/dispute-summary', {
      transactionId,
      disputeReason,
    });
    return res.data.disputeSummary;
  },
};
