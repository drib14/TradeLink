import React, { createContext, useContext } from 'react';
import { User, Campus, College } from '../types';
import { SEED_USERS } from '../data/seedData';
import { useLocalStorage } from '../hooks/useLocalStorage';

export interface RegisterData {
  name: string;
  studentId: string;
  email: string;
  password: string;
  campus: Campus;
  college: College;
  yearLevel: string;
  avatar?: string;
  idPhotoUrl?: string;
}

export const ADMIN_CREDENTIALS = {
  email: 'admin@uc.edu.ph',
  studentId: 'UC-ADM-2024',
  password: 'admin123',
  name: 'UC Admin Moderator'
};

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (emailOrStudentId: string, password?: string) => { success: boolean; message: string };
  register: (data: RegisterData) => { success: boolean; message: string };
  forgotPassword: (email: string) => { success: boolean; resetCode?: string; message: string };
  resetPassword: (email: string, code: string, newPassword: string) => { success: boolean; message: string };
  logout: () => void;
  switchUser: (userId: string) => void;
  updateProfile: (data: Partial<User>) => void;
  submitIdVerification: (studentIdNumber: string, idPhotoUrl: string) => void;
  resetAllData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useLocalStorage<User[]>('tradelink_users_v2', SEED_USERS);
  const [currentUserId, setCurrentUserId] = useLocalStorage<string | null>('tradelink_current_user_id', 'user-maria');

  const currentUser = currentUserId ? (users.find((u) => u.id === currentUserId) || null) : null;
  const isAuthenticated = !!currentUser;
  const isAdmin = currentUser?.role === 'admin';

  const login = (emailOrStudentId: string, password?: string): { success: boolean; message: string } => {
    const cleanQuery = emailOrStudentId.trim().toLowerCase();

    // Check if user exists
    const matchedUser = users.find(
      (u) =>
        u.email.toLowerCase() === cleanQuery ||
        u.studentId.toLowerCase() === cleanQuery
    );

    if (!matchedUser) {
      return { success: false, message: 'No student account found with this ID or email.' };
    }

    // If password provided and user has password, check
    if (password && matchedUser.password && matchedUser.password !== password) {
      return { success: false, message: 'Incorrect password entered.' };
    }

    setCurrentUserId(matchedUser.id);
    return {
      success: true,
      message: `Welcome back, ${matchedUser.name}! (${matchedUser.role === 'admin' ? 'Admin Access' : matchedUser.campus})`
    };
  };

  const register = (data: RegisterData): { success: boolean; message: string } => {
    // Validate student ID (pure digits only, minimum 6 digits, NO letters or hyphens)
    const cleanDigits = data.studentId.replace(/\D/g, '');
    if (cleanDigits.length < 6 || /\D/.test(data.studentId)) {
      return { success: false, message: 'Invalid Student ID. Only numbers (0-9) are allowed without hyphens or letters.' };
    }

    // Check if already registered
    const exists = users.some(
      (u) =>
        u.email.toLowerCase() === data.email.toLowerCase() ||
        u.studentId.toLowerCase() === data.studentId.toLowerCase()
    );

    if (exists) {
      return { success: false, message: 'A student account with this ID or email is already registered.' };
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: data.name.trim(),
      email: data.email.trim(),
      studentId: cleanDigits,
      role: 'student',
      campus: data.campus,
      college: data.college,
      yearLevel: data.yearLevel,
      avatar:
        data.avatar ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
      isVerified: !!data.idPhotoUrl, // Auto-verified if ID uploaded in test mode
      idPhotoUrl: data.idPhotoUrl,
      trustScore: data.idPhotoUrl ? 85 : 60,
      rating: 5.0,
      totalReviews: 0,
      completedTrades: 0,
      punctualityRate: 100,
      bio: `Student at ${data.campus} - ${data.college}.`,
      joinedDate: 'Aug 2026',
      password: data.password
    };

    setUsers((prev) => {
      if (prev.some((u) => u.email.toLowerCase() === newUser.email.toLowerCase() || u.studentId.toLowerCase() === newUser.studentId.toLowerCase() || u.id === newUser.id)) {
        return prev;
      }
      return [newUser, ...prev];
    });
    setCurrentUserId(newUser.id);
    return { success: true, message: `Account created for ${newUser.name}! Welcome to UC TradeLink.` };
  };

  const forgotPassword = (email: string): { success: boolean; resetCode?: string; message: string } => {
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      return { success: false, message: 'No registered UC account found with that email address.' };
    }
    const mockCode = Math.floor(1000 + Math.random() * 9000).toString();
    return {
      success: true,
      resetCode: mockCode,
      message: `Verification code sent to ${email}. Mock code: ${mockCode}`
    };
  };

  const resetPassword = (
    email: string,
    code: string,
    newPassword: string
  ): { success: boolean; message: string } => {
    if (!code || code.length !== 4) {
      return { success: false, message: 'Invalid 4-digit verification code.' };
    }
    const userIndex = users.findIndex((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (userIndex === -1) {
      return { success: false, message: 'Account not found.' };
    }

    setUsers((prev) =>
      prev.map((u) => (u.email.toLowerCase() === email.trim().toLowerCase() ? { ...u, password: newPassword } : u))
    );

    return { success: true, message: 'Password reset successfully. You may now login.' };
  };

  const logout = () => {
    setCurrentUserId(null);
  };

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUserId(userId);
    }
  };

  const updateProfile = (data: Partial<User>) => {
    if (!currentUser) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, ...data } : u))
    );
  };

  const submitIdVerification = (studentIdNumber: string, idPhotoUrl: string) => {
    if (!currentUser) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? {
              ...u,
              studentId: studentIdNumber.replace(/\D/g, ''),
              idPhotoUrl: idPhotoUrl,
              isVerified: true,
              trustScore: 90
            }
          : u
      )
    );
  };

  const resetAllData = () => {
    window.localStorage.clear();
    window.location.reload();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers: users,
        isAuthenticated,
        isAdmin,
        login,
        register,
        forgotPassword,
        resetPassword,
        logout,
        switchUser,
        updateProfile,
        submitIdVerification,
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
