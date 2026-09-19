import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, RegisterData } from '../types';
import { authService } from '../services/auth.service';
import { usersService } from '../services/users.service';
import { api, getAccessToken } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOffline: boolean;
  isLoading: boolean;
  login: (idNumber: string, password?: string) => Promise<{ success: boolean; message: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; resetCode?: string; message: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  submitIdVerification: (
    studentIdNumber: string,
    idPhotoUrl: string,
    selfiePhotoUrl?: string,
    sessionToken?: string,
    telemetry?: any
  ) => Promise<any>;
  refreshCurrentUser: () => Promise<void>;
  getVerificationSession: () => Promise<{ sessionToken: string; challengeAction: { id: string; instruction: string }; flashColor: string; expiresAt: number }>;
  getVerificationStatus: () => Promise<any>;
  resetAllData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!currentUser;
  const isAdmin = currentUser?.role === 'admin';

  const refreshCurrentUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const user = await authService.getMe();
      if (user) {
        setCurrentUser(user);
        setIsOffline(false);
      }
    } catch (err: any) {
      if (err?.statusCode === 0) {
        setIsOffline(true);
      }
    }
  }, []);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const token = getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const user = await authService.getMe();
        if (user) {
          setCurrentUser(user);
          setIsOffline(false);
        }
      } catch (err: any) {
        if (err?.statusCode === 0) {
          setIsOffline(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(async (idNumber: string, password?: string): Promise<{ success: boolean; message: string }> => {
    const cleanId = idNumber.trim();

    if (!cleanId) {
      return { success: false, message: 'Please enter your Student ID or Email.' };
    }
    if (!password) {
      return { success: false, message: 'Please enter your password.' };
    }

    try {
      const result = await authService.login(cleanId, password);
      setCurrentUser(result.user);
      setIsOffline(false);
      return { success: true, message: result.message };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Login failed.' };
    }
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<{ success: boolean; message: string }> => {
    const cleanDigits = data.studentId.replace(/[^a-zA-Z0-9]/g, '');
    if (cleanDigits.length < 6) {
      return { success: false, message: 'Invalid Student ID. Must contain at least 6 characters.' };
    }

    try {
      const result = await authService.register({
        name: data.name.trim(),
        studentId: cleanDigits,
        email: data.email.trim(),
        password: data.password,
        campus: data.campus,
        college: data.college,
        yearLevel: data.yearLevel,
        avatar: data.avatar,
        idPhotoUrl: data.idPhotoUrl,
      });
      setCurrentUser(result.user);
      setUsers((prev) => [result.user, ...prev.filter(u => u.id !== result.user.id)]);
      setIsOffline(false);
      return { success: true, message: result.message };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Registration failed.' };
    }
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<{ success: boolean; resetCode?: string; message: string }> => {
    if (!email.trim()) {
      return { success: false, message: 'Please enter your email.' };
    }
    try {
      const result = await authService.forgotPassword(email);
      return { success: true, message: result.message, resetCode: result.resetCode };
    } catch (err: any) {
      return { success: false, message: err?.message || 'No registered UC account found with that email address.' };
    }
  }, []);

  const resetPassword = useCallback(async (email: string, code: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!code || code.length !== 4) {
      return { success: false, message: 'Invalid 4-digit verification code.' };
    }
    try {
      const result = await authService.resetPassword(email, code, newPassword);
      return { success: true, message: result.message };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Password reset failed.' };
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setCurrentUser(null);
  }, []);

  const updateProfile = useCallback((data: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));

    if (getAccessToken()) {
      api.patch('/users/me', data).catch(() => {});
    }
  }, [currentUser]);

  const submitIdVerification = useCallback(
    async (
      studentIdNumber: string,
      idPhotoUrl: string,
      selfiePhotoUrl?: string,
      sessionToken?: string,
      telemetry?: any
    ) => {
      const cleanId = studentIdNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const res = await usersService.submitIdVerification(cleanId, idPhotoUrl, selfiePhotoUrl, sessionToken, telemetry);

    const isAutoApproved = Boolean(res?.autoApproved || res?.data?.autoApproved);

    if (currentUser) {
      const updated: User = {
        ...currentUser,
        studentId: cleanId,
        idPhotoUrl,
        isVerified: isAutoApproved,
        verificationStatus: isAutoApproved ? 'verified' : 'pending',
        trustScore: isAutoApproved ? Math.min(100, (currentUser.trustScore || 0) + 25) : currentUser.trustScore
      };
      setCurrentUser(updated);
      setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
    }

    await refreshCurrentUser();
    return res;
  }, [currentUser, refreshCurrentUser]);

  const getVerificationSession = useCallback(async () => {
    return usersService.getVerificationSession();
  }, []);

  const getVerificationStatus = useCallback(async () => {
    return usersService.getVerificationStatus();
  }, []);

  const resetAllData = useCallback(() => {
    authService.logout();
    window.location.href = '/';
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers: users,
        isAuthenticated,
        isAdmin,
        isOffline,
        isLoading,
        login,
        register,
        forgotPassword,
        resetPassword,
        logout,
        updateProfile,
        submitIdVerification,
        refreshCurrentUser,
        getVerificationSession,
        getVerificationStatus,
        resetAllData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
