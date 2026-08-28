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
  source: 'gps' | 'manual';
  updatedAt: string;
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

  creditsBalance: number | null;
  freeCreditsBalance: number | null;
  paidCreditsBalance: number | null;
  walletBrokerId: string | null;
  walletStatus: 'idle' | 'loading' | 'ready' | 'error';
  walletError: string | null;
  walletLastSyncedAt: string | null;
  beginWalletLoad: (brokerId: string | number) => void;
  setWalletSnapshot: (brokerId: string | number, freeBalance: number, paidBalance: number, syncedAt?: string) => void;
  setWalletError: (brokerId: string | number, message: string) => void;
  resetWallet: () => void;

  location: LocationState | null;
  setLocation: (location: LocationState) => void;
  clearLocation: () => void;
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

  creditsBalance: null,
  freeCreditsBalance: null,
  paidCreditsBalance: null,
  walletBrokerId: null,
  walletStatus: 'idle',
  walletError: null,
  walletLastSyncedAt: null,
  beginWalletLoad: brokerId => set(state => {
    const normalizedBrokerId = String(brokerId);
    const brokerChanged = state.walletBrokerId !== normalizedBrokerId;
    return {
      walletBrokerId: normalizedBrokerId,
      walletStatus: 'loading',
      walletError: null,
      creditsBalance: brokerChanged ? null : state.creditsBalance,
      freeCreditsBalance: brokerChanged ? null : state.freeCreditsBalance,
      paidCreditsBalance: brokerChanged ? null : state.paidCreditsBalance,
      walletLastSyncedAt: brokerChanged ? null : state.walletLastSyncedAt,
    };
  }),
  setWalletSnapshot: (brokerId, freeBalance, paidBalance, syncedAt) => set({
    walletBrokerId: String(brokerId),
    freeCreditsBalance: freeBalance,
    paidCreditsBalance: paidBalance,
    creditsBalance: freeBalance + paidBalance,
    walletStatus: 'ready',
    walletError: null,
    walletLastSyncedAt: syncedAt || new Date().toISOString(),
  }),
  setWalletError: (brokerId, message) => set(state => ({
    walletBrokerId: String(brokerId),
    walletStatus: 'error',
    walletError: message,
    creditsBalance: state.walletBrokerId === String(brokerId) ? state.creditsBalance : null,
  })),
  resetWallet: () => set({
    creditsBalance: null,
    freeCreditsBalance: null,
    paidCreditsBalance: null,
    walletBrokerId: null,
    walletStatus: 'idle',
    walletError: null,
    walletLastSyncedAt: null,
  }),

  location: (() => {
    const saved = storage.getString('active_location');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<LocationState>;
        if (
          typeof parsed.lat === 'number' &&
          typeof parsed.lng === 'number' &&
          typeof parsed.radiusKm === 'number' &&
          (parsed.source === 'gps' || parsed.source === 'manual') &&
          typeof parsed.updatedAt === 'string'
        ) {
          return parsed as LocationState;
        }
      } catch {
        // Ignore malformed or legacy seeded location values.
      }
    }
    return null;
  })(),
  setLocation: location => {
    storage.set('active_location', JSON.stringify(location));
    set({ location });
  },
  clearLocation: () => {
    storage.remove('active_location');
    set({ location: null });
  },
}));
