import { mobileApi, setMobileTokens, clearMobileTokens } from './api';
import { User, Campus, College } from '../types';

export interface MobileRegisterPayload {
  name: string;
  email: string;
  studentId: string;
  password?: string;
  campus: Campus;
  college: College;
  yearLevel?: string;
  avatar?: string;
  idPhotoUrl?: string;
}

export const mobileAuthService = {
  async login(idNumber: string, password?: string): Promise<{ user: User; accessToken: string }> {
    if (!password) {
      throw new Error('Please enter your account password.');
    }

    const res = await mobileApi.post('/auth/login', {
      studentId: idNumber,
      idNumber,
      emailOrStudentId: idNumber,
      password,
    });

    const user = res.data?.user;
    const accessToken = res.data?.accessToken;
    const refreshToken = res.data?.refreshToken;

    if (accessToken) {
      await setMobileTokens(accessToken, refreshToken);
    }

    return { user, accessToken };
  },

  async register(payload: MobileRegisterPayload): Promise<{ user: User; accessToken: string }> {
    if (!payload.password) {
      throw new Error('Please choose a secure account password.');
    }

    const res = await mobileApi.post('/auth/register', {
      name: payload.name,
      studentId: payload.studentId,
      email: payload.email,
      password: payload.password,
      campus: payload.campus,
      college: payload.college,
      yearLevel: payload.yearLevel || '1st Year',
      avatar: payload.avatar,
      idPhotoUrl: payload.idPhotoUrl,
    });

    const user = res.data?.user;
    const accessToken = res.data?.accessToken;
    const refreshToken = res.data?.refreshToken;

    if (accessToken) {
      await setMobileTokens(accessToken, refreshToken);
    }

    return { user, accessToken };
  },

  async getMe(): Promise<User | null> {
    try {
      const res = await mobileApi.get('/auth/me');
      return res.data?.user || null;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await mobileApi.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      await clearMobileTokens();
    }
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    const res = await mobileApi.patch('/users/profile', updates);
    return res.data?.user;
  },

  async submitVerification(studentIdNumber: string, idPhotoUrl: string, selfiePhotoUrl?: string) {
    const res = await mobileApi.post('/users/verify-id', {
      studentIdNumber,
      idPhotoUrl,
      selfiePhotoUrl,
    });
    return res;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const res = await mobileApi.post('/auth/forgot-password', { email });
    return {
      message: res.data?.message || 'Verification code sent to your email.',
    };
  },

  async verifyResetCode(email: string, code: string): Promise<{ message: string }> {
    const res = await mobileApi.post('/auth/verify-reset-code', { email, code });
    return { message: res.data?.message || 'Code verified successfully.' };
  },

  async resetPassword(email: string, code: string, newPassword: string): Promise<{ message: string }> {
    const res = await mobileApi.post('/auth/reset-password', { email, code, newPassword });
    return { message: res.data?.message || 'Password reset successfully.' };
  },
};
