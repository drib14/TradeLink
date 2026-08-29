import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Campus, College } from '../types';
import { mobileAuthService, MobileRegisterPayload } from '../services/auth.service';

interface RegisterData {
  name: string;
  email: string;
  studentId: string;
  campus: Campus;
  college: College;
  password?: string;
  avatar?: string;
  idPhotoUrl?: string;
}

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  isLoading: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updatedData: Partial<User>) => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshCurrentUser = useCallback(async () => {
    try {
      const user = await mobileAuthService.getMe();
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    }
  }, []);

  // Restore authenticated session on app boot
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await refreshCurrentUser();
      setIsLoading(false);
    };
    initAuth();
  }, [refreshCurrentUser]);

  const login = async (emailOrStudentId: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    const cleanId = emailOrStudentId.trim();
    if (!cleanId) {
      return { success: false, error: 'Please enter your student email or ID.' };
    }

    try {
      const { user } = await mobileAuthService.login(cleanId, password);
      setCurrentUser(user);
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Login failed. Please check your credentials.',
      };
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanName = data.name.trim();
    const cleanId = data.studentId.trim();

    if (!cleanName) return { success: false, error: 'Full name is required.' };
    if (!cleanId) return { success: false, error: 'Student ID Number is required.' };
    if (!cleanEmail) return { success: false, error: 'Student Email is required.' };

    try {
      const payload: MobileRegisterPayload = {
        name: cleanName,
        email: cleanEmail,
        studentId: cleanId,
        password: data.password || 'Student@123',
        campus: data.campus,
        college: data.college,
        avatar: data.avatar,
        idPhotoUrl: data.idPhotoUrl,
      };

      const { user } = await mobileAuthService.register(payload);
      setCurrentUser(user);
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Registration failed. Please check your details.',
      };
    }
  };

  const logout = async () => {
    await mobileAuthService.logout();
    setCurrentUser(null);
  };

  const updateProfile = async (updatedData: Partial<User>) => {
    try {
      const updated = await mobileAuthService.updateProfile(updatedData);
      if (updated) {
        setCurrentUser(updated);
      }
    } catch (err) {
      console.warn('Failed to update profile:', err);
    }
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isAuthModalOpen,
        isLoading,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        updateProfile,
        refreshCurrentUser,
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
