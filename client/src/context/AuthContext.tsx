import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, RegisterData } from '../types';
import { authService } from '../services/auth.service';
import { adminService } from '../services/admin.service';
import { api, getAccessToken } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOffline: boolean;
  isLoading: boolean;
  login: (emailOrStudentId: string, password?: string) => Promise<{ success: boolean; message: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; resetCode?: string; message: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  submitIdVerification: (studentIdNumber: string, idPhotoUrl: string, selfiePhotoUrl?: string) => void;
  banUser: (userId: string, reason: string) => void;
  unbanUser: (userId: string) => void;
  warnUser: (userId: string, note?: string) => void;
  toggleVerifyUser: (userId: string) => void;
  deleteUser: (userId: string) => void;
  resetAllData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!currentUser;
  const isAdmin = currentUser?.role === 'admin';

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

  // Fetch all users if admin
  useEffect(() => {
    if (isAdmin) {
      adminService.getUsers().then((res) => {
        if (Array.isArray(res)) {
          setUsers(res);
        }
      }).catch(() => {});
    }
  }, [isAdmin]);

  const login = useCallback(async (idNumber: string, password?: string): Promise<{ success: boolean; message: string }> => {
    const cleanId = idNumber.trim();

    if (!cleanId) {
      return { success: false, message: 'Please enter your Student ID or ID Number.' };
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
    const cleanDigits = data.studentId.replace(/\D/g, '');
    if (cleanDigits.length < 6 || /\D/.test(data.studentId)) {
      return { success: false, message: 'Invalid Student ID. Only numbers (0-9) are allowed without hyphens.' };
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

  const submitIdVerification = useCallback((studentIdNumber: string, idPhotoUrl: string, selfiePhotoUrl?: string) => {
    if (!currentUser) return;
    const cleanId = studentIdNumber.replace(/\D/g, '');
    const updated: User = {
      ...currentUser,
      studentId: cleanId,
      idPhotoUrl,
      isVerified: false,
      verificationStatus: 'pending'
    };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));

    if (getAccessToken()) {
      api.post('/users/me/verify-id', { studentIdNumber: cleanId, idCardImageUrl: idPhotoUrl, selfiePhotoUrl }).catch(() => {});
    }
  }, [currentUser]);

  const banUser = useCallback((userId: string, reason: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isBanned: true, banReason: reason, bannedAt: new Date().toISOString() } : u))
    );
    if (currentUser?.id === userId) {
      setCurrentUser(null);
    }
    if (getAccessToken()) {
      api.patch(`/admin/users/${userId}/ban`, { reason }).catch(() => {});
    }
  }, [currentUser]);

  const unbanUser = useCallback((userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isBanned: false, banReason: undefined, bannedAt: undefined } : u))
    );
    if (getAccessToken()) {
      api.patch(`/admin/users/${userId}/unban`).catch(() => {});
    }
  }, []);

  const warnUser = useCallback((userId: string, note?: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, warningsCount: (u.warningsCount || 0) + 1, trustScore: Math.max(10, (u.trustScore || 80) - 15) } : u))
    );
    if (getAccessToken()) {
      api.patch(`/admin/users/${userId}/warn`, { note }).catch(() => {});
    }
  }, []);

  const toggleVerifyUser = useCallback((userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const newVerified = !u.isVerified;
        return {
          ...u,
          isVerified: newVerified,
          verificationStatus: newVerified ? 'verified' : 'unverified',
          trustScore: newVerified ? Math.min(100, (u.trustScore || 60) + 25) : Math.max(50, (u.trustScore || 80) - 25)
        };
      })
    );
    if (getAccessToken()) {
      api.patch(`/admin/users/${userId}/toggle-verify`).catch(() => {});
    }
  }, []);

  const deleteUser = useCallback((userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (currentUser?.id === userId) {
      setCurrentUser(null);
    }
    if (getAccessToken()) {
      api.delete(`/admin/users/${userId}`).catch(() => {});
    }
  }, [currentUser]);

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
        banUser,
        unbanUser,
        warnUser,
        toggleVerifyUser,
        deleteUser,
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
