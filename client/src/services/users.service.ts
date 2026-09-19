// Users service — profile API calls
import { api } from './api';
import { mapUserFromApi } from './auth.service';
import type { User } from '../types';

export const usersService = {
  async getProfile(userId: string): Promise<User> {
    const res = await api.get<{ user: any }>(`/users/${userId}`, undefined, { skipAuth: true });
    return mapUserFromApi(res.data?.user || res.data);
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const res = await api.put<{ user: any }>('/users/me', data);
    return mapUserFromApi(res.data?.user || res.data);
  },

  async getVerificationSession(): Promise<{ sessionToken: string; challengeAction: { id: string; instruction: string }; flashColor: string; expiresAt: number }> {
    const res = await api.get<{ sessionToken: string; challengeAction: { id: string; instruction: string }; flashColor: string; expiresAt: number }>('/users/me/verification-session');
    return res.data;
  },

  async getVerificationStatus(): Promise<{
    status: 'unverified' | 'pending' | 'approved' | 'rejected';
    isVerified: boolean;
    studentIdNumber: string;
    rejectionReason: string | null;
    submittedAt: string | null;
    reviewedAt: string | null;
    idPhotoUrl: string | null;
    selfiePhotoUrl: string | null;
  }> {
    const res = await api.get<any>('/users/me/verification-status');
    return res.data;
  },

  async submitIdVerification(
    studentIdNumber: string,
    idPhotoUrl: string,
    selfiePhotoUrl?: string,
    sessionToken?: string,
    telemetry?: any
  ): Promise<any> {
    const res = await api.post<any>('/users/me/verify-id', {
      studentIdNumber,
      idPhotoUrl,
      idCardImageUrl: idPhotoUrl,
      selfiePhotoUrl,
      sessionToken,
      telemetry
    });
    return res;
  },
};
