import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WantedRequest, Campus } from '../types';
import { useAuth } from './AuthContext';
import { wantedService } from '../services/wanted.service';

interface WantedContextType {
  requests: WantedRequest[];
  isLoading: boolean;
  addRequest: (params: {
    itemTitle: string;
    category: string;
    targetBudget: number;
    urgency: 'Immediate / Urgent' | 'This Week' | 'Flexible';
    description: string;
    preferredCampus: Campus;
  }) => Promise<WantedRequest>;
  respondToRequest: (requestId: string, offerMessage?: string) => Promise<void>;
  fulfillRequest: (requestId: string) => Promise<void>;
  deleteRequest: (requestId: string) => Promise<void>;
  refreshRequests: () => Promise<void>;
}

const WantedContext = createContext<WantedContextType | undefined>(undefined);

export const WantedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<WantedRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const serverRequests = await wantedService.getRequests();
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
    urgency: 'Immediate / Urgent' | 'This Week' | 'Flexible';
    description: string;
    preferredCampus: Campus;
  }): Promise<WantedRequest> => {
    if (!currentUser) {
      throw new Error('Please log in to post a wanted item request.');
    }

    const payload = {
      itemTitle: params.itemTitle.trim(),
      category: params.category,
      targetBudget: params.targetBudget,
      urgency: params.urgency,
      description: params.description.trim(),
      preferredCampus: params.preferredCampus,
    };

    const created = await wantedService.createRequest(payload);
    setRequests((prev) => [created, ...prev]);
    return created;
  };

  const respondToRequest = async (requestId: string, offerMessage?: string) => {
    await wantedService.respondToRequest(requestId, offerMessage);
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, offersCount: r.offersCount + 1 } : r))
    );
  };

  const fulfillRequest = async (requestId: string) => {
    await wantedService.fulfillRequest(requestId);
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'fulfilled' } : r))
    );
  };

  const deleteRequest = async (requestId: string) => {
    await wantedService.deleteRequest(requestId);
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  return (
    <WantedContext.Provider
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
    </WantedContext.Provider>
  );
};

export const useWanted = () => {
  const context = useContext(WantedContext);
  if (!context) {
    throw new Error('useWanted must be used within a WantedProvider');
  }
  return context;
};
