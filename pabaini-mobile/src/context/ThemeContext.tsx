import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import { themes, Theme } from '../theme';

type ThemeContextType = {
  theme: Theme;
  mode: 'light' | 'dark';
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Seed the initial mode from the device's system preference.
  // The user can still override via toggleTheme() if we add a settings toggle later.
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<'light' | 'dark'>(
    systemScheme === 'dark' ? 'dark' : 'light'
  );

  const theme = themes[mode];
  const toggleTheme = () => setMode((m) => (m === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
