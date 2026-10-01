import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppSettings } from '../types';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'huta_theme';
const SETTINGS_STORAGE_KEY = 'huta_app_device_settings';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function getInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
    // Also check device settings
    const settingsStr = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (settingsStr) {
      const parsed = JSON.parse(settingsStr) as Partial<AppSettings>;
      if (parsed.theme === 'light' || parsed.theme === 'dark' || parsed.theme === 'system') {
        return parsed.theme;
      }
    }
  } catch (err) {
    console.error('Error reading theme preference:', err);
  }
  return 'light';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme);
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Track system preference changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const resolvedTheme: 'light' | 'dark' = theme === 'system' ? (systemIsDark ? 'dark' : 'light') : theme;
  const isDark = resolvedTheme === 'dark';

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    // Update meta theme-color in head
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#0B0C10' : '#FF5A36');
    }
  }, [isDark]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      // Sync into device settings as well
      const savedSettingsStr = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettingsStr) {
        const parsed = JSON.parse(savedSettingsStr);
        parsed.theme = newTheme;
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (err) {
      console.error('Error saving theme preference:', err);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    // Graceful fallback if used outside Provider
    return {
      theme: 'light',
      resolvedTheme: 'light',
      isDark: false,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
}
