/**
 * ProgressCard - переиспользуемая карточка прогресса с анимированным progress bar
 */

import React, { useEffect, useRef } from 'react';

import { View, Text, StyleSheet, Animated } from 'react-native';

import { Typography, Spacing, BorderRadius } from '../config/theme';
import { useTheme } from '../config/ThemeContext';

interface ProgressCardProps {
  title: string;
  current: number;
  target: number;
  unit?: string;
  percentage: number;
  estimatedWeeks?: number;
  weeklyChange?: number;
}

export default function ProgressCard({
  title,
  current,
  target,
  unit = 'кг',
  percentage,
  estimatedWeeks,
  weeklyChange,
}: ProgressCardProps) {
  const { theme } = useTheme();
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Анимация progress bar при монтировании и изменении процента
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: Math.min(percentage, 100),
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  // Определяем тип цели на основе разности весов
  const goalType = current > target ? 'lose' : current < target ? 'gain' : 'achieved';
  const diff = Math.abs(current - target);

  // Интерполяция ширины прогресс-бара
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  // Цвет прогресс-бара в зависимости от процента
  const getProgressColor = () => {
    if (percentage >= 100) return '#4CAF50'; // Зеленый - цель достигнута
    if (percentage >= 70) return theme.primary; // Основной цвет - хороший прогресс
    if (percentage >= 30) return '#FF9800'; // Оранжевый - средний прогресс
    return '#F44336'; // Красный - начало пути
  };

  // Текст для отображения типа цели
  const getGoalText = () => {
    if (goalType === 'achieved') return '🎉 Цель достигнута!';
    if (goalType === 'lose') return `Похудение: -${diff.toFixed(1)} ${unit}`;
    return `Набор массы: +${diff.toFixed(1)} ${unit}`;
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.surface }]}>
      {/* Заголовок */}
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>

      {/* Тип цели */}
      <Text style={[styles.goalText, { color: theme.text }]}>{getGoalText()}</Text>

      {/* Progress Bar */}
      <View style={[styles.progressBarContainer, { backgroundColor: theme.background }]}>
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              width: progressWidth,
              backgroundColor: getProgressColor(),
            },
          ]}
        />
      </View>

      {/* Процент */}
      <Text style={[styles.percentage, { color: theme.textSecondary }]}>
        {Math.round(percentage)}%
      </Text>

      {/* Статистика */}
      {goalType !== 'achieved' && weeklyChange !== undefined && estimatedWeeks !== undefined && (
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Темп:</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {weeklyChange > 0 ? '+' : ''}
              {weeklyChange.toFixed(1)} {unit}/неделю
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>До цели:</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {estimatedWeeks > 0
                ? `~${estimatedWeeks} ${getWeeksLabel(estimatedWeeks)}`
                : 'Достигнута'}
            </Text>
          </View>
        </View>
      )}

      {/* Текущий vs Целевой вес */}
      <View style={styles.weights}>
        <View style={styles.weightItem}>
          <Text style={[styles.weightLabel, { color: theme.textSecondary }]}>Текущий</Text>
          <Text style={[styles.weightValue, { color: theme.text }]}>
            {current.toFixed(1)} {unit}
          </Text>
        </View>

        <View style={styles.arrow}>
          <Text style={styles.arrowIcon}>→</Text>
        </View>

        <View style={styles.weightItem}>
          <Text style={[styles.weightLabel, { color: theme.textSecondary }]}>Цель</Text>
          <Text style={[styles.weightValue, { color: theme.primary }]}>
            {target.toFixed(1)} {unit}
          </Text>
        </View>
      </View>
    </View>
  );
}

// Склонение слова "неделя"
function getWeeksLabel(weeks: number): string {
  const lastDigit = weeks % 10;
  const lastTwoDigits = weeks % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'недель';
  }

  if (lastDigit === 1) {
    return 'неделя';
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'недели';
  }

  return 'недель';
}

const styles = StyleSheet.create({
  arrow: {
    paddingHorizontal: Spacing.md,
  },
  arrowIcon: {
    color: '#9E9E9E',
    fontSize: 24,
  },
  card: {
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  goalText: {
    ...Typography.bodyLarge,
    marginBottom: Spacing.md,
  },
  percentage: {
    ...Typography.body,
    marginBottom: Spacing.md,
    textAlign: 'right',
  },
  progressBarContainer: {
    borderRadius: BorderRadius.small,
    height: 12,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    borderRadius: BorderRadius.small,
    height: '100%',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    ...Typography.caption,
    marginBottom: 4,
  },
  statValue: {
    ...Typography.bodyLarge,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  weightItem: {
    alignItems: 'center',
    flex: 1,
  },
  weightLabel: {
    ...Typography.caption,
    marginBottom: 4,
  },
  weightValue: {
    ...Typography.h3,
  },
  weights: {
    alignItems: 'center',
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
  },
});
