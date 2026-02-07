// Card Component - базовая карточка согласно DESIGN.md

import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { BorderRadius, Shadows, Spacing } from '../config/theme';
import { useTheme } from '../config/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevation?: 0 | 1 | 2 | 3 | 4;
}

export default function Card({ children, style, elevation = 2 }: CardProps) {
  const { theme, isDark } = useTheme();

  const shadowStyle =
    elevation === 0
      ? Shadows.level0
      : elevation === 1
      ? Shadows.level1
      : elevation === 2
      ? Shadows.level2
      : elevation === 3
      ? Shadows.level3
      : Shadows.level4;

  const cardStyle = {
    ...styles.card,
    backgroundColor: theme.surface,
    ...(isDark && {
      borderWidth: 1,
      borderColor: theme.border,
    }),
    ...shadowStyle,
  };

  return <View style={[cardStyle, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
  },
});
