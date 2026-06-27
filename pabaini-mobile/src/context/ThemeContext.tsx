import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { themes, Theme } from '../theme';
import { useThemeStore, ColorScheme } from '../store/themeStore';

// ─────────────────────────────────────────────────────────────────────────────
// ThemeContext
// Resolves the active theme from the persisted colorScheme in themeStore.
// All existing useTheme() consumers are unaffected — public API is unchanged.
//
// colorScheme === 'system' → follows device useColorScheme() in real time
// colorScheme === 'light'  → always light, regardless of device setting
// colorScheme === 'dark'   → always dark, regardless of device setting
// ─────────────────────────────────────────────────────────────────────────────

type ThemeContextType = {
  theme: Theme;
  mode: 'light' | 'dark';
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  /** @deprecated — kept for backward compat, prefer setColorScheme */
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const { colorScheme, setColorScheme } = useThemeStore();

  // Resolve the concrete 'light' | 'dark' mode
  const mode: 'light' | 'dark' =
    colorScheme === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : colorScheme;

  const theme = themes[mode];

  // Legacy toggle helper — flips between light and dark (skips 'system')
  const toggleTheme = () =>
    setColorScheme(mode === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, mode, colorScheme, setColorScheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
