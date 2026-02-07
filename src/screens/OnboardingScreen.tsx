// OnboardingScreen - первый экран при запуске приложения

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Button from '../components/Button';
import { Typography, Spacing } from '../config/theme';
import { useTheme } from '../config/ThemeContext';
import { ONBOARDING_EXAMPLES, APP_CONFIG } from '../config/constants';

interface OnboardingScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function OnboardingScreen({ onComplete, onSkip }: OnboardingScreenProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.white,
    },
    header: {
      alignItems: 'flex-end',
      marginBottom: Spacing.lg,
    },
    content: {
      padding: Spacing.lg,
      alignItems: 'center',
    },
    emoji: {
      fontSize: 80,
      marginVertical: Spacing.xl,
    },
    title: {
      ...Typography.h1,
      marginBottom: Spacing.md,
    },
    description: {
      ...Typography.bodyLarge,
      textAlign: 'center',
      color: theme.textSecondary,
      lineHeight: 28,
      marginBottom: Spacing.xxl,
    },
    examplesContainer: {
      width: '100%',
      marginBottom: Spacing.xl,
    },
    examplesTitle: {
      ...Typography.h3,
      marginBottom: Spacing.md,
    },
    exampleCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.primaryLight,
      padding: Spacing.md,
      borderRadius: 12,
      marginBottom: Spacing.sm,
    },
    exampleEmoji: {
      fontSize: 24,
      marginRight: Spacing.md,
    },
    exampleText: {
      ...Typography.bodyLarge,
      flex: 1,
    },
    limitText: {
      ...Typography.body,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    footer: {
      padding: Spacing.lg,
      paddingBottom: Spacing.xl,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Skip кнопка */}
        <View style={styles.header}>
          <Button title={t('onboarding.skip')} variant="text" onPress={onSkip} />
        </View>

        {/* Welcome emoji */}
        <Text style={styles.emoji}>👋</Text>

        {/* Заголовок */}
        <Text style={styles.title}>{t('onboarding.welcome')}</Text>

        {/* Описание */}
        <Text style={styles.description}>
          {t('onboarding.subtitle')}
        </Text>

        {/* Примеры вопросов */}
        <View style={styles.examplesContainer}>
          <Text style={styles.examplesTitle}>{t('onboarding.title')}</Text>

          {ONBOARDING_EXAMPLES.map((example, index) => (
            <View key={index} style={styles.exampleCard}>
              <Text style={styles.exampleEmoji}>
                {index === 0 ? '💬' : index === 1 ? '🍽' : '🥗'}
              </Text>
              <Text style={styles.exampleText}>"{example}"</Text>
            </View>
          ))}
        </View>

        {/* Информация о лимите */}
        <Text style={styles.limitText}>
          {APP_CONFIG.FREE_DAILY_AI_LIMIT} {t('chat.requestsUsed', { used: 0, limit: APP_CONFIG.FREE_DAILY_AI_LIMIT })}
        </Text>
      </ScrollView>

      {/* Кнопка начать */}
      <View style={styles.footer}>
        <Button title={t('onboarding.getStarted')} onPress={onComplete} />
      </View>
    </SafeAreaView>
  );
}
