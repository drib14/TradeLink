// Admin moderation service
import { api } from './api';
import type { VerificationRequest, TradeDispute, CampusAnnouncement, AdminAuditLog, SystemConfig, Campus, User, PasswordResetRequest } from '../types';

export interface FlaggedListingItem {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  sellerName: string;
  reporterName?: string;
  campus?: Campus;
  reason: string;
  flaggedBy?: string;
  reportedAt?: string;
  flaggedAt?: string;
  status: 'pending' | 'resolved' | 'dismissed' | 'removed';
}

export const adminService = {
  // Users
  async getUsers(): Promise<User[]> {
    const res = await api.get<{ users: User[] }>('/admin/users');
    const list = res.data?.users || res.data || [];
    return Array.isArray(list) ? list : [];
  },

  // Stats
  async getStats(): Promise<any> {
    const res = await api.get('/admin/stats');
    return res.data;
  },

  // Verifications
  async getVerifications(): Promise<VerificationRequest[]> {
    const res = await api.get<{ verifications: any[] }>('/admin/verifications');
    const list = res.data?.verifications || res.data || [];
    return Array.isArray(list) ? list : [];
  },

  async approveVerification(id: string): Promise<void> {
    await api.patch(`/admin/verifications/${id}/approve`);
  },

  async rejectVerification(id: string, reason?: string): Promise<void> {
    await api.patch(`/admin/verifications/${id}/reject`, { reason });
  },

  // Password Resets
  async getPasswordResetRequests(status?: string): Promise<{ requests: PasswordResetRequest[]; pendingCount: number }> {
    const res = await api.get<{ requests: PasswordResetRequest[]; pendingCount: number }>('/admin/password-resets', { status });
    const requests = res.data?.requests || [];
    const pendingCount = res.data?.pendingCount ?? requests.filter((r: any) => r.status === 'pending').length;
    return { requests: Array.isArray(requests) ? requests : [], pendingCount };
  },

  async approvePasswordReset(id: string): Promise<string> {
    const res = await api.patch<{ message: string }>(`/admin/password-resets/${id}/approve`);
    return res.message || 'Password reset request approved. Code sent via system email.';
  },

  async rejectPasswordReset(id: string, reason?: string): Promise<string> {
    const res = await api.patch<{ message: string }>(`/admin/password-resets/${id}/reject`, { reason });
    return res.message || 'Password reset request rejected.';
  },

  // Flags
  async getFlaggedListings(): Promise<FlaggedListingItem[]> {
    const res = await api.get<{ flags: any[] }>('/admin/flags');
    const list = res.data?.flags || res.data || [];
    return Array.isArray(list) ? list : [];
  },

  async resolveFlag(id: string, action: 'dismiss' | 'remove'): Promise<void> {
    await api.patch(`/admin/flags/${id}/resolve`, { action });
  },

  async removeListingByAdmin(id: string, _reason?: string): Promise<void> {
    await api.delete(`/admin/flags/${id}/remove`);
  },

  // Disputes
  async getDisputes(): Promise<TradeDispute[]> {
    const res = await api.get<{ disputes: any[] }>('/admin/disputes');
    const list = res.data?.disputes || res.data || [];
    return Array.isArray(list) ? list : [];
  },

  async resolveDispute(id: string, action: string, note: string): Promise<void> {
    await api.patch(`/admin/disputes/${id}/resolve`, { action, note });
  },

  // Announcements
  async getAnnouncements(): Promise<CampusAnnouncement[]> {
    const res = await api.get<{ announcements: any[] }>('/admin/announcements', undefined, { skipAuth: true });
    const list = res.data?.announcements || res.data || [];
    return Array.isArray(list) ? list : [];
  },

  async createAnnouncement(data: any): Promise<CampusAnnouncement> {
    const res = await api.post<{ announcement: any }>('/admin/announcements', data);
    return res.data?.announcement || res.data;
  },

  async deleteAnnouncement(id: string): Promise<void> {
    await api.delete(`/admin/announcements/${id}`);
  },

  // Audit Logs
  async getAuditLogs(): Promise<AdminAuditLog[]> {
    const res = await api.get<{ logs: any[] }>('/admin/audit-logs');
    const list = res.data?.logs || res.data || [];
    return Array.isArray(list) ? list : [];
  },

  // Keywords
  async getKeywords(): Promise<string[]> {
    const res = await api.get<{ keywords: string[] }>('/admin/keywords');
    const list = res.data?.keywords || res.data || [];
    return Array.isArray(list) ? list : [];
  },

  async addKeyword(keyword: string): Promise<void> {
    await api.post('/admin/keywords', { keyword });
  },

  async removeKeyword(keyword: string): Promise<void> {
    await api.delete(`/admin/keywords/${encodeURIComponent(keyword)}`);
  },

  // System Config & Feature Flags
  async getSystemConfig(): Promise<SystemConfig> {
    const res = await api.get<{ config: any }>('/admin/config');
    return res.data?.config || res.data;
  },

  async updateSystemConfig(updates: Partial<SystemConfig>): Promise<void> {
    await api.patch('/admin/config', updates);
  },

  async toggleFeatureFlag(id: string): Promise<void> {
    await api.patch(`/admin/feature-flags/${id}/toggle`);
  }
};
