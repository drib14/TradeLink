import { api } from './api';

export const adminService = {
  async getStats() {
    const res = await api.get('/admin/stats');
    return res.data;
  },

  async getVerifications(page = 1, limit = 50) {
    const res = await api.get('/admin/verifications', { page, limit });
    return res.data?.verifications || [];
  },

  async approveVerification(id: string) {
    const res = await api.patch(`/admin/verifications/${id}/approve`);
    return res;
  },

  async rejectVerification(id: string, reason?: string) {
    const res = await api.patch(`/admin/verifications/${id}/reject`, { reason });
    return res;
  },

  async getFlags(page = 1, limit = 50) {
    const res = await api.get('/admin/flags', { page, limit });
    return res.data?.flags || [];
  },

  async resolveFlag(id: string) {
    const res = await api.patch(`/admin/flags/${id}/resolve`);
    return res;
  },

  async removeListing(flagId: string, reason?: string) {
    const res = await api.delete(`/admin/flags/${flagId}/remove`);
    return res;
  },

  async getDisputes(page = 1, limit = 50) {
    const res = await api.get('/admin/disputes', { page, limit });
    return res.data?.disputes || [];
  },

  async resolveDispute(id: string, action: string, note: string) {
    const res = await api.patch(`/admin/disputes/${id}/resolve`, { action, note });
    return res;
  },

  async getAnnouncements() {
    const res = await api.get('/admin/announcements');
    return res.data?.announcements || [];
  },

  async createAnnouncement(data: { title: string; message: string; campus: string; type: string }) {
    const res = await api.post('/admin/announcements', data);
    return res.data?.announcement;
  },

  async deleteAnnouncement(id: string) {
    const res = await api.delete(`/admin/announcements/${id}`);
    return res;
  },

  async toggleAnnouncement(id: string) {
    const res = await api.patch(`/admin/announcements/${id}/toggle`);
    return res;
  },

  async getAuditLogs(page = 1, limit = 50) {
    const res = await api.get('/admin/audit-logs', { page, limit });
    return res.data?.auditLogs || [];
  },

  async getAllUsers(page = 1, limit = 50) {
    const res = await api.get('/admin/users', { page, limit });
    return res.data?.users || [];
  },

  async banUser(id: string, reason: string) {
    const res = await api.patch(`/admin/users/${id}/ban`, { reason });
    return res;
  },

  async unbanUser(id: string) {
    const res = await api.patch(`/admin/users/${id}/unban`);
    return res;
  },

  async warnUser(id: string, note?: string) {
    const res = await api.patch(`/admin/users/${id}/warn`, { note });
    return res;
  },

  async toggleVerifyUser(id: string) {
    const res = await api.patch(`/admin/users/${id}/toggle-verify`);
    return res;
  },

  async deleteUser(id: string) {
    const res = await api.delete(`/admin/users/${id}`);
    return res;
  },

  async promoteToAdmin(id: string) {
    const res = await api.patch(`/admin/users/${id}/promote`);
    return res;
  },

  async demoteAdmin(id: string) {
    const res = await api.patch(`/admin/users/${id}/demote`);
    return res;
  },

  async adjustTrustScore(id: string, delta: number, reason: string) {
    const res = await api.patch(`/admin/users/${id}/adjust-trust`, { delta, reason });
    return res;
  },

  async getKeywords() {
    const res = await api.get('/admin/keywords');
    return res.data?.keywords || [];
  },

  async addKeyword(keyword: string) {
    const res = await api.post('/admin/keywords', { keyword });
    return res;
  },

  async removeKeyword(keyword: string) {
    const res = await api.delete(`/admin/keywords/${encodeURIComponent(keyword)}`);
    return res;
  },

  async getSystemConfig() {
    const res = await api.get('/admin/config');
    return res.data?.config || {};
  },

  async updateSystemConfig(config: any) {
    const res = await api.patch('/admin/config', config);
    return res;
  }
};
