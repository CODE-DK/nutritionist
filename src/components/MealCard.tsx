// MealCard Component - карточка приёма пищи согласно DESIGN.md

import React from 'react';

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import Card from './Card';
import { MEAL_TYPE_LABELS } from '../config/constants';
import { Typography, Spacing } from '../config/theme';
import { useTheme } from '../config/ThemeContext';
import { FoodEntry } from '../types';

interface MealCardProps {
  meal: FoodEntry;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function MealCard({ meal, onPress, onEdit, onDelete }: MealCardProps) {
  const { theme } = useTheme();

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const styles = StyleSheet.create({
    card: {
      marginVertical: Spacing.sm,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    macroItem: {
      marginRight: Spacing.md,
    },
    macroLabel: {
      color: theme.textSecondary,
      fontSize: Typography.caption.fontSize,
    },
    macroValue: {
      color: theme.text,
      fontSize: Typography.body.fontSize,
      fontWeight: '600',
    },
    macrosContainer: {
      alignItems: 'center',
      flexDirection: 'row',
      marginBottom: Spacing.sm,
    },
    mealType: {
      color: theme.text,
      fontSize: Typography.body.fontSize,
      fontWeight: '600',
    },
    menuButton: {
      padding: Spacing.xs,
    },
    name: {
      color: theme.text,
      fontSize: Typography.bodyLarge.fontSize,
      fontWeight: '400',
      marginBottom: Spacing.md,
    },
    time: {
      color: theme.disabled,
      fontSize: Typography.caption.fontSize,
    },
  });

  return (
    <Card style={styles.card}>
      <TouchableOpacity onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.mealType}>{MEAL_TYPE_LABELS[meal.mealType]}</Text>

          {(onEdit || onDelete) && (
            <TouchableOpacity onPress={onEdit} style={styles.menuButton}>
              <Ionicons name="ellipsis-vertical" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Название блюда */}
        <Text style={styles.name}>{meal.name}</Text>

        {/* БЖУ */}
        <View style={styles.macrosContainer}>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{meal.calories}</Text>
            <Text style={styles.macroLabel}>ккал</Text>
          </View>

          {meal.protein !== undefined && (
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{meal.protein}г</Text>
              <Text style={styles.macroLabel}>Б</Text>
            </View>
          )}

          {meal.carbs !== undefined && (
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{meal.carbs}г</Text>
              <Text style={styles.macroLabel}>У</Text>
            </View>
          )}

          {meal.fat !== undefined && (
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{meal.fat}г</Text>
              <Text style={styles.macroLabel}>Ж</Text>
            </View>
          )}
        </View>

        {/* Время */}
        <Text style={styles.time}>{formatTime(meal.timestamp)}</Text>
      </TouchableOpacity>
    </Card>
  );
}
