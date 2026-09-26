import { mobileApi } from './api';

export interface ProposeSwapPayload {
  targetListingId: string;
  offeredListingId?: string;
  offeredDescription: string;
  cashTopUp?: number;
  selectedVariation?: string;
}

export const mobileSwapsService = {
  async getSwaps() {
    const res = await mobileApi.get('/swaps');
    return res.data?.swaps || [];
  },

  async proposeSwap(payload: ProposeSwapPayload) {
    const res = await mobileApi.post('/swaps', {
      targetListingId: payload.targetListingId,
      offeredListingId: payload.offeredListingId,
      offeredDescription: payload.offeredDescription,
      cashTopUp: payload.cashTopUp || 0,
      selectedVariation: payload.selectedVariation,
    });
    return res.data;
  },

  async respondToSwap(id: string, action: 'accept' | 'decline', responseNote?: string) {
    const res = await mobileApi.patch(`/swaps/${id}/respond`, {
      action,
      responseNote,
    });
    return res.data;
  },
};
