// StatsCard Component - карточка статистики за день согласно DESIGN.md

import React from 'react';

import { View, Text, StyleSheet } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { Typography, BorderRadius, Shadows, Spacing } from '../config/theme';
import { useTheme } from '../config/ThemeContext';

import type { DailyStats } from '../types';

interface StatsCardProps {
  stats: DailyStats;
}

export default function StatsCard({ stats }: StatsCardProps) {
  const { theme } = useTheme();
  const percentage = Math.min(100, Math.round((stats.totalCalories / stats.calorieGoal) * 100));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    }

    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  const styles = StyleSheet.create({
    calories: {
      color: theme.white,
      fontSize: 28,
      fontWeight: '700',
      marginBottom: Spacing.md,
    },
    card: {
      borderRadius: BorderRadius.xlarge,
      marginBottom: Spacing.md,
      padding: Spacing.lg,
    },
    date: {
      color: theme.white,
      fontSize: Typography.body.fontSize,
      marginBottom: Spacing.sm,
      opacity: 0.9,
    },
    macroItem: {
      alignItems: 'center',
    },
    macroLabel: {
      color: theme.white,
      fontSize: Typography.caption.fontSize,
      marginBottom: Spacing.xs,
      opacity: 0.8,
    },
    macroValue: {
      color: theme.white,
      fontSize: Typography.bodyLarge.fontSize,
      fontWeight: '600',
    },
    macrosContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    progressContainer: {
      alignItems: 'center',
      flexDirection: 'row',
      marginBottom: Spacing.md,
    },
    progressFill: {
      backgroundColor: theme.white,
      borderRadius: 4,
      height: '100%',
    },
    progressText: {
      color: theme.white,
      fontSize: Typography.body.fontSize,
      fontWeight: '600',
      marginLeft: Spacing.sm,
      minWidth: 40,
    },
    progressTrack: {
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      borderRadius: 4,
      flex: 1,
      height: 8,
      overflow: 'hidden',
    },
  });

  return (
    <LinearGradient
      colors={[theme.gradientHealthyStart, theme.gradientHealthyEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, Shadows.level3]}
    >
      {/* Дата */}
      <Text style={styles.date}>{formatDate(stats.date)}</Text>

      {/* Калории */}
      <Text style={styles.calories}>
        {stats.totalCalories.toLocaleString()} / {stats.calorieGoal.toLocaleString()} ккал
      </Text>

      {/* Прогресс бар */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.progressText}>{percentage}%</Text>
      </View>

      {/* БЖУ */}
      <View style={styles.macrosContainer}>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>Б</Text>
          <Text style={styles.macroValue}>{Math.round(stats.totalProtein)}г</Text>
        </View>

        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>У</Text>
          <Text style={styles.macroValue}>{Math.round(stats.totalCarbs)}г</Text>
        </View>

        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>Ж</Text>
          <Text style={styles.macroValue}>{Math.round(stats.totalFat)}г</Text>
        </View>
      </View>
    </LinearGradient>
  );
}
