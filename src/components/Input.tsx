// Input Component - согласно DESIGN.md

import { useState } from 'react';

import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

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
  secureTextEntry,
  ...textInputProps
}: InputProps) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const getInputStyle = () => {
    const baseStyle = {
      ...styles.input,
      backgroundColor: theme.surface,
      borderColor: error ? theme.error : isFocused ? theme.primary : theme.border,
      color: theme.text,
      paddingRight: secureTextEntry ? 48 : Spacing.md, // Добавляем отступ для иконки
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

      <View style={styles.inputWrapper}>
        <TextInput
          style={[getInputStyle(), style]}
          placeholderTextColor={theme.disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          {...textInputProps}
        />

        {secureTextEntry && (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

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
  errorContainer: {
    marginTop: Spacing.xs,
  },
  errorText: {
    fontSize: Typography.caption.fontSize,
  },
  eyeIcon: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    position: 'absolute',
    right: Spacing.sm,
    width: 48,
  },
  input: {
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    flex: 1,
    fontSize: Typography.bodyLarge.fontSize,
    height: 48,
    paddingHorizontal: Spacing.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    position: 'relative',
  },
  label: {
    fontSize: Typography.body.fontSize,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
});
