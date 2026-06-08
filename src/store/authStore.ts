import { create } from 'zustand';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants';

interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  agency?: string;
  avatar?: string;
  isAadhaarVerified: boolean;
  isReraVerified: boolean;
  reraId?: string;
  locality?: string;
  ratingScore?: number;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  accessToken: storage.getString(STORAGE_KEYS.ACCESS_TOKEN) ?? null,
  isAuthenticated: !!storage.getString(STORAGE_KEYS.ACCESS_TOKEN),
  isLoading: false,

  setAuth: (user, accessToken, refreshToken) => {
    storage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    storage.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    storage.set(STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));
    set({ user, accessToken, isAuthenticated: true });
  },

  updateUser: updates =>
    set(state => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),

  logout: () => {
    storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
    storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
    storage.remove(STORAGE_KEYS.USER_PROFILE);
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  setLoading: loading => set({ isLoading: loading }),
}));
