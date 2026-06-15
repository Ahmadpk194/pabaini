import React, { createContext, useContext, useState } from 'react';
import { themes, Theme } from '../theme';

type ThemeContextType = { theme: Theme; mode: 'light' | 'dark'; toggleTheme: () => void };
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const theme = themes[mode];
  const toggleTheme = () => setMode((m) => (m === 'light' ? 'dark' : 'light'));
  return <ThemeContext.Provider value={{ theme, mode, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
