// MealCard Component - карточка приёма пищи согласно DESIGN.md

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { Typography, Spacing } from '../config/theme';
import { useTheme } from '../config/ThemeContext';
import { FoodEntry, MealType } from '../types';
import { MEAL_TYPE_LABELS } from '../config/constants';

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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    mealType: {
      fontSize: Typography.body.fontSize,
      fontWeight: '600',
      color: theme.text,
    },
    menuButton: {
      padding: Spacing.xs,
    },
    name: {
      fontSize: Typography.bodyLarge.fontSize,
      fontWeight: '400',
      color: theme.text,
      marginBottom: Spacing.md,
    },
    macrosContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    macroItem: {
      marginRight: Spacing.md,
    },
    macroValue: {
      fontSize: Typography.body.fontSize,
      fontWeight: '600',
      color: theme.text,
    },
    macroLabel: {
      fontSize: Typography.caption.fontSize,
      color: theme.textSecondary,
    },
    time: {
      fontSize: Typography.caption.fontSize,
      color: theme.disabled,
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
