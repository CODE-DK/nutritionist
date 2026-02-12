import { useState } from 'react';

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../components/Button';
import Input from '../components/Input';
import { Spacing, Typography } from '../config/theme';
import { useTheme } from '../config/ThemeContext';
import authService from '../services/authService';

interface ResetPasswordScreenProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function ResetPasswordScreen({ onSuccess, onClose }: ResetPasswordScreenProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const validate = (): boolean => {
    const nextErrors: { password?: string; confirmPassword?: string } = {};

    if (!password || password.length < 6) {
      nextErrors.password = t('auth.passwordTooShort');
    }

    if (!confirmPassword || confirmPassword.length < 6) {
      nextErrors.confirmPassword = t('auth.passwordTooShort');
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = t('auth.passwordsDoNotMatch');
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await authService.updatePassword(password);

      Alert.alert(t('common.success'), 'Пароль успешно обновлен.');
      onSuccess();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Не удалось обновить пароль.';
      Alert.alert(t('common.error'), message);
    } finally {
      setLoading(false);
    }
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
    form: {
      marginTop: Spacing.xl,
    },
    keyboardView: {
      flex: 1,
    },
    subtitle: {
      ...Typography.bodyLarge,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    title: {
      ...Typography.h2,
      textAlign: 'center',
    },
    top: {
      gap: Spacing.sm,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.top}>
            <Text style={styles.title}>Новый пароль</Text>
            <Text style={styles.subtitle}>Введите новый пароль для вашего аккаунта</Text>
          </View>

          <View style={styles.form}>
            <Input
              label={t('auth.password')}
              placeholder={t('auth.passwordTooShort')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              error={errors.password}
            />

            <Input
              label={t('auth.confirmPassword')}
              placeholder={t('auth.passwordTooShort')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              error={errors.confirmPassword}
            />

            <Button title="Сохранить пароль" onPress={handleSubmit} loading={loading} />

            <Button
              title={t('common.cancel')}
              variant="text"
              onPress={onClose}
              disabled={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
