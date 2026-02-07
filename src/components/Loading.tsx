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
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.xl,
    },
    fullScreen: {
      backgroundColor: theme.background,
      flex: 1,
    },
    text: {
      color: theme.textSecondary,
      fontSize: Typography.body.fontSize,
      marginTop: Spacing.md,
    },
  });

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={theme.primary} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
}
