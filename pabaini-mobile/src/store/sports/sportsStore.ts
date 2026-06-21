import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CricketPlayerProfile, PlayerRegistration } from '../../types/sports.types';

interface SportsStore {
  seenOptIn: Record<string, boolean>;
  registrations: Record<string, PlayerRegistration>;
  markOptInSeen: (sportId: string) => void;
  setRegistration: (sportId: string, profile: CricketPlayerProfile) => void;
  clearRegistration: (sportId: string) => void;
  isRegistered: (sportId: string) => boolean;
  hasSeenOptIn: (sportId: string) => boolean;
  reset: () => void;
}

const memoryStore: Record<string, string> = {};

const safeAsyncStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(name);
    } catch (e) {
      console.warn('AsyncStorage native module is missing, falling back to memory storage:', e);
      return memoryStore[name] || null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(name, value);
    } catch (e) {
      console.warn('AsyncStorage native module is missing, falling back to memory storage:', e);
      memoryStore[name] = value;
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(name);
    } catch (e) {
      console.warn('AsyncStorage native module is missing, falling back to memory storage:', e);
      delete memoryStore[name];
    }
  },
};

export const useSportsStore = create<SportsStore>()(
  persist(
    (set, get) => ({
      seenOptIn: {},
      registrations: {},
      markOptInSeen: (sportId) =>
        set((state) => ({
          seenOptIn: { ...state.seenOptIn, [sportId]: true },
        })),
      setRegistration: (sportId, profile) =>
        set((state) => ({
          registrations: {
            ...state.registrations,
            [sportId]: { sportId, isRegistered: true, profile },
          },
        })),
      clearRegistration: (sportId) =>
        set((state) => ({
          registrations: {
            ...state.registrations,
            [sportId]: { sportId, isRegistered: false, profile: null },
          },
        })),
      isRegistered: (sportId) => {
        const reg = get().registrations[sportId];
        return !!(reg && reg.isRegistered && reg.profile);
      },
      hasSeenOptIn: (sportId) => {
        return !!get().seenOptIn[sportId];
      },
      reset: () =>
        set({
          seenOptIn: {},
          registrations: {},
        }),
    }),
    {
      name: 'sports-storage',
      storage: createJSONStorage(() => safeAsyncStorage),
    }
  )
);

