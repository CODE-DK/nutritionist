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

import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../config/AuthContext';
import { Typography, Spacing } from '../config/theme';
import { useTheme } from '../config/ThemeContext';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { signIn, signUp, loading: authLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }

      onAuthSuccess();
    } catch (error: any) {
      const errorTitle = isLogin ? t('auth.signInError') : t('auth.signUpError');
      Alert.alert(t('common.error'), error.message || errorTitle);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.white,
      flex: 1,
    },
    content: {
      justifyContent: 'center',
      minHeight: '100%',
      padding: Spacing.lg,
    },
    divider: {
      alignItems: 'center',
      flexDirection: 'row',
      marginVertical: Spacing.xl,
    },
    dividerLine: {
      backgroundColor: theme.border,
      flex: 1,
      height: 1,
    },
    dividerText: {
      ...Typography.caption,
      color: theme.textSecondary,
      marginHorizontal: Spacing.md,
    },
    form: {
      marginBottom: Spacing.xl,
    },
    keyboardView: {
      flex: 1,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: Spacing.xxl,
    },
    logoEmoji: {
      fontSize: 80,
      marginBottom: Spacing.md,
    },
    socialPlaceholder: {
      ...Typography.caption,
      color: theme.disabled,
      textAlign: 'center',
    },
    submitButton: {
      marginVertical: Spacing.md,
    },
    subtitle: {
      ...Typography.bodyLarge,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    title: {
      ...Typography.h2,
      marginBottom: Spacing.xs,
      textAlign: 'center',
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
              loading={authLoading}
              style={styles.submitButton}
            />

            <Button
              title={isLogin ? t('auth.dontHaveAccount') : t('auth.alreadyHaveAccount')}
              variant="text"
              onPress={toggleMode}
              disabled={authLoading}
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
