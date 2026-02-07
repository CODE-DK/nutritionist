// Loading Component - индикатор загрузки

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Typography, Spacing } from '../config/theme';
import { useTheme } from '../config/ThemeContext';

interface LoadingProps {
  text?: string;
  fullScreen?: boolean;
}

export default function Loading({ text, fullScreen = false }: LoadingProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    fullScreen: {
      flex: 1,
      backgroundColor: theme.background,
    },
    text: {
      marginTop: Spacing.md,
      fontSize: Typography.body.fontSize,
      color: theme.textSecondary,
    },
  });

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={theme.primary} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
}
