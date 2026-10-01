import { api, setAccessToken } from './api';
import type { User, Campus } from '../types';

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export interface RegisterPayload {
  name: string;
  studentId: string;
  email: string;
  password: string;
  campus: Campus;
  department: string;
  avatar?: string;
  idPhotoUrl?: string;
}

// Map snake_case API response to camelCase User type
function mapUserFromApi(raw: any): User {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    studentId: raw.studentId || raw.student_id || '',
    role: raw.role || 'student',
    campus: raw.campus,
    department: raw.department || raw.college || '',
    college: raw.department || raw.college || '',
    avatar: raw.avatar || raw.avatarUrl || raw.avatar_url || '',
    isVerified: true,
    idPhotoUrl: raw.idPhotoUrl || raw.id_photo_url,
    trustScore: 0,
    rating: raw.rating ?? 0.0,
    totalReviews: raw.totalReviews ?? raw.total_reviews ?? 0,
    completedTrades: raw.completedTrades ?? raw.completed_trades ?? 0,
    punctualityRate: raw.punctualityRate ?? raw.punctuality_rate ?? 0,
    bio: raw.bio || '',
    joinedDate: raw.joinedDate || raw.joined_date || raw.created_at || '',
    isBanned: Boolean(raw.isBanned ?? raw.is_banned),
    banReason: raw.banReason || raw.ban_reason,
    bannedAt: raw.bannedAt || raw.banned_at,
    warningsCount: raw.warningsCount ?? raw.warnings_count ?? 0,
  };
}

export const authService = {
  async login(idNumber: string, password: string): Promise<{ user: User; accessToken: string; message: string }> {
    const res = await api.post<LoginResponse>('/auth/login', { studentId: idNumber, idNumber, emailOrStudentId: idNumber, password }, { skipAuth: true });
    const user = mapUserFromApi(res.data!.user);
    const token = res.data!.accessToken;
    setAccessToken(token);
    return { user, accessToken: token, message: res.message || `Welcome back, ${user.name}!` };
  },

  async register(data: RegisterPayload): Promise<{ user: User; accessToken: string; message: string }> {
    const res = await api.post<LoginResponse>('/auth/register', data, { skipAuth: true });
    const user = mapUserFromApi(res.data!.user);
    const token = res.data!.accessToken;
    setAccessToken(token);
    return { user, accessToken: token, message: res.message || `Account created for ${user.name}!` };
  },

  async getMe(): Promise<User | null> {
    try {
      const res = await api.get<{ user: any }>('/auth/me');
      return mapUserFromApi(res.data!.user);
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors — clear local state regardless
    }
    setAccessToken(null);
  },

  async forgotPassword(email: string): Promise<{ message: string; resetCode?: string }> {
    const res = await api.post('/auth/forgot-password', { email }, { skipAuth: true });
    return { message: res.message || 'Code sent.', resetCode: (res as any).resetCode || (res as any).devCode };
  },

  async verifyResetCode(email: string, code: string): Promise<{ message: string }> {
    const res = await api.post('/auth/verify-reset-code', { email, code }, { skipAuth: true });
    return { message: res.message || 'Code confirmed.' };
  },

  async resetPassword(email: string, code: string, newPassword: string): Promise<{ message: string }> {
    const res = await api.post('/auth/reset-password', { email, code, newPassword }, { skipAuth: true });
    return { message: res.message || 'Password reset successfully.' };
  },
};

export { mapUserFromApi };
