// Input Component - согласно DESIGN.md

import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Typography, BorderRadius, Spacing } from '../config/theme';
import { useTheme } from '../config/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export default function Input({
  label,
  error,
  containerStyle,
  style,
  ...textInputProps
}: InputProps) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const getInputStyle = () => {
    const baseStyle = {
      ...styles.input,
      backgroundColor: theme.surface,
      borderColor: error ? theme.error : isFocused ? theme.primary : theme.border,
      color: theme.text,
    };

    if (isFocused && !error) {
      return {
        ...baseStyle,
        shadowColor: theme.primary,
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 8,
        elevation: 2,
      };
    }

    return baseStyle;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: theme.text }]}>{label}</Text>}

      <TextInput
        style={[getInputStyle(), style]}
        placeholderTextColor={theme.disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...textInputProps}
      />

      {error && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.error }]}>⚠️ {error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.body.fontSize,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.bodyLarge.fontSize,
  },
  errorContainer: {
    marginTop: Spacing.xs,
  },
  errorText: {
    fontSize: Typography.caption.fontSize,
  },
});
