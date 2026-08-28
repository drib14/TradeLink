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

  async submitIdVerification(studentIdNumber: string, idPhotoUrl: string, selfiePhotoUrl?: string): Promise<void> {
    await api.post('/users/me/verify-id', { studentIdNumber, idPhotoUrl, idCardImageUrl: idPhotoUrl, selfiePhotoUrl });
  },
};
