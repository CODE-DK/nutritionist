// ProfileScreen - экран профиля пользователя

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Card from '../components/Card';
import Button from '../components/Button';
import {
  EditNameModal,
  EditTargetWeightModal,
  EditCaloriesModal,
  EditGoalModal,
} from '../components/ProfileEditModals';
import EditPhysicalParamsModal from '../components/EditPhysicalParamsModal';
import MetabolismInfoModal from '../components/MetabolismInfoModal';
import ProgressCard from '../components/ProgressCard';
import { Typography, Spacing, BorderRadius } from '../config/theme';
import { useTheme, ThemeMode } from '../config/ThemeContext';
import { getGoalTypeLabel, calculateUserCalories, calculateWeeklyWeightChange, calculateWeeksToGoal } from '../utils/calorieCalculator';
import { saveLanguage, LANGUAGES } from '../config/i18n';
import authService from '../services/authService';
import analyticsService from '../services/analyticsService';
import type { User, GoalType } from '../types';

interface ProfileScreenProps {
  user: User;
  onLogout: () => void;
  onUserUpdate?: (updatedUser: User) => void;
}

export default function ProfileScreen({ user, onLogout, onUserUpdate }: ProfileScreenProps) {
  const { theme, themeMode, isDark, setThemeMode } = useTheme();
  const { t, i18n } = useTranslation();
  const [currentUser, setCurrentUser] = useState(user);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showTargetWeightModal, setShowTargetWeightModal] = useState(false);
  const [showCaloriesModal, setShowCaloriesModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showPhysicalParamsModal, setShowPhysicalParamsModal] = useState(false);
  const [showMetabolismInfoModal, setShowMetabolismInfoModal] = useState(false);

  const handleLogout = () => {
    Alert.alert(t('profile.actions.logoutTitle'), t('profile.actions.logoutMessage'), [
      { text: t('profile.actions.cancel'), style: 'cancel' },
      {
        text: t('profile.actions.confirm'),
        style: 'destructive',
        onPress: async () => {
          await authService.signOut();
          analyticsService.track('user_logged_out');
          analyticsService.clearUserId();
          onLogout();
        },
      },
    ]);
  };

  const handleThemeModeChange = async (mode: ThemeMode) => {
    await setThemeMode(mode);
    setShowThemeModal(false);
    analyticsService.track('theme_changed', { mode });
  };

  const getThemeModeLabel = () => {
    if (themeMode === 'light') return t('profile.theme.light');
    if (themeMode === 'dark') return t('profile.theme.dark');
    return t('profile.theme.auto');
  };

  const handleLanguageChange = async (language: string) => {
    await saveLanguage(language);
    setShowLanguageModal(false);
    analyticsService.track('language_changed', { language });
  };

  const getCurrentLanguageLabel = () => {
    return LANGUAGES[i18n.language as keyof typeof LANGUAGES]?.label || LANGUAGES.ru.label;
  };

  const handleUpdateProfile = async (updates: Partial<User>) => {
    setLoading(true);
    try {
      const updatedUser = await authService.updateProfile(currentUser.id, updates);
      setCurrentUser(updatedUser);
      onUserUpdate?.(updatedUser);
      analyticsService.track('profile_updated', updates);
      Alert.alert(t('profile.alerts.success'), t('profile.alerts.profileUpdated'));
    } catch (error: any) {
      Alert.alert(t('profile.alerts.error'), error.message || t('profile.alerts.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async (name: string) => {
    await handleUpdateProfile({ name });
    setShowNameModal(false);
  };

  const handleSaveTargetWeight = async (targetWeight: number) => {
    await handleUpdateProfile({ targetWeight });
    setShowTargetWeightModal(false);
  };

  const handleSaveCalories = async (calories: number) => {
    await handleUpdateProfile({ dailyCalorieGoal: calories });
    setShowCaloriesModal(false);
  };

  const handleSaveGoal = async (goalType: GoalType) => {
    await handleUpdateProfile({ goalType });
    setShowGoalModal(false);
  };

  const handleSavePhysicalParams = async (updates: {
    height: number;
    weight: number;
    age: number;
    gender: 'male' | 'female';
    recalculateCalories: boolean;
  }) => {
    let finalUpdates: Partial<User> = {
      height: updates.height,
      weight: updates.weight,
      age: updates.age,
      gender: updates.gender,
    };

    if (updates.recalculateCalories) {
      const { targetCalories } = calculateUserCalories({
        weight: updates.weight,
        height: updates.height,
        age: updates.age,
        gender: updates.gender,
        activityLevel: currentUser.activityLevel!,
        goalType: currentUser.goalType!,
      });
      finalUpdates.dailyCalorieGoal = targetCalories;
    }

    await handleUpdateProfile(finalUpdates);
    setShowPhysicalParamsModal(false);
  };

  // Проверка заполненности профиля для отображения метаболических данных
  const hasCompleteProfile =
    currentUser.height &&
    currentUser.weight &&
    currentUser.age &&
    currentUser.gender &&
    currentUser.activityLevel &&
    currentUser.goalType;

  // Расчет метаболических данных
  const metabolismData = hasCompleteProfile
    ? calculateUserCalories({
        weight: currentUser.weight!,
        height: currentUser.height!,
        age: currentUser.age!,
        gender: currentUser.gender!,
        activityLevel: currentUser.activityLevel!,
        goalType: currentUser.goalType!,
      })
    : null;

  const dailyDeficit = metabolismData ? metabolismData.tdee - metabolismData.targetCalories : 0;
  const weeklyChange = hasCompleteProfile ? calculateWeeklyWeightChange(dailyDeficit) : 0;
  const weeksToGoal =
    hasCompleteProfile && currentUser.targetWeight
      ? calculateWeeksToGoal(currentUser.weight!, currentUser.targetWeight, weeklyChange)
      : 0;

  // Расчет прогресса к цели
  const calculateProgress = () => {
    if (!currentUser.targetWeight || !currentUser.weight) return 0;

    const initialWeight = currentUser.weight; // Можно сохранить начальный вес в БД
    const targetWeight = currentUser.targetWeight;
    const currentWeight = currentUser.weight;

    if (initialWeight === targetWeight) return 100;

    const totalDiff = Math.abs(initialWeight - targetWeight);
    const currentDiff = Math.abs(currentWeight - targetWeight);
    const progress = ((totalDiff - currentDiff) / totalDiff) * 100;

    return Math.max(0, Math.min(100, progress));
  };

  const isPremium = currentUser.subscription === 'premium';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('profile.title')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <TouchableOpacity style={styles.userInfo} onPress={() => setShowNameModal(true)}>
          <View style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <Text style={[styles.userName, { color: theme.text }]}>{currentUser.name || t('profile.user')}</Text>
          <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{currentUser.email}</Text>
          <Text style={[styles.editHint, { color: theme.disabled }]}>{t('profile.editHint')}</Text>
        </TouchableOpacity>

        {/* Секция 1: Мои показатели */}
        <Card style={styles.physicalParamsCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitleWithEmoji, { color: theme.text }]}>📊 Мои показатели</Text>
          </View>

          {currentUser.weight && currentUser.height && currentUser.age && currentUser.gender ? (
            <>
              <View style={styles.statsGrid}>
                <StatRow
                  label="Текущий вес"
                  value={`${currentUser.weight} кг`}
                  theme={theme}
                />
                {currentUser.targetWeight && (
                  <StatRow
                    label="Целевой вес"
                    value={`${currentUser.targetWeight} кг`}
                    badge={`${currentUser.weight > currentUser.targetWeight ? '-' : '+'}${Math.abs(currentUser.weight - currentUser.targetWeight).toFixed(1)} кг`}
                    theme={theme}
                  />
                )}
                <StatRow
                  label="Рост"
                  value={`${currentUser.height} см`}
                  theme={theme}
                />
                <StatRow
                  label="Возраст"
                  value={`${currentUser.age} лет`}
                  theme={theme}
                />
                <StatRow
                  label="Пол"
                  value={currentUser.gender === 'male' ? 'Мужской' : 'Женский'}
                  theme={theme}
                />
              </View>
              <Button
                title="Редактировать"
                variant="secondary"
                onPress={() => setShowPhysicalParamsModal(true)}
                style={styles.editButton}
              />
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                Заполните физические параметры для расчета метаболизма
              </Text>
              <Button
                title="Заполнить"
                onPress={() => setShowPhysicalParamsModal(true)}
                style={styles.fillButton}
              />
            </View>
          )}
        </Card>

        {/* Секция 2: Метаболизм */}
        {hasCompleteProfile && metabolismData && (
          <Card style={styles.metabolismCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitleWithEmoji, { color: theme.text }]}>🔥 Метаболизм</Text>
              <TouchableOpacity onPress={() => setShowMetabolismInfoModal(true)}>
                <Ionicons name="information-circle-outline" size={24} color={theme.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.metabolismStats}>
              <MetabolismRow
                label="BMR (базовый)"
                value={`${metabolismData.bmr} ккал/день`}
                color="#4CAF50"
                theme={theme}
              />
              <MetabolismRow
                label="TDEE (с активностью)"
                value={`${metabolismData.tdee} ккал/день`}
                color="#2196F3"
                theme={theme}
              />
              <MetabolismRow
                label="Ваша норма"
                value={`${metabolismData.targetCalories} ккал/день`}
                color="#FF9800"
                theme={theme}
              />
              <MetabolismRow
                label=""
                value={`(${dailyDeficit > 0 ? 'дефицит' : 'профицит'} ${Math.abs(dailyDeficit)} ккал)`}
                color="#F44336"
                theme={theme}
              />
            </View>
          </Card>
        )}

        {/* Секция 3: Прогресс к цели */}
        {hasCompleteProfile && currentUser.targetWeight && (
          <ProgressCard
            title="🎯 Прогресс к цели"
            current={currentUser.weight!}
            target={currentUser.targetWeight}
            unit="кг"
            percentage={calculateProgress()}
            estimatedWeeks={weeksToGoal}
            weeklyChange={weeklyChange}
          />
        )}

        {/* Subscription Card */}
        <Card style={[styles.subscriptionCard, isPremium && styles.premiumCard]}>
          <View style={styles.subscriptionHeader}>
            <Text style={[styles.subscriptionType, { color: isPremium ? theme.white : theme.text }]}>
              {isPremium ? t('profile.subscription.premium') : t('profile.subscription.free')}
            </Text>
          </View>
          <Text style={[styles.subscriptionDescription, { color: isPremium ? theme.white : theme.textSecondary }]}>
            {isPremium
              ? t('profile.subscription.premiumUntil', { date: '06.03.2026' })
              : t('profile.subscription.upgradeToPremium')}
          </Text>
          {!isPremium && (
            <Button
              title={t('profile.subscription.upgradeButton')}
              onPress={() => console.log('Upgrade to premium')}
              style={styles.upgradeButton}
            />
          )}
        </Card>

        {/* Settings Section */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('profile.sections.goalSettings')}</Text>

        <SettingItem
          icon="trophy-outline"
          title={t('profile.goalSettings.targetWeight')}
          value={currentUser.targetWeight ? t('profile.goalSettings.targetWeightValue', { weight: currentUser.targetWeight }) : t('profile.goalSettings.notSet')}
          onPress={() => setShowTargetWeightModal(true)}
        />

        <SettingItem
          icon="flame-outline"
          title={t('profile.goalSettings.dailyCalories')}
          value={t('profile.goalSettings.dailyCaloriesValue', { calories: currentUser.dailyCalorieGoal })}
          onPress={() => setShowCaloriesModal(true)}
        />

        <SettingItem
          icon="stats-chart-outline"
          title={t('profile.goalSettings.goal')}
          value={currentUser.goalType ? getGoalTypeLabel(currentUser.goalType) : t('profile.goalSettings.goalNotSet')}
          onPress={() => setShowGoalModal(true)}
        />

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('profile.sections.appSettings')}</Text>

        <SettingItem
          icon="notifications-outline"
          title={t('profile.appSettings.notifications')}
          onPress={() => console.log('Notifications')}
        />

        <SettingItem
          icon={isDark ? "moon" : "moon-outline"}
          iconColor={theme.primary}
          title={t('profile.appSettings.theme')}
          value={getThemeModeLabel()}
          onPress={() => setShowThemeModal(true)}
        />

        <SettingItem
          icon="language-outline"
          iconColor={theme.primary}
          title={t('profile.appSettings.language')}
          value={getCurrentLanguageLabel()}
          onPress={() => setShowLanguageModal(true)}
        />

        <SettingItem
          icon="information-circle-outline"
          title={t('profile.appSettings.about')}
          onPress={() => console.log('About')}
        />

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <Button
            title={t('profile.actions.logout')}
            variant="secondary"
            onPress={handleLogout}
          />
        </View>
      </ScrollView>

      {/* Theme Selection Modal */}
      <Modal
        visible={showThemeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowThemeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{t('profile.theme.selectTheme')}</Text>
              <TouchableOpacity onPress={() => setShowThemeModal(false)}>
                <Ionicons name="close" size={28} color={theme.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: theme.background },
                themeMode === 'light' && { borderColor: theme.primary, borderWidth: 2 },
              ]}
              onPress={() => handleThemeModeChange('light')}
            >
              <View style={styles.themeOptionLeft}>
                <Ionicons name="sunny" size={24} color={theme.primary} />
                <Text style={[styles.themeOptionText, { color: theme.text }]}>{t('profile.theme.light')}</Text>
              </View>
              {themeMode === 'light' && <Ionicons name="checkmark-circle" size={24} color={theme.primary} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: theme.background },
                themeMode === 'dark' && { borderColor: theme.primary, borderWidth: 2 },
              ]}
              onPress={() => handleThemeModeChange('dark')}
            >
              <View style={styles.themeOptionLeft}>
                <Ionicons name="moon" size={24} color={theme.primary} />
                <Text style={[styles.themeOptionText, { color: theme.text }]}>{t('profile.theme.dark')}</Text>
              </View>
              {themeMode === 'dark' && <Ionicons name="checkmark-circle" size={24} color={theme.primary} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: theme.background },
                themeMode === 'auto' && { borderColor: theme.primary, borderWidth: 2 },
              ]}
              onPress={() => handleThemeModeChange('auto')}
            >
              <View style={styles.themeOptionLeft}>
                <Ionicons name="phone-portrait-outline" size={24} color={theme.primary} />
                <Text style={[styles.themeOptionText, { color: theme.text }]}>{t('profile.theme.auto')}</Text>
              </View>
              {themeMode === 'auto' && <Ionicons name="checkmark-circle" size={24} color={theme.primary} />}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{t('profile.language.selectLanguage')}</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={28} color={theme.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: theme.background },
                i18n.language === 'ru' && { borderColor: theme.primary, borderWidth: 2 },
              ]}
              onPress={() => handleLanguageChange('ru')}
            >
              <View style={styles.themeOptionLeft}>
                <Text style={styles.languageFlag}>🇷🇺</Text>
                <Text style={[styles.themeOptionText, { color: theme.text }]}>{t('profile.language.russian')}</Text>
              </View>
              {i18n.language === 'ru' && <Ionicons name="checkmark-circle" size={24} color={theme.primary} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: theme.background },
                i18n.language === 'en' && { borderColor: theme.primary, borderWidth: 2 },
              ]}
              onPress={() => handleLanguageChange('en')}
            >
              <View style={styles.themeOptionLeft}>
                <Text style={styles.languageFlag}>🇬🇧</Text>
                <Text style={[styles.themeOptionText, { color: theme.text }]}>{t('profile.language.english')}</Text>
              </View>
              {i18n.language === 'en' && <Ionicons name="checkmark-circle" size={24} color={theme.primary} />}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Modals */}
      <EditNameModal
        visible={showNameModal}
        currentName={currentUser.name || ''}
        onClose={() => setShowNameModal(false)}
        onSave={handleSaveName}
      />

      <EditTargetWeightModal
        visible={showTargetWeightModal}
        currentWeight={currentUser.weight || 0}
        targetWeight={currentUser.targetWeight}
        goalType={currentUser.goalType}
        onClose={() => setShowTargetWeightModal(false)}
        onSave={handleSaveTargetWeight}
      />

      <EditCaloriesModal
        visible={showCaloriesModal}
        user={currentUser}
        onClose={() => setShowCaloriesModal(false)}
        onSave={handleSaveCalories}
      />

      <EditGoalModal
        visible={showGoalModal}
        currentGoal={currentUser.goalType}
        onClose={() => setShowGoalModal(false)}
        onSave={handleSaveGoal}
      />

      <EditPhysicalParamsModal
        visible={showPhysicalParamsModal}
        user={currentUser}
        onClose={() => setShowPhysicalParamsModal(false)}
        onSave={handleSavePhysicalParams}
      />

      <MetabolismInfoModal
        visible={showMetabolismInfoModal}
        onClose={() => setShowMetabolismInfoModal(false)}
      />
    </SafeAreaView>
  );
}

interface SettingItemProps {
  icon: string;
  iconColor?: string;
  title: string;
  value?: string;
  onPress: () => void;
}

function SettingItem({ icon, iconColor, title, value, onPress }: SettingItemProps) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.surface }]} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={24} color={iconColor || theme.textSecondary} />
        <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
      </View>
      <View style={styles.settingRight}>
        {value && <Text style={[styles.settingValue, { color: theme.textSecondary }]}>{value}</Text>}
        <Ionicons name="chevron-forward" size={20} color={theme.disabled} />
      </View>
    </TouchableOpacity>
  );
}

// Вспомогательный компонент для строки со статистикой
function StatRow({ label, value, badge, theme }: { label: string; value: string; badge?: string; theme: any }) {
  return (
    <View style={styles.statRow}>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
      <View style={styles.statRight}>
        <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
        {badge && (
          <View style={[styles.badge, { backgroundColor: theme.primaryLight }]}>
            <Text style={[styles.badgeText, { color: theme.primary }]}>{badge}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// Вспомогательный компонент для строки метаболизма с цветом
function MetabolismRow({ label, value, color, theme }: { label: string; value: string; color: string; theme: any }) {
  return (
    <View style={styles.metabolismRow}>
      <View style={[styles.colorIndicator, { backgroundColor: color }]} />
      <Text style={[styles.metabolismLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.metabolismValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...Typography.h3,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  userInfo: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 40,
  },
  userName: {
    ...Typography.h2,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    ...Typography.body,
  },
  editHint: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  subscriptionCard: {
    marginBottom: Spacing.lg,
  },
  premiumCard: {
    backgroundColor: '#FFD700',
  },
  subscriptionHeader: {
    marginBottom: Spacing.sm,
  },
  subscriptionType: {
    ...Typography.h3,
  },
  subscriptionDescription: {
    ...Typography.body,
    marginBottom: Spacing.md,
  },
  upgradeButton: {
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h3,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.sm,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTitle: {
    ...Typography.bodyLarge,
    marginLeft: Spacing.md,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    ...Typography.body,
    marginRight: Spacing.sm,
  },
  logoutContainer: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.large,
    borderTopRightRadius: BorderRadius.large,
    padding: Spacing.lg,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.h2,
  },
  themeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeOptionText: {
    ...Typography.bodyLarge,
    marginLeft: Spacing.md,
  },
  languageFlag: {
    fontSize: 24,
    marginRight: Spacing.xs,
  },
  // New styles for physical params and metabolism sections
  physicalParamsCard: {
    marginBottom: Spacing.lg,
  },
  metabolismCard: {
    marginBottom: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitleWithEmoji: {
    ...Typography.h3,
  },
  statsGrid: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  statLabel: {
    ...Typography.body,
  },
  statRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statValue: {
    ...Typography.bodyLarge,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  badgeText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  editButton: {
    marginTop: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyStateText: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  fillButton: {
    minWidth: 150,
  },
  metabolismStats: {
    gap: Spacing.sm,
  },
  metabolismRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  colorIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
    marginRight: Spacing.md,
  },
  metabolismLabel: {
    ...Typography.body,
    flex: 1,
  },
  metabolismValue: {
    ...Typography.bodyLarge,
  },
});
