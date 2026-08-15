import React, { createContext, useContext, useState } from 'react';
import { WantedRequest, Campus, College } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from './AuthContext';

export const SEED_WANTED_REQUESTS: WantedRequest[] = [
  {
    id: 'req-1',
    requesterId: 'user-alex',
    requesterName: 'Alex Rivera',
    requesterAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
    requesterCampus: 'UC Main',
    requesterCollege: 'Senior High (STEM)',
    itemTitle: 'Rex Grade 11 STEM Pre-Calculus Textbook (Latest Edition)',
    category: 'Textbooks',
    targetBudget: 350,
    urgency: 'Immediate / Urgent',
    description: 'Looking for a clean copy of the Grade 11 Pre-Cal book with no missing pages for our upcoming prelim exam.',
    preferredCampus: 'UC Main',
    status: 'open',
    offersCount: 2,
    createdAt: '2026-08-15T08:30:00Z'
  },
  {
    id: 'req-2',
    requesterId: 'user-maria',
    requesterName: 'Maria Santos',
    requesterAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    requesterCampus: 'UC Banilad',
    requesterCollege: 'Nursing',
    itemTitle: 'Littmann Classic III Stethoscope (Navy Blue / Black)',
    category: 'Uniforms & Gear',
    targetBudget: 2800,
    urgency: 'This Week',
    description: 'Looking for a genuine Littmann stethoscope in good working condition for clinical duty at Banilad hospital.',
    preferredCampus: 'UC Banilad',
    status: 'open',
    offersCount: 4,
    createdAt: '2026-08-15T09:15:00Z'
  },
  {
    id: 'req-3',
    requesterId: 'user-ken',
    requesterName: 'Kenzo Lim',
    requesterAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    requesterCampus: 'UC LM',
    requesterCollege: 'Engineering',
    itemTitle: 'Rotring Drafting Board A3 / Technical T-Square Set',
    category: 'Instruments',
    targetBudget: 900,
    urgency: 'This Week',
    description: 'Need complete drafting tools for 2nd year Engineering drawing subject. Can meet at UC LM Innovation lobby.',
    preferredCampus: 'UC LM',
    status: 'open',
    offersCount: 1,
    createdAt: '2026-08-14T14:20:00Z'
  },
  {
    id: 'req-4',
    requesterId: 'user-beatrice',
    requesterName: 'Beatrice Tan',
    requesterAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    requesterCampus: 'UC METC',
    requesterCollege: 'Maritime',
    itemTitle: 'Casio fx-991CW ClassWiz Scientific Calculator',
    category: 'Electronics',
    targetBudget: 950,
    urgency: 'Immediate / Urgent',
    description: 'Looking for Casio 991CW with hard slide cover for maritime navigation calculations.',
    preferredCampus: 'UC METC',
    status: 'open',
    offersCount: 3,
    createdAt: '2026-08-15T11:00:00Z'
  }
];

interface WantedContextType {
  requests: WantedRequest[];
  addRequest: (params: {
    itemTitle: string;
    category: string;
    targetBudget: number;
    urgency: 'Immediate / Urgent' | 'This Week' | 'Flexible';
    description: string;
    preferredCampus: Campus;
  }) => WantedRequest;
  respondToRequest: (requestId: string) => void;
  fulfillRequest: (requestId: string) => void;
}

const WantedContext = createContext<WantedContextType | undefined>(undefined);

export const WantedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useLocalStorage<WantedRequest[]>('tradelink_wanted_requests', SEED_WANTED_REQUESTS);

  const addRequest = (params: {
    itemTitle: string;
    category: string;
    targetBudget: number;
    urgency: 'Immediate / Urgent' | 'This Week' | 'Flexible';
    description: string;
    preferredCampus: Campus;
  }): WantedRequest => {
    const user = currentUser || {
      id: 'user-maria',
      name: 'Maria Santos',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      campus: params.preferredCampus,
      college: 'Nursing' as College
    };

    const newReq: WantedRequest = {
      id: `req-${Date.now()}`,
      requesterId: user.id,
      requesterName: user.name,
      requesterAvatar: user.avatar,
      requesterCampus: user.campus,
      requesterCollege: user.college,
      itemTitle: params.itemTitle.trim(),
      category: params.category,
      targetBudget: params.targetBudget,
      urgency: params.urgency,
      description: params.description.trim(),
      preferredCampus: params.preferredCampus,
      status: 'open',
      offersCount: 0,
      createdAt: new Date().toISOString()
    };

    setRequests((prev) => {
      if (prev.some((r) => r.id === newReq.id)) return prev;
      return [newReq, ...prev];
    });

    return newReq;
  };

  const respondToRequest = (requestId: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, offersCount: r.offersCount + 1 } : r))
    );
  };

  const fulfillRequest = (requestId: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'fulfilled' } : r))
    );
  };

  return (
    <WantedContext.Provider
      value={{
        requests,
        addRequest,
        respondToRequest,
        fulfillRequest
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
