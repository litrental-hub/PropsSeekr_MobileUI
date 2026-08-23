import { create } from 'zustand';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants';
import { logout as logoutApi } from '../api/auth';

interface User {
  id: string; // The backend GUID
  brokerId?: number | string; // The numeric broker ID used for profile
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
  appPin: string | null;
  biometricEnabled: boolean;
  isLocked: boolean;
  isIgnoringAppLock: boolean;

  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  
  setAppPin: (pin: string | null) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setIsLocked: (locked: boolean) => void;
  setIsIgnoringAppLock: (ignore: boolean) => void;
}

export const useAuthStore = create<AuthState>(set => {
  const storedPin = storage.getString(STORAGE_KEYS.APP_PIN) ?? null;
  const isAuth = !!storage.getString(STORAGE_KEYS.ACCESS_TOKEN);

  let storedUser: User | null = null;
  try {
    const userJson = storage.getString(STORAGE_KEYS.USER_PROFILE);
    if (userJson) {
      storedUser = JSON.parse(userJson);
    }
  } catch (e) {
    console.error('Error parsing stored user profile on boot:', e);
  }

  return {
    user: storedUser,
    accessToken: storage.getString(STORAGE_KEYS.ACCESS_TOKEN) ?? null,
    isAuthenticated: isAuth,
    isLoading: false,
    
    appPin: storedPin,
    biometricEnabled: storage.getBoolean(STORAGE_KEYS.BIOMETRIC_ENABLED) ?? false,
    isLocked: isAuth && !!storedPin, // Lock immediately on boot if authenticated and has PIN
    isIgnoringAppLock: false,

    setAuth: (user, accessToken, refreshToken) => {
      storage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      storage.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      storage.set(STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));
      set({ user, accessToken, isAuthenticated: true });
    },

    updateUser: updates =>
      set(state => {
        const newUser = state.user ? { ...state.user, ...updates } : null;
        if (newUser) {
          storage.set(STORAGE_KEYS.USER_PROFILE, JSON.stringify(newUser));
        }
        return { user: newUser };
      }),

    logout: async () => {
      try {
        await logoutApi();
      } catch (err) {
        console.log('Server logout failed or network offline:', err);
      }
      storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
      storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
      storage.remove(STORAGE_KEYS.USER_PROFILE);
      storage.remove(STORAGE_KEYS.APP_PIN);
      storage.remove(STORAGE_KEYS.BIOMETRIC_ENABLED);
      set({ 
        user: null, 
        accessToken: null, 
        isAuthenticated: false,
        appPin: null,
        biometricEnabled: false,
        isLocked: false,
      });
    },

    setLoading: loading => set({ isLoading: loading }),
    
    setAppPin: (pin) => {
      if (pin) {
        storage.set(STORAGE_KEYS.APP_PIN, pin);
      } else {
        storage.remove(STORAGE_KEYS.APP_PIN);
      }
      set({ appPin: pin });
    },
    
    setBiometricEnabled: (enabled) => {
      storage.set(STORAGE_KEYS.BIOMETRIC_ENABLED, enabled);
      set({ biometricEnabled: enabled });
    },

    setIsLocked: (locked) => set({ isLocked: locked }),
    setIsIgnoringAppLock: (ignore) => set({ isIgnoringAppLock: ignore }),
  };
});
