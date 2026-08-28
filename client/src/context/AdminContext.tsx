import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  VerificationRequest,
  FlaggedListingItem,
  CampusAnnouncement,
  AdminAuditLog,
  TradeDispute,
  SuperAdminConfig,
  Campus
} from '../types';
import { useAuth } from './AuthContext';
import { adminService } from '../services/admin.service';

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
  isLoading: boolean;
  approveVerification: (requestId: string) => Promise<void>;
  rejectVerification: (requestId: string, reason?: string) => Promise<void>;
  reportListing: (listingId: string, listingTitle: string, listingImage: string, sellerName: string, campus: Campus, reason: string) => Promise<void>;
  resolveFlag: (flagId: string) => Promise<void>;
  removeListingByAdmin: (flagId: string, listingId: string, reason?: string) => Promise<void>;
  boostListingByAdmin: (listingId: string) => void;
  banUserByAdmin: (userId: string, reason: string) => void;
  unbanUserByAdmin: (userId: string) => void;
  warnUserByAdmin: (userId: string, note?: string) => void;
  toggleVerifyByAdmin: (userId: string) => void;
  deleteUserByAdmin: (userId: string) => void;
  createAnnouncement: (title: string, message: string, campus: Campus | 'All', type: 'info' | 'alert' | 'event') => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  toggleAnnouncement: (id: string) => void;
  removeWantedByAdmin: (wantedId: string, reason?: string) => void;
  cancelMeetupByAdmin: (meetupId: string, reason?: string) => void;
  completeMeetupByAdmin: (meetupId: string) => void;
  addProhibitedKeyword: (word: string) => Promise<void>;
  removeProhibitedKeyword: (word: string) => Promise<void>;
  resolveDispute: (disputeId: string, action: 'refund' | 'warning' | 'dismissed' | 'ban', note: string) => Promise<void>;
  adjustUserTrustScore: (userId: string, delta: number, reason: string) => void;
  promoteToAdmin: (userId: string) => void;
  demoteAdmin: (userId: string) => void;
  updateSystemConfig: (updates: Partial<SuperAdminConfig>) => Promise<void>;
  refreshAdminData: () => Promise<void>;
}

const DEFAULT_CONFIG: SuperAdminConfig = {
  maintenanceMode: false,
  maintenanceMessage: 'TradeLink is currently undergoing scheduled platform upgrades.',
  allowNewRegistrations: true,
  requireStrictStudentEmail: false,
  globalCommissionRate: 0,
  maxDailyListingsPerUser: 10,
  autoVerifyTrustScoreThreshold: 90,
  featureFlags: [
    { id: 'flag-barter-system', name: 'Item Swap / Barter Engine', description: 'Enable direct trade proposals with cash adjustments', enabled: true },
    { id: 'flag-instant-chat', name: 'Peer-to-Peer Realtime Chat', description: 'Enable instant buyer-seller messaging thread', enabled: true },
    { id: 'flag-wanted-board', name: 'Campus Wanted Board', description: 'Enable student Looking-To-Buy requests', enabled: true },
    { id: 'flag-handshake-meetup', name: '4-Digit Handshake Verification', description: 'Enforce meetup OTP handshake codes', enabled: true }
  ],
  lastUpdatedBy: 'System SuperAdmin',
  lastUpdatedAt: new Date().toISOString()
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { allUsers, banUser, unbanUser, warnUser, toggleVerifyUser, deleteUser, updateProfile, currentUser, isAdmin } = useAuth();

  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [flaggedListings, setFlaggedListings] = useState<FlaggedListingItem[]>([]);
  const [announcements, setAnnouncements] = useState<CampusAnnouncement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [prohibitedKeywords, setProhibitedKeywords] = useState<string[]>([
    'exam leak', 'test bank', 'midterm answer', 'final exam key', 'vape', 'cigarette', 'counterfeit uniform', 'fake id', 'liquor'
  ]);
  const [disputes, setDisputes] = useState<TradeDispute[]>([]);
  const [systemConfig, setSystemConfig] = useState<SuperAdminConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(false);

  const refreshAdminData = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const [verifs, flags, disps, anns, logs, keys, cfg] = await Promise.allSettled([
        adminService.getVerifications(),
        adminService.getFlaggedListings(),
        adminService.getDisputes(),
        adminService.getAnnouncements(),
        adminService.getAuditLogs(),
        adminService.getKeywords(),
        adminService.getSystemConfig()
      ]);

      if (verifs.status === 'fulfilled' && verifs.value.length > 0) {
        setVerificationRequests(verifs.value);
      }
      if (flags.status === 'fulfilled' && flags.value.length > 0) {
        setFlaggedListings(flags.value);
      }
      if (disps.status === 'fulfilled' && disps.value.length > 0) {
        setDisputes(disps.value);
      }
      if (anns.status === 'fulfilled' && anns.value.length > 0) {
        setAnnouncements(anns.value);
      }
      if (logs.status === 'fulfilled' && logs.value.length > 0) {
        setAuditLogs(logs.value);
      }
      if (keys.status === 'fulfilled' && keys.value.length > 0) {
        setProhibitedKeywords(keys.value);
      }
      if (cfg.status === 'fulfilled' && cfg.value) {
        setSystemConfig(cfg.value);
      }
    } catch {
      // Handled cleanly
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    refreshAdminData();
  }, [refreshAdminData]);

  const logAuditAction = (action: string, targetType: AdminAuditLog['targetType'], targetId: string, details: string) => {
    const newLog: AdminAuditLog = {
      id: `log-${Date.now()}`,
      adminName: currentUser?.name || 'Administrator',
      action,
      targetType,
      targetId,
      details,
      timestamp: new Date().toISOString()
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const approveVerification = async (requestId: string) => {
    const target = verificationRequests.find((r) => r.id === requestId);
    if (!target) return;

    setVerificationRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'approved', reviewedAt: new Date().toISOString() } : r))
    );

    toggleVerifyUser(target.userId);
    logAuditAction('APPROVED_VERIFICATION', 'verification', requestId, `Approved ID for ${target.userName}`);
    await adminService.approveVerification(requestId);
  };

  const rejectVerification = async (requestId: string, reason = 'Blurry image / expired COR') => {
    setVerificationRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'rejected', reviewedAt: new Date().toISOString() } : r))
    );
    logAuditAction('REJECTED_VERIFICATION', 'verification', requestId, `Rejected ID verification. Reason: ${reason}`);
    await adminService.rejectVerification(requestId, reason);
  };

  const reportListing = async (listingId: string, listingTitle: string, listingImage: string, sellerName: string, campus: Campus, reason: string) => {
    const newFlag: FlaggedListingItem = {
      id: `flag-${Date.now()}`,
      listingId,
      listingTitle,
      listingImage,
      sellerName,
      reporterName: currentUser?.name || 'Student Reporter',
      reason,
      campus,
      reportedAt: new Date().toISOString(),
      status: 'pending'
    };
    setFlaggedListings((prev) => [newFlag, ...prev]);
  };

  const resolveFlag = async (flagId: string) => {
    setFlaggedListings((prev) =>
      prev.map((f) => (f.id === flagId ? { ...f, status: 'resolved' } : f))
    );
    logAuditAction('RESOLVED_FLAG', 'listing', flagId, 'Marked flagged listing report as resolved (no policy violation found)');
    await adminService.resolveFlag(flagId, 'dismiss');
  };

  const removeListingByAdmin = async (flagId: string, listingId: string, reason = 'Prohibited item or terms violation') => {
    setFlaggedListings((prev) =>
      prev.map((f) => (f.id === flagId ? { ...f, status: 'removed' } : f))
    );
    logAuditAction('REMOVED_LISTING', 'listing', listingId, `Moderator removed listing. Reason: ${reason}`);
    await adminService.removeListingByAdmin(flagId, reason);
  };

  const boostListingByAdmin = (listingId: string) => {
    logAuditAction('BOOSTED_LISTING_ADMIN', 'listing', listingId, 'Elevated listing to priority feed position');
  };

  const banUserByAdmin = (userId: string, reason: string) => {
    banUser(userId, reason);
    logAuditAction('BANNED_USER', 'user', userId, `Suspended account access. Reason: ${reason}`);
  };

  const unbanUserByAdmin = (userId: string) => {
    unbanUser(userId);
    logAuditAction('UNBANNED_USER', 'user', userId, 'Restored account privileges');
  };

  const warnUserByAdmin = (userId: string, note?: string) => {
    warnUser(userId, note);
    logAuditAction('WARNED_USER', 'user', userId, `Issued official warning notice. Note: ${note || 'Community standards reminder'}`);
  };

  const toggleVerifyByAdmin = (userId: string) => {
    toggleVerifyUser(userId);
    logAuditAction('TOGGLED_VERIFICATION', 'user', userId, 'Manually toggled student ID verification status badge');
  };

  const deleteUserByAdmin = (userId: string) => {
    deleteUser(userId);
    logAuditAction('DELETED_USER_RECORD', 'user', userId, 'Permanently erased student account credentials');
  };

  const createAnnouncement = async (title: string, message: string, campus: Campus | 'All', type: 'info' | 'alert' | 'event') => {
    const newAnn: CampusAnnouncement = {
      id: `ann-${Date.now()}`,
      title: title.trim(),
      message: message.trim(),
      campus,
      type,
      authorName: currentUser?.name || 'Campus Moderation Desk',
      createdAt: new Date().toISOString(),
      isActive: true
    };
    setAnnouncements((prev) => [newAnn, ...prev]);
    logAuditAction('CREATED_ANNOUNCEMENT', 'announcement', newAnn.id, `Broadcasted: "${title}" to ${campus}`);
    await adminService.createAnnouncement(newAnn);
  };

  const deleteAnnouncement = async (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    logAuditAction('DELETED_ANNOUNCEMENT', 'announcement', id, 'Removed bulletin announcement');
    await adminService.deleteAnnouncement(id);
  };

  const toggleAnnouncement = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
  };

  const removeWantedByAdmin = (wantedId: string, reason = 'Policy non-compliance') => {
    logAuditAction('REMOVED_WANTED_POST', 'wanted', wantedId, `Removed wanted board request. Reason: ${reason}`);
  };

  const cancelMeetupByAdmin = (meetupId: string, reason = 'Safety concern intervention') => {
    logAuditAction('CANCELLED_MEETUP_ADMIN', 'meetup', meetupId, `Cancelled meetup. Reason: ${reason}`);
  };

  const completeMeetupByAdmin = (meetupId: string) => {
    logAuditAction('OVERRODE_MEETUP_COMPLETION', 'meetup', meetupId, 'Manually marked meetup as completed');
  };

  const addProhibitedKeyword = async (word: string) => {
    const cleanWord = word.trim().toLowerCase();
    if (!cleanWord || prohibitedKeywords.includes(cleanWord)) return;
    setProhibitedKeywords((prev) => [cleanWord, ...prev]);
    logAuditAction('ADDED_FILTER_KEYWORD', 'system', cleanWord, `Added "${cleanWord}" to auto-moderation keyword filter`);
    await adminService.addKeyword(cleanWord);
  };

  const removeProhibitedKeyword = async (word: string) => {
    setProhibitedKeywords((prev) => prev.filter((w) => w !== word.toLowerCase()));
    logAuditAction('REMOVED_FILTER_KEYWORD', 'system', word, `Removed "${word}" from auto-moderation filter`);
    await adminService.removeKeyword(word);
  };

  const resolveDispute = async (disputeId: string, action: 'refund' | 'warning' | 'dismissed' | 'ban', note: string) => {
    setDisputes((prev) =>
      prev.map((d) => (d.id === disputeId ? { ...d, status: 'resolved', verdictAction: action, verdictNote: note } : d))
    );
    logAuditAction('RESOLVED_TRADE_DISPUTE', 'dispute', disputeId, `Verdict: ${action.toUpperCase()}. Note: ${note}`);
    await adminService.resolveDispute(disputeId, action, note);
  };

  const adjustUserTrustScore = (userId: string, delta: number, reason: string) => {
    const targetUser = allUsers.find((u) => u.id === userId);
    if (!targetUser) return;
    const newScore = Math.max(0, Math.min(100, (targetUser.trustScore || 60) + delta));
    updateProfile({ trustScore: newScore });
    logAuditAction('ADJUSTED_TRUST_SCORE', 'user', userId, `Adjusted score by ${delta > 0 ? `+${delta}` : delta} (New: ${newScore}). Reason: ${reason}`);
  };

  const promoteToAdmin = (userId: string) => {
    logAuditAction('PROMOTED_TO_ADMIN', 'user', userId, 'Assigned administrative role');
  };

  const demoteAdmin = (userId: string) => {
    logAuditAction('DEMOTED_FROM_ADMIN', 'user', userId, 'Revoked administrative role');
  };

  const updateSystemConfig = async (updates: Partial<SuperAdminConfig>) => {
    const newConfig: SuperAdminConfig = {
      ...systemConfig,
      ...updates,
      lastUpdatedBy: currentUser?.name || 'Super Administrator',
      lastUpdatedAt: new Date().toISOString()
    };
    setSystemConfig(newConfig);
    logAuditAction('UPDATED_SYSTEM_CONFIG', 'system', 'config', 'Updated runtime system configuration');
    await adminService.updateSystemConfig(updates);
  };

  const pendingVerificationsCount = verificationRequests.filter((r) => r.status === 'pending').length;
  const pendingFlagsCount = flaggedListings.filter((f) => f.status === 'pending').length;
  const pendingDisputesCount = disputes.filter((d) => d.status === 'pending').length;

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
        isLoading,
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
        updateSystemConfig,
        refreshAdminData
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
