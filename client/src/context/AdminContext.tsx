import React, { createContext, useContext, useState } from 'react';
import { VerificationRequest, Campus } from '../types';
import { SEED_VERIFICATION_REQUESTS } from '../data/seedData';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from './AuthContext';

export interface FlaggedListingItem {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  sellerName: string;
  reporterName: string;
  reason: string;
  campus: Campus;
  reportedAt: string;
  status: 'pending' | 'resolved' | 'removed';
}

interface AdminContextType {
  verificationRequests: VerificationRequest[];
  flaggedListings: FlaggedListingItem[];
  pendingVerificationsCount: number;
  pendingFlagsCount: number;
  approveVerification: (requestId: string) => void;
  rejectVerification: (requestId: string) => void;
  reportListing: (listingId: string, listingTitle: string, listingImage: string, sellerName: string, campus: Campus, reason: string) => void;
  resolveFlag: (flagId: string) => void;
  removeListingByAdmin: (flagId: string, listingId: string) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { allUsers, updateProfile } = useAuth();
  const [verificationRequests, setVerificationRequests] = useLocalStorage<VerificationRequest[]>(
    'tradelink_verifications',
    SEED_VERIFICATION_REQUESTS
  );

  const [flaggedListings, setFlaggedListings] = useLocalStorage<FlaggedListingItem[]>(
    'tradelink_flags',
    [
      {
        id: 'flag-1',
        listingId: 'list-12',
        listingTitle: 'Rechargeable LED Study Lamp with Pen Holder',
        listingImage: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
        sellerName: 'Alex Rivera',
        reporterName: 'Dave Alcantara',
        reason: 'Price might be slightly high for a generic lamp; requesting review.',
        campus: 'UC Main',
        reportedAt: '2026-08-14T16:00:00Z',
        status: 'pending'
      }
    ]
  );

  const pendingVerificationsCount = verificationRequests.filter((r) => r.status === 'pending').length;
  const pendingFlagsCount = flaggedListings.filter((f) => f.status === 'pending').length;

  const approveVerification = (requestId: string) => {
    const req = verificationRequests.find((r) => r.id === requestId);
    if (!req) return;

    // Update request
    setVerificationRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, status: 'approved', reviewedAt: new Date().toISOString() } : r
      )
    );

    // Update user's verification state in users store
    const usersInStorage = JSON.parse(window.localStorage.getItem('tradelink_users') || '[]');
    const updatedUsers = usersInStorage.map((u: any) =>
      u.id === req.userId ? { ...u, isVerified: true, trustScore: Math.min(100, u.trustScore + 30) } : u
    );
    window.localStorage.setItem('tradelink_users', JSON.stringify(updatedUsers));
    window.dispatchEvent(new Event('local-storage-tradelink_users'));
  };

  const rejectVerification = (requestId: string) => {
    setVerificationRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, status: 'rejected', reviewedAt: new Date().toISOString() } : r
      )
    );
  };

  const reportListing = (
    listingId: string,
    listingTitle: string,
    listingImage: string,
    sellerName: string,
    campus: Campus,
    reason: string
  ) => {
    const newFlag: FlaggedListingItem = {
      id: `flag-${Date.now()}`,
      listingId,
      listingTitle,
      listingImage,
      sellerName,
      reporterName: 'Anonymous UCian',
      reason,
      campus,
      reportedAt: new Date().toISOString(),
      status: 'pending'
    };

    setFlaggedListings((prev) => [newFlag, ...prev]);
  };

  const resolveFlag = (flagId: string) => {
    setFlaggedListings((prev) =>
      prev.map((f) => (f.id === flagId ? { ...f, status: 'resolved' } : f))
    );
  };

  const removeListingByAdmin = (flagId: string, listingId: string) => {
    setFlaggedListings((prev) =>
      prev.map((f) => (f.id === flagId ? { ...f, status: 'removed' } : f))
    );

    // Remove listing from market
    const listingsInStorage = JSON.parse(window.localStorage.getItem('tradelink_listings') || '[]');
    const updated = listingsInStorage.filter((l: any) => l.id !== listingId);
    window.localStorage.setItem('tradelink_listings', JSON.stringify(updated));
    window.dispatchEvent(new Event('local-storage-tradelink_listings'));
  };

  return (
    <AdminContext.Provider
      value={{
        verificationRequests,
        flaggedListings,
        pendingVerificationsCount,
        pendingFlagsCount,
        approveVerification,
        rejectVerification,
        reportListing,
        resolveFlag,
        removeListingByAdmin
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
