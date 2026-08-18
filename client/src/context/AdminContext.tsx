import React, { createContext, useContext } from 'react';
import { VerificationRequest, Campus, CampusAnnouncement, AdminAuditLog, TradeDispute, SuperAdminConfig } from '../types';
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
  announcements: CampusAnnouncement[];
  auditLogs: AdminAuditLog[];
  prohibitedKeywords: string[];
  disputes: TradeDispute[];
  systemConfig: SuperAdminConfig;
  pendingVerificationsCount: number;
  pendingFlagsCount: number;
  pendingDisputesCount: number;
  approveVerification: (requestId: string) => void;
  rejectVerification: (requestId: string, reason?: string) => void;
  reportListing: (listingId: string, listingTitle: string, listingImage: string, sellerName: string, campus: Campus, reason: string) => void;
  resolveFlag: (flagId: string) => void;
  removeListingByAdmin: (flagId: string, listingId: string, reason?: string) => void;
  boostListingByAdmin: (listingId: string) => void;
  banUserByAdmin: (userId: string, reason: string) => void;
  unbanUserByAdmin: (userId: string) => void;
  warnUserByAdmin: (userId: string, note?: string) => void;
  toggleVerifyByAdmin: (userId: string) => void;
  deleteUserByAdmin: (userId: string) => void;
  createAnnouncement: (title: string, message: string, campus: Campus | 'All', type: 'info' | 'alert' | 'event') => void;
  deleteAnnouncement: (id: string) => void;
  toggleAnnouncement: (id: string) => void;
  removeWantedByAdmin: (wantedId: string, reason?: string) => void;
  cancelMeetupByAdmin: (meetupId: string, reason?: string) => void;
  completeMeetupByAdmin: (meetupId: string) => void;
  addProhibitedKeyword: (word: string) => void;
  removeProhibitedKeyword: (word: string) => void;
  resolveDispute: (disputeId: string, action: 'refund' | 'warning' | 'dismissed' | 'ban', note: string) => void;
  adjustUserTrustScore: (userId: string, delta: number, reason: string) => void;
  promoteToAdmin: (userId: string) => void;
  demoteAdmin: (userId: string) => void;
  updateSystemConfig: (updates: Partial<SuperAdminConfig>) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { allUsers, banUser, unbanUser, warnUser, toggleVerifyUser, deleteUser, updateProfile, currentUser } = useAuth();
  
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

  const [prohibitedKeywords, setProhibitedKeywords] = useLocalStorage<string[]>(
    'tradelink_prohibited_keywords',
    [
      'exam leak',
      'test bank',
      'test paper',
      'midterm answer',
      'final exam key',
      'vape',
      'pod',
      'cigarette',
      'smoke',
      'counterfeit uniform',
      'fake id',
      'liquor',
      'beer',
      'gambling',
      'weapon',
      'knife',
      'proxy test'
    ]
  );

  const [disputes, setDisputes] = useLocalStorage<TradeDispute[]>(
    'tradelink_disputes',
    [
      {
        id: 'disp-1',
        listingTitle: 'UC Nursing Duty Scrubs (Size M, Navy Blue)',
        buyerName: 'Chloe Mendoza',
        sellerName: 'Maria Santos',
        sellerId: 'user-maria',
        buyerId: 'user-chloe',
        campus: 'UC Banilad',
        reason: 'Small tear near left pocket not listed in description. Requested partial refund or replacement.',
        status: 'pending',
        filedAt: '2026-08-16T11:30:00Z'
      },
      {
        id: 'disp-2',
        listingTitle: 'Casio Scientific Calculator FX-991ES Plus-2',
        buyerName: 'Dave Alcantara',
        sellerName: 'Kenzo Lim',
        sellerId: 'user-ken',
        buyerId: 'user-dave',
        campus: 'UC LM',
        reason: 'Seller was 35 minutes late to the Mandaue bridge gate meetup.',
        status: 'pending',
        filedAt: '2026-08-17T14:15:00Z'
      }
    ]
  );

  const [announcements, setAnnouncements] = useLocalStorage<CampusAnnouncement[]>(
    'tradelink_announcements',
    [
      {
        id: 'ann-1',
        title: 'Guarded Meetup Reminder',
        message: 'Always meet inside official UC campus security gates during daytime hours. Inspect items before scanning the Handshake QR code.',
        campus: 'All',
        type: 'alert',
        authorName: 'UC Administration',
        createdAt: '2026-08-14T08:00:00Z',
        isActive: true
      },
      {
        id: 'ann-2',
        title: 'Junior High & Senior High Trading Desk Live',
        message: 'Students from UC PRI and UC South high school departments can now trade textbooks and PE uniforms with zero platform fees.',
        campus: 'UC PRI',
        type: 'info',
        authorName: 'High School Coordinator',
        createdAt: '2026-08-15T09:00:00Z',
        isActive: true
      }
    ]
  );

  const [auditLogs, setAuditLogs] = useLocalStorage<AdminAuditLog[]>(
    'tradelink_audit_logs',
    [
      {
        id: 'log-1',
        adminName: 'UC Admin Moderator',
        action: 'Platform Initialized',
        targetType: 'system',
        targetId: 'system',
        details: 'Admin desk initialized for University of Cebu campus network',
        timestamp: '2026-08-14T08:00:00Z'
      }
    ]
  );

  const logAction = (
    action: string,
    targetType: 'user' | 'listing' | 'verification' | 'wanted' | 'meetup' | 'announcement' | 'dispute' | 'system',
    targetId: string,
    details: string
  ) => {
    const newLog: AdminAuditLog = {
      id: `log-${Date.now()}`,
      adminName: currentUser?.name || 'UC Admin Moderator',
      action,
      targetType,
      targetId,
      details,
      timestamp: new Date().toISOString()
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const pendingVerificationsCount = verificationRequests.filter((r) => r.status === 'pending').length;
  const pendingFlagsCount = flaggedListings.filter((f) => f.status === 'pending').length;
  const pendingDisputesCount = disputes.filter((d) => d.status === 'pending').length;

  const approveVerification = (requestId: string) => {
    const req = verificationRequests.find((r) => r.id === requestId);
    if (!req) return;

    setVerificationRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, status: 'approved', reviewedAt: new Date().toISOString() } : r
      )
    );

    // Verify user in Auth store
    toggleVerifyUser(req.userId);
    logAction('Approved Student Verification', 'verification', requestId, `Verified ${req.userName} (${req.campus})`);
  };

  const rejectVerification = (requestId: string, reason: string = 'Incomplete or unreadable ID photo') => {
    const req = verificationRequests.find((r) => r.id === requestId);
    setVerificationRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, status: 'rejected', reviewedAt: new Date().toISOString() } : r
      )
    );
    if (req) {
      logAction('Rejected Verification', 'verification', requestId, `Declined ${req.userName}: ${reason}`);
    }
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
    const flag = flaggedListings.find((f) => f.id === flagId);
    setFlaggedListings((prev) =>
      prev.map((f) => (f.id === flagId ? { ...f, status: 'resolved' } : f))
    );
    if (flag) {
      logAction('Resolved Listing Report', 'listing', flag.listingId, `Marked listing "${flag.listingTitle}" as safe`);
    }
  };

  const removeListingByAdmin = (flagId: string, listingId: string, reason: string = 'Violation of prohibited items policy') => {
    const flag = flaggedListings.find((f) => f.id === flagId || f.listingId === listingId);
    setFlaggedListings((prev) =>
      prev.map((f) => (f.id === flagId || f.listingId === listingId ? { ...f, status: 'removed' } : f))
    );

    // Remove listing from market localStorage
    const listingsInStorage = JSON.parse(window.localStorage.getItem('tradelink_listings') || '[]');
    const updated = listingsInStorage.filter((l: any) => l.id !== listingId);
    window.localStorage.setItem('tradelink_listings', JSON.stringify(updated));
    window.dispatchEvent(new Event('local-storage-tradelink_listings'));

    logAction('Deleted Listing', 'listing', listingId, `Removed item "${flag?.listingTitle || listingId}": ${reason}`);
  };

  const boostListingByAdmin = (listingId: string) => {
    const listingsInStorage = JSON.parse(window.localStorage.getItem('tradelink_listings') || '[]');
    const target = listingsInStorage.find((l: any) => l.id === listingId);
    const updated = listingsInStorage.map((l: any) =>
      l.id === listingId ? { ...l, isBoosted: !l.isBoosted } : l
    );
    window.localStorage.setItem('tradelink_listings', JSON.stringify(updated));
    window.dispatchEvent(new Event('local-storage-tradelink_listings'));

    logAction(
      target?.isBoosted ? 'Removed Boost' : 'Boosted Listing',
      'listing',
      listingId,
      `Toggled hero boost for "${target?.title || listingId}"`
    );
  };

  const banUserByAdmin = (userId: string, reason: string) => {
    const targetUser = allUsers.find((u) => u.id === userId);
    banUser(userId, reason);
    logAction('Banned User Account', 'user', userId, `Banned ${targetUser?.name || userId} (${targetUser?.campus}): ${reason}`);
  };

  const unbanUserByAdmin = (userId: string) => {
    const targetUser = allUsers.find((u) => u.id === userId);
    unbanUser(userId);
    logAction('Unbanned User Account', 'user', userId, `Restored account access for ${targetUser?.name || userId}`);
  };

  const warnUserByAdmin = (userId: string, note: string = 'Warning issued for inappropriate activity') => {
    const targetUser = allUsers.find((u) => u.id === userId);
    warnUser(userId, note);
    logAction('Issued User Warning', 'user', userId, `Warned ${targetUser?.name || userId}: ${note}`);
  };

  const toggleVerifyByAdmin = (userId: string) => {
    const targetUser = allUsers.find((u) => u.id === userId);
    toggleVerifyUser(userId);
    logAction('Toggled Verification', 'user', userId, `Updated verification status for ${targetUser?.name || userId}`);
  };

  const deleteUserByAdmin = (userId: string) => {
    const targetUser = allUsers.find((u) => u.id === userId);
    deleteUser(userId);
    logAction('Deleted User Account', 'user', userId, `Permanently deleted ${targetUser?.name || userId}`);
  };

  const createAnnouncement = (title: string, message: string, campus: Campus | 'All', type: 'info' | 'alert' | 'event') => {
    const newAnn: CampusAnnouncement = {
      id: `ann-${Date.now()}`,
      title,
      message,
      campus,
      type,
      authorName: currentUser?.name || 'UC Administration',
      createdAt: new Date().toISOString(),
      isActive: true
    };
    setAnnouncements((prev) => [newAnn, ...prev]);
    logAction('Created Campus Announcement', 'announcement', newAnn.id, `Posted "${title}" for ${campus}`);
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    logAction('Deleted Announcement', 'announcement', id, `Removed announcement ${id}`);
  };

  const toggleAnnouncement = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
  };

  const removeWantedByAdmin = (wantedId: string, reason: string = 'Inappropriate wanted request') => {
    const wantedInStorage = JSON.parse(window.localStorage.getItem('tradelink_wanted_requests') || '[]');
    const updated = wantedInStorage.filter((w: any) => w.id !== wantedId);
    window.localStorage.setItem('tradelink_wanted_requests', JSON.stringify(updated));
    window.dispatchEvent(new Event('local-storage-tradelink_wanted_requests'));
    logAction('Deleted Wanted Request', 'wanted', wantedId, `Removed wanted post: ${reason}`);
  };

  const cancelMeetupByAdmin = (meetupId: string, reason: string = 'Safety dispute or cancelled by administration') => {
    const meetupsInStorage = JSON.parse(window.localStorage.getItem('tradelink_meetups') || '[]');
    const updated = meetupsInStorage.map((m: any) =>
      m.id === meetupId ? { ...m, status: 'cancelled' } : m
    );
    window.localStorage.setItem('tradelink_meetups', JSON.stringify(updated));
    window.dispatchEvent(new Event('local-storage-tradelink_meetups'));
    logAction('Cancelled Meetup Transaction', 'meetup', meetupId, `Admin cancelled meetup: ${reason}`);
  };

  const completeMeetupByAdmin = (meetupId: string) => {
    const meetupsInStorage = JSON.parse(window.localStorage.getItem('tradelink_meetups') || '[]');
    const updated = meetupsInStorage.map((m: any) =>
      m.id === meetupId ? { ...m, status: 'completed', completedAt: new Date().toISOString() } : m
    );
    window.localStorage.setItem('tradelink_meetups', JSON.stringify(updated));
    window.dispatchEvent(new Event('local-storage-tradelink_meetups'));
    logAction('Force-Completed Meetup', 'meetup', meetupId, `Admin verified & completed handshake`);
  };

  const addProhibitedKeyword = (word: string) => {
    const trimmed = word.trim().toLowerCase();
    if (!trimmed || prohibitedKeywords.includes(trimmed)) return;
    setProhibitedKeywords((prev) => [...prev, trimmed]);
    logAction('Added Prohibited Keyword', 'system', `keyword-${trimmed}`, `Added auto-moderation filter for "${trimmed}"`);
  };

  const removeProhibitedKeyword = (word: string) => {
    setProhibitedKeywords((prev) => prev.filter((k) => k !== word));
    logAction('Removed Prohibited Keyword', 'system', `keyword-${word}`, `Removed keyword filter for "${word}"`);
  };

  const resolveDispute = (
    disputeId: string,
    action: 'refund' | 'warning' | 'dismissed' | 'ban',
    note: string
  ) => {
    const target = disputes.find((d) => d.id === disputeId);
    if (!target) return;

    setDisputes((prev) =>
      prev.map((d) =>
        d.id === disputeId
          ? {
              ...d,
              status: action === 'dismissed' ? 'dismissed' : 'resolved',
              verdictAction: action,
              verdictNote: note
            }
          : d
      )
    );

    if (action === 'warning') {
      warnUserByAdmin(target.sellerId, `Dispute Resolution Strike: ${note}`);
    } else if (action === 'ban') {
      banUserByAdmin(target.sellerId, `Banned via Dispute Mediation: ${note}`);
    }

    logAction('Resolved Dispute Case', 'dispute', disputeId, `Verdict [${action.toUpperCase()}]: ${note}`);
  };

  const adjustUserTrustScore = (userId: string, delta: number, reason: string) => {
    const targetUser = allUsers.find((u) => u.id === userId);
    if (!targetUser) return;
    const currentScore = targetUser.trustScore || 80;
    const newScore = Math.max(0, Math.min(100, currentScore + delta));
    updateProfile({ trustScore: newScore });

    const usersInStorage = JSON.parse(window.localStorage.getItem('tradelink_users_v2') || '[]');
    const updated = usersInStorage.map((u: any) =>
      u.id === userId ? { ...u, trustScore: newScore } : u
    );
    window.localStorage.setItem('tradelink_users_v2', JSON.stringify(updated));
    window.dispatchEvent(new Event('local-storage-tradelink_users_v2'));

    logAction(
      delta >= 0 ? 'Awarded Trust Score' : 'Deducted Trust Score',
      'user',
      userId,
      `Adjusted ${targetUser.name} score from ${currentScore} to ${newScore} (${delta >= 0 ? '+' : ''}${delta}): ${reason}`
    );
  };

  const DEFAULT_SYSTEM_CONFIG: SuperAdminConfig = {
    maintenanceMode: false,
    maxListingPrice: 50000,
    maxImagesPerListing: 5,
    swapModeEnabled: true,
    wantedBoardEnabled: true,
    freeDonationEnabled: true,
    maxListingsPerUser: 20,
    featureFlags: [
      { id: 'ff-1', name: 'Price Advisor AI', description: 'Enable AI-powered pricing suggestions', enabled: true, updatedAt: new Date().toISOString() },
      { id: 'ff-2', name: 'Campus Map', description: 'Interactive campus meetup map', enabled: true, updatedAt: new Date().toISOString() },
      { id: 'ff-3', name: 'Pro Merchant Badge', description: 'Allow pro merchant status for top sellers', enabled: true, updatedAt: new Date().toISOString() },
      { id: 'ff-4', name: 'Dark Mode', description: 'Dark mode toggle for all users', enabled: false, updatedAt: new Date().toISOString() },
    ],
    lastUpdatedBy: 'system',
    lastUpdatedAt: new Date().toISOString()
  };

  const [systemConfig, setSystemConfig] = useLocalStorage<SuperAdminConfig>(
    'tradelink_system_config',
    DEFAULT_SYSTEM_CONFIG
  );

  const promoteToAdmin = (userId: string) => {
    const user = allUsers.find((u) => u.id === userId);
    if (!user || user.role !== 'student') return;
    // Trigger role change through the auth context's banUser-style direct state update isn't available,
    // so we log the action. The actual role change will be handled via the users state in auth.
    logAction('Promoted to Admin', 'user', userId, `Promoted ${user.name} to Admin role`);
  };

  const demoteAdmin = (userId: string) => {
    const user = allUsers.find((u) => u.id === userId);
    if (!user || user.role !== 'admin') return;
    logAction('Demoted from Admin', 'user', userId, `Demoted ${user.name} to Student role`);
  };

  const updateSystemConfig = (updates: Partial<SuperAdminConfig>) => {
    setSystemConfig((prev) => ({
      ...prev,
      ...updates,
      lastUpdatedBy: currentUser?.name || 'system',
      lastUpdatedAt: new Date().toISOString()
    }));
    logAction('System Config Updated', 'system', 'config', `Updated system configuration: ${Object.keys(updates).join(', ')}`);
  };

  return (
    <AdminContext.Provider
      value={{
        verificationRequests,
        flaggedListings,
        announcements,
        auditLogs,
        prohibitedKeywords,
        disputes,
        systemConfig,
        pendingVerificationsCount,
        pendingFlagsCount,
        pendingDisputesCount,
        approveVerification,
        rejectVerification,
        reportListing,
        resolveFlag,
        removeListingByAdmin,
        boostListingByAdmin,
        banUserByAdmin,
        unbanUserByAdmin,
        warnUserByAdmin,
        toggleVerifyByAdmin,
        deleteUserByAdmin,
        createAnnouncement,
        deleteAnnouncement,
        toggleAnnouncement,
        removeWantedByAdmin,
        cancelMeetupByAdmin,
        completeMeetupByAdmin,
        addProhibitedKeyword,
        removeProhibitedKeyword,
        resolveDispute,
        adjustUserTrustScore,
        promoteToAdmin,
        demoteAdmin,
        updateSystemConfig
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

