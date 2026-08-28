// Wanted requests service
import { api } from './api';
import type { WantedRequest } from '../types';

function mapWantedFromApi(raw: any): WantedRequest {
  return {
    id: raw.id,
    requesterId: raw.requesterId || raw.requester_id || '',
    requesterName: raw.requesterName || raw.requester_name || '',
    requesterAvatar: raw.requesterAvatar || raw.requester_avatar || '',
    requesterCampus: raw.requesterCampus || raw.requester_campus || 'UC Main',
    requesterCollege: raw.requesterCollege || raw.requester_college || 'General Student',
    itemTitle: raw.itemTitle || raw.item_title || '',
    category: raw.category || '',
    targetBudget: parseFloat(raw.targetBudget ?? raw.target_budget) || 0,
    urgency: raw.urgency || 'Flexible',
    description: raw.description || '',
    preferredCampus: raw.preferredCampus || raw.preferred_campus || 'UC Main',
    status: raw.status || 'open',
    offersCount: raw.offersCount ?? raw.offers_count ?? 0,
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
  };
}

export const wantedService = {
  async getRequests(filters?: any): Promise<WantedRequest[]> {
    const res = await api.get<{ requests: any[] }>('/wanted', filters, { skipAuth: true });
    const rawList = res.data?.requests || res.data || [];
    if (Array.isArray(rawList)) {
      return rawList.map(mapWantedFromApi);
    }
    return [];
  },

  async createRequest(data: any): Promise<WantedRequest> {
    const res = await api.post<{ request: any }>('/wanted', data);
    return mapWantedFromApi(res.data?.request || res.data);
  },

  async respondToRequest(id: string, offerMessage?: string): Promise<void> {
    await api.post(`/wanted/${id}/respond`, { offerMessage });
  },

  async fulfillRequest(id: string): Promise<void> {
    await api.patch(`/wanted/${id}/fulfill`);
  },

  async deleteRequest(id: string): Promise<void> {
    await api.delete(`/wanted/${id}`);
  },
};
