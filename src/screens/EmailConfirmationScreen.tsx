import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../config/theme';
import { supabase } from '../config/supabase';

interface EmailConfirmationScreenProps {
  onSuccess: () => void;
}

export default function EmailConfirmationScreen({ onSuccess }: EmailConfirmationScreenProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Подтверждаем ваш email...');

  useEffect(() => {
    verifyEmailConfirmation();
  }, []);

  const verifyEmailConfirmation = async () => {
    try {
      // Проверяем текущую сессию
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      if (session?.user) {
        // Email подтвержден успешно
        setStatus('success');
        setMessage('Email успешно подтвержден!');

        // Через 2 секунды переходим в приложение
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setStatus('error');
        setMessage('Не удалось подтвердить email. Попробуйте снова.');
      }
    } catch (error: any) {
      console.error('Email confirmation error:', error);
      setStatus('error');
      setMessage(error.message || 'Произошла ошибка при подтверждении email');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {status === 'loading' && (
          <>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.title}>{message}</Text>
          </>
        )}

        {status === 'success' && (
          <>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
            </View>
            <Text style={styles.title}>{message}</Text>
            <Text style={styles.subtitle}>Перенаправляем вас в приложение...</Text>
          </>
        )}

        {status === 'error' && (
          <>
            <View style={styles.iconContainer}>
              <Ionicons name="close-circle" size={80} color={Colors.error} />
            </View>
            <Text style={styles.title}>Ошибка</Text>
            <Text style={styles.errorText}>{message}</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 8,
  },
});
