import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Campus, College } from '../types';
import { MOCK_USERS } from '../data/seedData';

const AUTH_USER_KEY = 'tradelink_mobile_auth_user';
const REGISTERED_USERS_KEY = 'tradelink_mobile_registered_users';

interface RegisterData {
  name: string;
  email: string;
  studentId: string;
  campus: Campus;
  college: College;
  password?: string;
  avatar?: string;
}

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  registeredUsers: User[];
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updatedData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>(MOCK_USERS);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      // Load saved registered users
      const savedUsersJson = await AsyncStorage.getItem(REGISTERED_USERS_KEY);
      let usersList = MOCK_USERS;
      if (savedUsersJson) {
        const parsed = JSON.parse(savedUsersJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with mock users avoiding duplicates by ID
          const existingIds = new Set(parsed.map((u: User) => u.id));
          const uniqueMocks = MOCK_USERS.filter((u) => !existingIds.has(u.id));
          usersList = [...parsed, ...uniqueMocks];
        }
      }
      setRegisteredUsers(usersList);

      // Load logged-in user (if previously logged in)
      const savedUserJson = await AsyncStorage.getItem(AUTH_USER_KEY);
      if (savedUserJson) {
        const user = JSON.parse(savedUserJson);
        setCurrentUser(user);
      }
    } catch (e) {
      console.warn('Failed to load auth data:', e);
    } finally {
      setIsInitialized(true);
    }
  };

  const login = async (email: string, _password?: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your student email address.' };
    }

    // Find in registered users list
    const foundUser = registeredUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!foundUser) {
      return {
        success: false,
        error: 'No account found with this email. Please create an account first.',
      };
    }

    setCurrentUser(foundUser);
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(foundUser));
    setIsAuthModalOpen(false);
    return { success: true };
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanName = data.name.trim();
    const cleanId = data.studentId.trim();

    if (!cleanName) {
      return { success: false, error: 'Full name is required.' };
    }
    if (!cleanId) {
      return { success: false, error: 'Student ID Number is required (e.g. 2024-12345).' };
    }
    if (!cleanEmail) {
      return { success: false, error: 'Student Email is required.' };
    }
    if (!cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address (e.g. name@uc.edu.ph).' };
    }

    // Check if email already registered
    const existing = registeredUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, error: 'An account with this email already exists. Please log in.' };
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: cleanName,
      studentId: cleanId,
      email: cleanEmail,
      campus: data.campus,
      college: data.college,
      avatar:
        data.avatar ||
        `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80`,
      trustRating: 5.0,
      reviewCount: 1,
      successfulTrades: 0,
      joinedDate: 'August 2026',
      isVerified: true,
      verifiedAt: 'August 2026',
    };

    const updatedList = [newUser, ...registeredUsers];
    setRegisteredUsers(updatedList);
    setCurrentUser(newUser);

    await AsyncStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(updatedList));
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));

    setIsAuthModalOpen(false);
    return { success: true };
  };

  const logout = async () => {
    setCurrentUser(null);
    await AsyncStorage.removeItem(AUTH_USER_KEY);
  };

  const updateProfile = async (updatedData: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updatedData };
    setCurrentUser(updated);
    const updatedList = registeredUsers.map((u) => (u.id === updated.id ? updated : u));
    setRegisteredUsers(updatedList);
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
    await AsyncStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(updatedList));
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        registeredUsers,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        updateProfile,
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
