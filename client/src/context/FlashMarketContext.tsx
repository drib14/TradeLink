import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { FlashRequest, Campus } from '../types';
import { useAuth } from './AuthContext';
import { flashMarketService } from '../services/flashMarket.service';

interface FlashMarketContextType {
  requests: FlashRequest[];
  isLoading: boolean;
  addRequest: (params: {
    itemTitle: string;
    category: string;
    targetBudget: number;
    urgency: 'Immediate / Urgent' | 'This Week' | 'Flexible' | 'immediate' | 'this_week' | 'flexible';
    description: string;
    preferredCampus: Campus;
    durationHours?: number;
    imageUrl?: string;
  }) => Promise<FlashRequest>;
  respondToRequest: (requestId: string, offerMessage?: string) => Promise<void>;
  fulfillRequest: (requestId: string) => Promise<void>;
  deleteRequest: (requestId: string) => Promise<void>;
  refreshRequests: () => Promise<void>;
}

const FlashMarketContext = createContext<FlashMarketContextType | undefined>(undefined);

export const FlashMarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<FlashRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const serverRequests = await flashMarketService.getRequests();
      if (Array.isArray(serverRequests)) {
        setRequests(serverRequests);
      }
    } catch {
      // Backend error or network error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshRequests();
  }, [refreshRequests]);

  const addRequest = async (params: {
    itemTitle: string;
    category: string;
    targetBudget: number;
    urgency: 'Immediate / Urgent' | 'This Week' | 'Flexible' | 'immediate' | 'this_week' | 'flexible';
    description: string;
    preferredCampus: Campus;
    durationHours?: number;
    imageUrl?: string;
  }): Promise<FlashRequest> => {
    if (!currentUser) {
      throw new Error('Please log in to post an urgent Flash Request.');
    }

    const payload = {
      itemTitle: params.itemTitle.trim(),
      category: params.category,
      targetBudget: params.targetBudget,
      urgency: params.urgency,
      durationHours: params.durationHours || (params.urgency === 'Immediate / Urgent' || params.urgency === 'immediate' ? 24 : params.urgency === 'This Week' || params.urgency === 'this_week' ? 72 : 168),
      description: params.description.trim(),
      preferredCampus: params.preferredCampus,
      imageUrl: params.imageUrl,
    };

    const created = await flashMarketService.createRequest(payload);
    setRequests((prev) => [created, ...prev]);
    return created;
  };

  const respondToRequest = async (requestId: string, offerMessage?: string) => {
    await flashMarketService.respondToRequest(requestId, offerMessage);
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, offersCount: r.offersCount + 1 } : r))
    );
  };

  const fulfillRequest = async (requestId: string) => {
    await flashMarketService.fulfillRequest(requestId);
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'fulfilled' } : r))
    );
  };

  const deleteRequest = async (requestId: string) => {
    await flashMarketService.deleteRequest(requestId);
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  return (
    <FlashMarketContext.Provider
      value={{
        requests,
        isLoading,
        addRequest,
        respondToRequest,
        fulfillRequest,
        deleteRequest,
        refreshRequests
      }}
    >
      {children}
    </FlashMarketContext.Provider>
  );
};

export const useFlashMarket = () => {
  const context = useContext(FlashMarketContext);
  if (!context) {
    throw new Error('useFlashMarket must be used within a FlashMarketProvider');
  }
  return context;
};
