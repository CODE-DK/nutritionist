// DiaryScreen - экран дневника питания

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import StatsCard from '../components/StatsCard';
import MealCard from '../components/MealCard';
import AddMealModal from '../components/AddMealModal';
import Loading from '../components/Loading';
import { Typography, Spacing, Shadows } from '../config/theme';
import { useTheme } from '../config/ThemeContext';
import diaryService from '../services/diaryService';
import type { DailyStats, FoodEntry } from '../types';

interface DiaryScreenProps {
  userId: string;
}

export default function DiaryScreen({ userId }: DiaryScreenProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMeal, setEditingMeal] = useState<FoodEntry | null>(null);

  const loadStats = async () => {
    try {
      const dateString = formatDateString(selectedDate);
      const dailyStats = await diaryService.getDailyStats(userId, dateString);
      setStats(dailyStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadTestDataIfFirstTime = async () => {
    try {
      const hasSeenDiary = await AsyncStorage.getItem('diary_has_data');

      if (!hasSeenDiary) {
        // Загружаем тестовые данные при первом запуске
        await diaryService.seedTestData(userId);
        await AsyncStorage.setItem('diary_has_data', 'true');
        console.log('Loaded test data for first time user');
      }
    } catch (error) {
      console.error('Error loading test data:', error);
    }
  };

  useEffect(() => {
    loadTestDataIfFirstTime();
  }, [userId]);

  useEffect(() => {
    loadStats();
  }, [selectedDate]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
    setLoading(true);
  };

  const handleAddMeal = () => {
    setEditingMeal(null);
    setModalVisible(true);
  };

  const handleEditMeal = (meal: FoodEntry) => {
    setEditingMeal(meal);
    setModalVisible(true);
  };

  const handleDeleteMeal = (meal: FoodEntry) => {
    Alert.alert(
      t('diary.addMealModal.deleteMeal'),
      t('diary.addMealModal.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await diaryService.deleteMeal(meal.id);
              await loadStats();
            } catch (error: any) {
              Alert.alert(t('common.error'), error.message || t('common.error'));
            }
          },
        },
      ]
    );
  };

  const handleSaveMeal = async (meal: Omit<FoodEntry, 'id' | 'timestamp'>) => {
    if (editingMeal) {
      // Редактирование существующей записи
      await diaryService.updateMeal(editingMeal.id, meal);
    } else {
      // Добавление новой записи
      await diaryService.addMeal(meal);
    }
    await loadStats();
  };

  if (loading && !stats) {
    return <Loading fullScreen text={t('diary.title')} />;
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: {
      ...Typography.h3,
      color: theme.text,
    },
    content: {
      flex: 1,
      padding: Spacing.md,
    },
    dateSelector: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.md,
    },
    dateText: {
      ...Typography.bodyLarge,
      fontWeight: '600',
      color: theme.text,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: Spacing.xxl,
    },
    emptyEmoji: {
      fontSize: 64,
      marginBottom: Spacing.md,
    },
    emptyTitle: {
      ...Typography.h3,
      marginBottom: Spacing.sm,
      color: theme.text,
    },
    emptyText: {
      ...Typography.body,
      textAlign: 'center',
      color: theme.textSecondary,
    },
    fab: {
      position: 'absolute',
      bottom: Spacing.lg,
      right: Spacing.lg,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('diary.title')}</Text>
        <TouchableOpacity onPress={handleAddMeal}>
          <Ionicons name="add-circle" size={28} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />
        }
      >
        {/* Stats Card */}
        {stats && <StatsCard stats={stats} />}

        {/* Date Selector */}
        <View style={styles.dateSelector}>
          <TouchableOpacity onPress={() => changeDate(-1)}>
            <Ionicons name="chevron-back" size={24} color={theme.primary} />
          </TouchableOpacity>

          <Text style={styles.dateText}>
            {selectedDate.toDateString() === new Date().toDateString()
              ? t('diary.today')
              : selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
          </Text>

          <TouchableOpacity onPress={() => changeDate(1)}>
            <Ionicons name="chevron-forward" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Meals List */}
        {stats && stats.meals.length > 0 ? (
          stats.meals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              onEdit={() => handleEditMeal(meal)}
              onDelete={() => handleDeleteMeal(meal)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🍽</Text>
            <Text style={styles.emptyTitle}>{t('diary.emptyState')}</Text>
            <Text style={styles.emptyText}>{t('diary.emptyStateHint')}</Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={[styles.fab, Shadows.level3]} onPress={handleAddMeal}>
        <Ionicons name="add" size={28} color={theme.white} />
      </TouchableOpacity>

      {/* Add/Edit Meal Modal */}
      <AddMealModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveMeal}
        editingMeal={editingMeal}
        userId={userId}
        date={formatDateString(selectedDate)}
      />
    </SafeAreaView>
  );
}
