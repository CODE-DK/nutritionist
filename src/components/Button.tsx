// Button Component - согласно DESIGN.md

import React from 'react';

import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

import { Typography, BorderRadius, Shadows, Spacing } from '../config/theme';
import { useTheme } from '../config/ThemeContext';

type ButtonVariant = 'primary' | 'secondary' | 'text';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const { theme, isDark } = useTheme();

  const getButtonStyles = () => {
    const baseStyle = [styles.base, style];

    if (disabled || loading) {
      return [
        ...baseStyle,
        {
          backgroundColor: theme.disabled,
          borderColor: theme.disabled,
          opacity: 0.6,
        },
      ];
    }

    if (variant === 'primary') {
      return [
        ...baseStyle,
        {
          backgroundColor: theme.primary,
          ...Shadows.level2,
        },
      ];
    }

    if (variant === 'secondary') {
      return [
        ...baseStyle,
        {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: theme.primary,
        },
      ];
    }

    // text variant
    return [
      ...baseStyle,
      {
        backgroundColor: 'transparent',
        paddingHorizontal: Spacing.md,
      },
    ];
  };

  const getTextStyles = () => {
    const baseText = [styles.baseText, textStyle];

    if (disabled || loading) {
      return [...baseText, { color: isDark ? theme.textSecondary : theme.white }];
    }

    if (variant === 'primary') {
      return [...baseText, { color: isDark ? theme.black : theme.white }];
    }

    if (variant === 'secondary' || variant === 'text') {
      return [...baseText, { color: theme.primary }];
    }

    return baseText;
  };

  return (
    <TouchableOpacity
      style={getButtonStyles()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? (isDark ? theme.black : theme.white) : theme.primary}
          size="small"
        />
      ) : (
        <Text style={getTextStyles()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: BorderRadius.medium,
    flexDirection: 'row',
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  baseText: {
    fontSize: Typography.button.fontSize,
    fontWeight: Typography.button.fontWeight,
    letterSpacing: Typography.button.letterSpacing,
  },
});
