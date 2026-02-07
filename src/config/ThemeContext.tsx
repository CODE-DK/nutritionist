// ThemeContext - управление темой приложения

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightColors, DarkColors } from './theme';

export type ThemeMode = 'light' | 'dark' | 'auto';

export type ThemeColors = typeof LightColors;

interface ThemeContextType {
  theme: ThemeColors;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app_theme_mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemTheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [theme, setTheme] = useState<ThemeColors>(LightColors);
  const [isDark, setIsDark] = useState(false);

  // Загрузить сохраненную тему при запуске
  useEffect(() => {
    loadTheme();
  }, []);

  // Обновить тему при изменении режима или системной темы
  useEffect(() => {
    updateTheme();
  }, [themeMode, systemTheme]);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const updateTheme = () => {
    let shouldBeDark = false;

    if (themeMode === 'dark') {
      shouldBeDark = true;
    } else if (themeMode === 'auto') {
      shouldBeDark = systemTheme === 'dark';
    }

    setIsDark(shouldBeDark);
    setTheme(shouldBeDark ? DarkColors : LightColors);
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, isDark, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
