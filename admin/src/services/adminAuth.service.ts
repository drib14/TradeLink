import { api, setAccessToken } from './api';
import { User } from '../types';

export const adminAuthService = {
  async login(email: string, password: string): Promise<{ user: User; accessToken: string; message: string }> {
    const res = await api.post<{ user: any; accessToken: string }>('/admin-auth/login', { email, password });
    if (res.data?.accessToken) {
      setAccessToken(res.data.accessToken);
    }
    return {
      user: res.data?.user,
      accessToken: res.data?.accessToken || '',
      message: res.message || 'Login successful.'
    };
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const res = await api.post('/admin-auth/forgot-password', { email });
    return {
      success: true,
      message: res.message || 'Verification code sent directly to your administrator email.'
    };
  },

  async resetPassword(email: string, code: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await api.post('/admin-auth/reset-password', { email, code, newPassword });
    return {
      success: true,
      message: res.message || 'Administrator password reset successfully.'
    };
  },

  async getMe(): Promise<User | null> {
    try {
      const res = await api.get<{ user: any }>('/admin-auth/me');
      if (res.data?.user?.role === 'admin') {
        return res.data.user;
      }
      return null;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post('/admin-auth/logout', {});
    } catch {
      // Ignore network errors on logout
    } finally {
      setAccessToken(null);
    }
  }
};
