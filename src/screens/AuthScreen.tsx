// AuthScreen - экран входа/регистрации

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Button from '../components/Button';
import Input from '../components/Input';
import { Typography, Spacing } from '../config/theme';
import { useTheme } from '../config/ThemeContext';
import authService from '../services/authService';
import analyticsService from '../services/analyticsService';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email || !email.includes('@')) {
      newErrors.email = t('auth.invalidEmail');
    }

    if (!password || password.length < 6) {
      newErrors.password = t('auth.passwordTooShort');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await authService.signIn(email, password);
        analyticsService.track('user_logged_in', { email });
      } else {
        await authService.signUp(email, password);
        analyticsService.track('user_registered', { email });
      }

      onAuthSuccess();
    } catch (error: any) {
      const errorTitle = isLogin ? t('auth.signInError') : t('auth.signUpError');
      Alert.alert(t('common.error'), error.message || errorTitle);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.white,
    },
    keyboardView: {
      flex: 1,
    },
    content: {
      padding: Spacing.lg,
      justifyContent: 'center',
      minHeight: '100%',
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: Spacing.xxl,
    },
    logoEmoji: {
      fontSize: 80,
      marginBottom: Spacing.md,
    },
    title: {
      ...Typography.h2,
      textAlign: 'center',
      marginBottom: Spacing.xs,
    },
    subtitle: {
      ...Typography.bodyLarge,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    form: {
      marginBottom: Spacing.xl,
    },
    submitButton: {
      marginVertical: Spacing.md,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: Spacing.xl,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.border,
    },
    dividerText: {
      ...Typography.caption,
      marginHorizontal: Spacing.md,
      color: theme.textSecondary,
    },
    socialPlaceholder: {
      ...Typography.caption,
      textAlign: 'center',
      color: theme.disabled,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Логотип */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🥗</Text>
            <Text style={styles.title}>{t('auth.welcome')}</Text>
            <Text style={styles.subtitle}>{t('onboarding.subtitle')}</Text>
          </View>

          {/* Форма */}
          <View style={styles.form}>
            <Input
              label={t('auth.email')}
              placeholder="email@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
            />

            <Input
              label={t('auth.password')}
              placeholder={t('auth.passwordTooShort')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              error={errors.password}
            />

            <Button
              title={isLogin ? t('auth.signInButton') : t('auth.signUpButton')}
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitButton}
            />

            <Button
              title={isLogin ? t('auth.dontHaveAccount') : t('auth.alreadyHaveAccount')}
              variant="text"
              onPress={toggleMode}
              disabled={loading}
            />
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.signInButton')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social login (v2) */}
          <Text style={styles.socialPlaceholder}>
            Google / Apple Sign-In{'\n'}({t('paywall.comingSoon')})
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
