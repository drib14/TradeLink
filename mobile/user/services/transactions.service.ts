import { mobileApi } from './api';

export interface CreateTransactionPayload {
  listingId: string;
  sellerId?: string;
  amount?: number;
  paymentMethod?: 'cash' | 'gcash' | 'maya' | 'barter' | 'free';
  notes?: string;
  selectedVariation?: string;
  variationId?: string;
}

export const mobileTransactionsService = {
  async getTransactions(status: string = 'all') {
    const res = await mobileApi.get('/transactions', { status });
    return res.data?.transactions || [];
  },

  async getTransactionById(id: string) {
    const res = await mobileApi.get(`/transactions/${id}`);
    return res.data?.transaction;
  },

  async createTransaction(payload: CreateTransactionPayload) {
    const res = await mobileApi.post('/transactions', {
      listingId: payload.listingId,
      sellerId: payload.sellerId,
      amount: payload.amount,
      paymentMethod: payload.paymentMethod || 'cash',
      notes: payload.notes,
      selectedVariation: payload.selectedVariation,
      variationId: payload.variationId,
    });
    return res.data;
  },

  async requestHandshakeCode(id: string) {
    const res = await mobileApi.post(`/transactions/${id}/handshake/request-code`);
    return res.data;
  },

  async confirmHandshake(id: string, handshakeCode?: string) {
    const res = await mobileApi.patch(`/transactions/${id}/handshake/confirm`, {
      ...(handshakeCode ? { handshakeCode: handshakeCode.trim() } : {}),
    });
    return res.data;
  },

  // Backward-compatible helper for older mobile code paths.
  async completeTransaction(id: string, handshakeCode: string) {
    return this.confirmHandshake(id, handshakeCode);
  },

  async cancelTransaction(id: string, reason: string = 'Cancelled by mutual student agreement') {
    const res = await mobileApi.patch(`/transactions/${id}/cancel`, {
      reason,
    });
    return res.data;
  },
};
