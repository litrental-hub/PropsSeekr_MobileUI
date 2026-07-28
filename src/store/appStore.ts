import { create } from 'zustand';
import { SectionType, STORAGE_KEYS } from '../constants';
import { storage } from '../utils/storage';

export type ThemeType = 'dark' | 'light';

export interface LocationState {
  city: string;
  locality: string;
  lat: number;
  lng: number;
  radiusKm: number;
}

interface AppState {
  theme: ThemeType;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;

  sectionType: SectionType;
  setSectionType: (type: SectionType) => void;

  unreadNotifications: number;
  setUnreadNotifications: (count: number) => void;

  unseenMatches: number;
  setUnseenMatches: (count: number) => void;

  pendingConfirmations: number;
  setPendingConfirmations: (count: number) => void;

  creditsBalance: number;
  setCreditsBalance: (balance: number) => void;

  location: LocationState;
  setLocation: (location: LocationState) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  theme: (storage.getString('theme') as ThemeType) ?? 'light',
  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    storage.set('theme', newTheme);
    set({ theme: newTheme });
  },
  setTheme: theme => {
    storage.set('theme', theme);
    set({ theme });
  },

  sectionType: (storage.getString(STORAGE_KEYS.SECTION_TYPE) as SectionType) ?? 'Buying',
  setSectionType: type => {
    storage.set(STORAGE_KEYS.SECTION_TYPE, type);
    set({ sectionType: type });
  },

  unreadNotifications: 0,
  setUnreadNotifications: count => set({ unreadNotifications: count }),

  unseenMatches: 0,
  setUnseenMatches: count => set({ unseenMatches: count }),

  pendingConfirmations: 0,
  setPendingConfirmations: count => set({ pendingConfirmations: count }),

  creditsBalance: 0,
  setCreditsBalance: balance => set({ creditsBalance: balance }),

  location: (() => {
    const saved = storage.getString('active_location');
    if (saved) {
      try {
        return JSON.parse(saved) as LocationState;
      } catch {
        // Fallback if parsing fails
      }
    }
    return {
      city: 'Indore',
      locality: 'Vijay Nagar',
      lat: 22.7533,
      lng: 75.8937,
      radiusKm: 5,
    };
  })(),
  setLocation: location => {
    storage.set('active_location', JSON.stringify(location));
    set({ location });
  },
}));
