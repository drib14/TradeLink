import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/admin.service';
import { Listing, WantedRequest, MeetupTransaction, VerificationRequest, TradeDispute, CampusAnnouncement, AdminAuditLog } from '../types';

export interface FlaggedListingItem {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  sellerName: string;
  reporterName: string;
  reason: string;
  campus: string;
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
  allUsers: any[];
  listings: Listing[];
  wantedRequests: WantedRequest[];
  meetups: MeetupTransaction[];
  systemConfig: any;
  stats: any;
  pendingVerificationsCount: number;
  pendingFlagsCount: number;
  pendingDisputesCount: number;
  isLoading: boolean;
  approveVerification: (requestId: string) => Promise<void>;
  rejectVerification: (requestId: string, reason?: string) => Promise<void>;
  resolveFlag: (flagId: string) => Promise<void>;
  removeListingByAdmin: (flagId: string, listingId: string, reason?: string) => Promise<void>;
  boostListingByAdmin: (listingId: string) => Promise<void>;
  removeWantedByAdmin: (wantedId: string, reason?: string) => Promise<void>;
  deleteWantedRequest: (wantedId: string, reason?: string) => Promise<void>;
  completeMeetupByAdmin: (meetupId: string) => Promise<void>;
  cancelMeetupByAdmin: (meetupId: string, reason?: string) => Promise<void>;
  banUserByAdmin: (userId: string, reason: string) => Promise<void>;
  unbanUserByAdmin: (userId: string) => Promise<void>;
  warnUserByAdmin: (userId: string, note?: string) => Promise<void>;
  toggleVerifyByAdmin: (userId: string) => Promise<void>;
  deleteUserByAdmin: (userId: string) => Promise<void>;
  promoteToAdmin: (userId: string) => Promise<void>;
  demoteAdmin: (userId: string) => Promise<void>;
  adjustUserTrustScore: (userId: string, delta: number, reason: string) => Promise<void>;
  createAnnouncement: (title: string, message: string, campus: string, type: string) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  toggleAnnouncement: (id: string) => Promise<void>;
  addProhibitedKeyword: (word: string) => Promise<void>;
  removeProhibitedKeyword: (word: string) => Promise<void>;
  resolveDispute: (disputeId: string, action: string, note: string) => Promise<void>;
  updateSystemConfig: (updates: any) => Promise<void>;
  refreshAdminData: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [flaggedListings, setFlaggedListings] = useState<FlaggedListingItem[]>([]);
  const [announcements, setAnnouncements] = useState<CampusAnnouncement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [prohibitedKeywords, setProhibitedKeywords] = useState<string[]>([]);
  const [disputes, setDisputes] = useState<TradeDispute[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [wantedRequests, setWantedRequests] = useState<WantedRequest[]>([]);
  const [meetups, setMeetups] = useState<MeetupTransaction[]>([]);
  const [systemConfig, setSystemConfig] = useState<any>({});
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    totalListings: 0,
    completedTrades: 0,
    pendingVerifications: 0,
    pendingFlags: 0,
    pendingDisputes: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchAdminData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        statsData,
        verifs,
        flags,
        disputeData,
        anns,
        logs,
        usersList,
        keywords,
        configData,
        listingsData,
        wantedData,
        meetupsData
      ] = await Promise.allSettled([
        adminService.getStats(),
        adminService.getVerifications(),
        adminService.getFlags(),
        adminService.getDisputes(),
        adminService.getAnnouncements(),
        adminService.getAuditLogs(),
        adminService.getAllUsers(),
        adminService.getKeywords(),
        adminService.getSystemConfig(),
        adminService.getListings(),
        adminService.getWantedRequests(),
        adminService.getMeetups()
      ]);

      if (statsData.status === 'fulfilled' && statsData.value) setStats(statsData.value);
      if (verifs.status === 'fulfilled') setVerificationRequests(verifs.value || []);
      if (flags.status === 'fulfilled') setFlaggedListings(flags.value || []);
      if (disputeData.status === 'fulfilled') setDisputes(disputeData.value || []);
      if (anns.status === 'fulfilled') setAnnouncements(anns.value || []);
      if (logs.status === 'fulfilled') setAuditLogs(logs.value || []);
      if (usersList.status === 'fulfilled') setAllUsers(usersList.value || []);
      if (keywords.status === 'fulfilled') setProhibitedKeywords(keywords.value || []);
      if (configData.status === 'fulfilled') setSystemConfig(configData.value || {});
      if (listingsData.status === 'fulfilled') setListings(listingsData.value || []);
      if (wantedData.status === 'fulfilled') setWantedRequests(wantedData.value || []);
      if (meetupsData.status === 'fulfilled') setMeetups(meetupsData.value || []);
    } catch (e) {
      console.warn('Failed to load admin data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const approveVerification = async (requestId: string) => {
    await adminService.approveVerification(requestId);
    fetchAdminData();
  };

  const rejectVerification = async (requestId: string, reason?: string) => {
    await adminService.rejectVerification(requestId, reason);
    fetchAdminData();
  };

  const resolveFlag = async (flagId: string) => {
    await adminService.resolveFlag(flagId);
    fetchAdminData();
  };

  const removeListingByAdmin = async (flagId: string, listingId: string, reason?: string) => {
    if (flagId) {
      await adminService.removeListing(flagId, reason);
    } else if (listingId) {
      await adminService.deleteListing(listingId);
    }
    fetchAdminData();
  };

  const boostListingByAdmin = async (listingId: string) => {
    await adminService.boostListing(listingId);
    fetchAdminData();
  };

  const removeWantedByAdmin = async (wantedId: string, reason?: string) => {
    await adminService.deleteWanted(wantedId, reason);
    fetchAdminData();
  };

  const deleteWantedRequest = async (wantedId: string, reason?: string) => {
    await adminService.deleteWanted(wantedId, reason);
    fetchAdminData();
  };

  const completeMeetupByAdmin = async (meetupId: string) => {
    await adminService.updateMeetupStatus(meetupId, 'completed');
    fetchAdminData();
  };

  const cancelMeetupByAdmin = async (meetupId: string, reason?: string) => {
    await adminService.updateMeetupStatus(meetupId, 'cancelled', reason);
    fetchAdminData();
  };

  const banUserByAdmin = async (userId: string, reason: string) => {
    await adminService.banUser(userId, reason);
    fetchAdminData();
  };

  const unbanUserByAdmin = async (userId: string) => {
    await adminService.unbanUser(userId);
    fetchAdminData();
  };

  const warnUserByAdmin = async (userId: string, note?: string) => {
    await adminService.warnUser(userId, note);
    fetchAdminData();
  };

  const toggleVerifyByAdmin = async (userId: string) => {
    await adminService.toggleVerifyUser(userId);
    fetchAdminData();
  };

  const deleteUserByAdmin = async (userId: string) => {
    await adminService.deleteUser(userId);
    fetchAdminData();
  };

  const promoteToAdmin = async (userId: string) => {
    await adminService.promoteToAdmin(userId);
    fetchAdminData();
  };

  const demoteAdmin = async (userId: string) => {
    await adminService.demoteAdmin(userId);
    fetchAdminData();
  };

  const adjustUserTrustScore = async (userId: string, delta: number, reason: string) => {
    await adminService.adjustTrustScore(userId, delta, reason);
    fetchAdminData();
  };

  const createAnnouncement = async (title: string, message: string, campus: string, type: string) => {
    await adminService.createAnnouncement({ title, message, campus, type });
    fetchAdminData();
  };

  const deleteAnnouncement = async (id: string) => {
    await adminService.deleteAnnouncement(id);
    fetchAdminData();
  };

  const toggleAnnouncement = async (id: string) => {
    await adminService.toggleAnnouncement(id);
    fetchAdminData();
  };

  const addProhibitedKeyword = async (word: string) => {
    await adminService.addKeyword(word);
    fetchAdminData();
  };

  const removeProhibitedKeyword = async (word: string) => {
    await adminService.removeKeyword(word);
    fetchAdminData();
  };

  const resolveDispute = async (disputeId: string, action: string, note: string) => {
    await adminService.resolveDispute(disputeId, action, note);
    fetchAdminData();
  };

  const updateSystemConfig = async (updates: any) => {
    await adminService.updateSystemConfig(updates);
    fetchAdminData();
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
        allUsers,
        listings,
        wantedRequests,
        meetups,
        systemConfig,
        stats,
        pendingVerificationsCount,
        pendingFlagsCount,
        pendingDisputesCount,
        isLoading,
        approveVerification,
        rejectVerification,
        resolveFlag,
        removeListingByAdmin,
        boostListingByAdmin,
        removeWantedByAdmin,
        deleteWantedRequest,
        completeMeetupByAdmin,
        cancelMeetupByAdmin,
        banUserByAdmin,
        unbanUserByAdmin,
        warnUserByAdmin,
        toggleVerifyByAdmin,
        deleteUserByAdmin,
        promoteToAdmin,
        demoteAdmin,
        adjustUserTrustScore,
        createAnnouncement,
        deleteAnnouncement,
        toggleAnnouncement,
        addProhibitedKeyword,
        removeProhibitedKeyword,
        resolveDispute,
        updateSystemConfig,
        refreshAdminData: fetchAdminData
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
