import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────────────────────────────────────
// Theme Store
// First Zustand store in this project to use persist middleware.
// The chosen colorScheme is written to AsyncStorage under 'pabaini-theme'
// so the user's preference survives app restarts.
// Theme resolution ('system' → device scheme) happens in ThemeContext.
// ─────────────────────────────────────────────────────────────────────────────

export type ColorScheme = 'light' | 'dark' | 'system';

interface ThemeStore {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      colorScheme: 'system', // default: follow device theme on first install
      setColorScheme: (scheme) => set({ colorScheme: scheme }),
    }),
    {
      name: 'pabaini-theme',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
