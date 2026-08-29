import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/admin.service';

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
  verificationRequests: any[];
  flaggedListings: FlaggedListingItem[];
  announcements: any[];
  auditLogs: any[];
  prohibitedKeywords: string[];
  disputes: any[];
  allUsers: any[];
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
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
  const [flaggedListings, setFlaggedListings] = useState<FlaggedListingItem[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [prohibitedKeywords, setProhibitedKeywords] = useState<string[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
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
        configData
      ] = await Promise.allSettled([
        adminService.getStats(),
        adminService.getVerifications(),
        adminService.getFlags(),
        adminService.getDisputes(),
        adminService.getAnnouncements(),
        adminService.getAuditLogs(),
        adminService.getAllUsers(),
        adminService.getKeywords(),
        adminService.getSystemConfig()
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

  const removeListingByAdmin = async (flagId: string, _listingId: string, reason?: string) => {
    await adminService.removeListing(flagId, reason);
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
