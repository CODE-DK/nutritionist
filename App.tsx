import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/config/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import './src/config/i18n'; // Initialize i18n
import { loadLanguage } from './src/config/i18n';

function AppContent() {
  const { isDark } = useTheme();

  useEffect(() => {
    // Load saved language preference
    loadLanguage();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'auto'} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
