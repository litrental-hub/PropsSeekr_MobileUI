import { create } from 'zustand';
import { SectionType, STORAGE_KEYS } from '../constants';
import { storage } from '../utils/storage';

export type ThemeType = 'dark' | 'light';

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
}

export const useAppStore = create<AppState>((set, get) => ({
  theme: (storage.getString('theme') as ThemeType) ?? 'dark',
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
}));
