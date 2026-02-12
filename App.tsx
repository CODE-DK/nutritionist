import { useEffect } from 'react';

import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/config/AuthContext';
import { loadLanguage } from './src/config/i18n';
import './src/config/i18n'; // Initialize i18n
import { ThemeProvider, useTheme } from './src/config/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

function AppContent() {
  const { isDark } = useTheme();

  useEffect(() => {
    // Load saved language preference
    loadLanguage();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'auto'} />
      {Platform.OS === 'web' ? (
        <View style={[styles.webRoot, { backgroundColor: isDark ? '#0f1115' : '#f3f5f8' }]}>
          <View
            style={[
              styles.webFrame,
              {
                backgroundColor: isDark ? '#12161c' : '#ffffff',
                borderColor: isDark ? '#222a36' : '#dfe3ea',
              },
            ]}
          >
            <AppNavigator />
          </View>
        </View>
      ) : (
        <AppNavigator />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  webRoot: {
    alignItems: 'center',
    flex: 1,
    width: '100%',
  },
  webFrame: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    flex: 1,
    maxWidth: 520,
    width: '100%',
  },
});

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
