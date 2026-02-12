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

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import AddMealModal from '../components/AddMealModal';
import DailyTipCard from '../components/DailyTipCard';
import Loading from '../components/Loading';
import MealCard from '../components/MealCard';
import StatsCard from '../components/StatsCard';
import { Typography, Spacing, Shadows } from '../config/theme';
import { useTheme } from '../config/ThemeContext';
import analyticsService from '../services/analyticsService';
import diaryService from '../services/diaryService';
import nutritionTipsService from '../services/nutritionTipsService';

import type { DailyStats, DailyTip, FoodEntry, User } from '../types';

interface DiaryScreenProps {
  userId: string;
  user: User;
}

export default function DiaryScreen({ userId, user }: DiaryScreenProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMeal, setEditingMeal] = useState<FoodEntry | null>(null);
  const [dailyTip, setDailyTip] = useState<DailyTip | null>(null);
  const [tipDismissed, setTipDismissed] = useState(false);

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

  useEffect(() => {
    const loadTip = async () => {
      if (!tipDismissed) {
        const tip = await nutritionTipsService.getDailyTip(user);
        setDailyTip(tip);
      }
    };
    loadTip();
  }, [user, tipDismissed]);

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
    Alert.alert(t('diary.addMealModal.deleteMeal'), t('diary.addMealModal.deleteConfirm'), [
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
    ]);
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

  const handleDismissTip = async () => {
    if (dailyTip) {
      await nutritionTipsService.dismissTip(userId, dailyTip.id);
      analyticsService.track('daily_tip_dismissed', {
        tipId: dailyTip.id,
        category: dailyTip.category,
      });
      setTipDismissed(true);
      setDailyTip(null);
    }
  };

  if (loading && !stats) {
    return <Loading fullScreen text={t('diary.title')} />;
  }

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.background,
      flex: 1,
    },
    content: {
      flex: 1,
      padding: Spacing.md,
    },
    dateSelector: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: Spacing.md,
    },
    dateText: {
      ...Typography.bodyLarge,
      color: theme.text,
      fontWeight: '600',
    },
    emptyEmoji: {
      fontSize: 64,
      marginBottom: Spacing.md,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: Spacing.xxl,
    },
    emptyText: {
      ...Typography.body,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    emptyTitle: {
      ...Typography.h3,
      color: theme.text,
      marginBottom: Spacing.sm,
    },
    fab: {
      alignItems: 'center',
      backgroundColor: theme.primary,
      borderRadius: 28,
      bottom: Spacing.lg,
      height: 56,
      justifyContent: 'center',
      position: 'absolute',
      right: Spacing.lg,
      width: 56,
    },
    header: {
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderBottomColor: theme.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
    },
    headerTitle: {
      ...Typography.h3,
      color: theme.text,
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Daily Tip Card */}
        {dailyTip && !tipDismissed && <DailyTipCard tip={dailyTip} onDismiss={handleDismissTip} />}

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
          stats.meals.map(meal => (
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
