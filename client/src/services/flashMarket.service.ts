// Flash Market (Urgent Requests) service
import { api } from './api';
import type { FlashRequest } from '../types';

export function mapFlashRequestFromApi(raw: any): FlashRequest {
  return {
    id: raw.id,
    requesterId: raw.requesterId || raw.requester_id || '',
    requesterName: raw.requesterName || raw.requester_name || '',
    requesterAvatar: raw.requesterAvatar || raw.requester_avatar || '',
    requesterCampus: raw.requesterCampus || raw.requester_campus || 'UC Main',
    requesterCollege: raw.requesterCollege || raw.requester_college || 'General Student',
    itemTitle: raw.itemTitle || raw.item_title || raw.itemName || raw.item_name || '',
    itemName: raw.itemName || raw.item_name || raw.itemTitle || raw.item_title || '',
    category: raw.category || '',
    targetBudget: parseFloat(raw.targetBudget ?? raw.target_budget ?? raw.budget_range) || 0,
    urgency: raw.urgency || 'flexible',
    description: raw.description || raw.notes || '',
    notes: raw.notes || raw.description || '',
    preferredCampus: raw.preferredCampus || raw.preferred_campus || raw.target_campus || 'UC Main',
    targetCampus: raw.targetCampus || raw.target_campus || raw.preferred_campus || 'UC Main',
    status: raw.status || 'open',
    offersCount: raw.offersCount ?? raw.offers_count ?? 0,
    durationHours: raw.durationHours || raw.duration_hours || 24,
    expiresAt: raw.expiresAt || raw.expires_at || null,
    isExpired: Boolean(raw.isExpired || raw.is_expired || (raw.expires_at && new Date(raw.expires_at) < new Date())),
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
  };
}

export const flashMarketService = {
  async getRequests(filters?: any): Promise<FlashRequest[]> {
    const res = await api.get<{ requests: any[] }>('/flash-market', filters, { skipAuth: true });
    const rawList = res.data?.requests || res.data || [];
    if (Array.isArray(rawList)) {
      return rawList.map(mapFlashRequestFromApi);
    }
    return [];
  },

  async createRequest(data: any): Promise<FlashRequest> {
    const res = await api.post<{ request: any }>('/flash-market', data);
    return mapFlashRequestFromApi(res.data?.request || res.data);
  },

  async respondToRequest(id: string, offerMessage?: string): Promise<void> {
    await api.post(`/flash-market/${id}/respond`, { offerMessage });
  },

  async fulfillRequest(id: string): Promise<void> {
    await api.patch(`/flash-market/${id}/fulfill`);
  },

  async deleteRequest(id: string): Promise<void> {
    await api.delete(`/flash-market/${id}`);
  },
};

// Backward compatibility alias
export const wantedService = flashMarketService;
export const mapWantedFromApi = mapFlashRequestFromApi;
