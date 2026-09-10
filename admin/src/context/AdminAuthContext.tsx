import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { adminAuthService } from '../services/adminAuth.service';
import { getAccessToken } from '../services/api';

interface AdminAuthContextType {
  adminUser: User | null;
  isAdminAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; message: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdminAuthenticated = Boolean(adminUser && adminUser.role === 'admin');

  // Restore admin session on mount
  useEffect(() => {
    const restore = async () => {
      const token = getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const user = await adminAuthService.getMe();
        if (user && user.role === 'admin') {
          setAdminUser(user);
        }
      } catch {
        // Not authenticated
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const login = useCallback(async (email: string, password?: string): Promise<{ success: boolean; message: string }> => {
    if (!email.trim()) {
      return { success: false, message: 'Please enter your administrator email.' };
    }
    if (!password) {
      return { success: false, message: 'Please enter your administrator password.' };
    }

    try {
      const result = await adminAuthService.login(email.trim(), password);
      setAdminUser(result.user);
      return { success: true, message: result.message };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Administrator authentication failed.' };
    }
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<{ success: boolean; message: string }> => {
    if (!email.trim()) {
      return { success: false, message: 'Please enter your administrator email.' };
    }
    try {
      const result = await adminAuthService.forgotPassword(email.trim());
      return { success: true, message: result.message };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to request reset code.' };
    }
  }, []);

  const resetPassword = useCallback(async (email: string, code: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!code || code.length !== 4) {
      return { success: false, message: 'Verification code must be 4 digits.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters.' };
    }
    try {
      const result = await adminAuthService.resetPassword(email.trim(), code.trim(), newPassword);
      return { success: true, message: result.message };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Password reset failed.' };
    }
  }, []);

  const logout = useCallback(() => {
    adminAuthService.logout();
    setAdminUser(null);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        isAdminAuthenticated,
        isLoading,
        login,
        forgotPassword,
        resetPassword,
        logout
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
