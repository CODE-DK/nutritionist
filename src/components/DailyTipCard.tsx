/**
 * Daily Tip Card Component
 *
 * Карточка для отображения ежедневного совета по питанию.
 * Показывается в DiaryScreen и может быть закрыта пользователем.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import Card from './Card';
import Button from './Button';
import { Typography, Spacing, BorderRadius } from '../config/theme';
import { useTheme } from '../config/ThemeContext';

import type { DailyTip } from '../types';

interface DailyTipCardProps {
  tip: DailyTip;
  onDismiss: () => void;
  onLearnMore?: () => void;
}

export default function DailyTipCard({ tip, onDismiss, onLearnMore }: DailyTipCardProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <Card style={[styles.container, { backgroundColor: theme.surface }]}>
      {/* Заголовок */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.lightbulb}>💡</Text>
          <Text style={[styles.headerTitle, { color: theme.primary }]}>
            {t('tips.dailyTip')}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Эмодзи и заголовок совета */}
      <View style={styles.content}>
        {tip.emoji && <Text style={styles.emoji}>{tip.emoji}</Text>}
        <Text style={[styles.tipTitle, { color: theme.text }]}>{tip.title}</Text>
        <Text style={[styles.tipText, { color: theme.textSecondary }]}>{tip.text}</Text>
      </View>

      {/* Кнопки */}
      <View style={styles.actions}>
        <Button
          title={t('tips.gotIt')}
          variant="secondary"
          onPress={onDismiss}
          style={styles.button}
        />
        {onLearnMore && (
          <Button title={t('tips.learnMore')} onPress={onLearnMore} style={styles.button} />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lightbulb: {
    fontSize: 20,
    marginRight: Spacing.xs,
  },
  headerTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  content: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  tipTitle: {
    ...Typography.h3,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  tipText: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
  },
});
