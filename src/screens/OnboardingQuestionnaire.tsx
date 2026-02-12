/**
 * OnboardingQuestionnaire - многошаговая анкета для сбора данных пользователя
 *
 * Собирает физические параметры, цели и уровень активности
 * для расчета персонализированной нормы калорий
 */

import { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../components/Button';
import Card from '../components/Card';
import { Typography, Spacing, BorderRadius } from '../config/theme';
import { useTheme } from '../config/ThemeContext';
import analyticsService from '../services/analyticsService';
import authService from '../services/authService';
import {
  calculateUserCalories,
  getActivityLevelLabel,
  getGoalTypeLabel,
} from '../utils/calorieCalculator';

import type { Gender, ActivityLevel, GoalType, DietType, User } from '../types';

interface OnboardingQuestionnaireProps {
  user: User;
  onComplete: (updatedUser: User) => void;
}

type Step = 'gender_age' | 'height_weight' | 'goal' | 'activity' | 'diet' | 'target_weight' | 'summary';

export default function OnboardingQuestionnaire({
  user,
  onComplete,
}: OnboardingQuestionnaireProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<Step>('gender_age');
  const [loading, setLoading] = useState(false);

  // Данные анкеты
  const [gender, setGender] = useState<Gender | null>(null);
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goalType, setGoalType] = useState<GoalType | null>(null);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [dietType, setDietType] = useState<DietType | null>(null);
  const [targetWeight, setTargetWeight] = useState('');

  // Валидация ввода
  const handleAgeChange = (text: string) => {
    // Только цифры
    const filtered = text.replace(/[^0-9]/g, '');
    setAge(filtered);
  };

  const handleHeightChange = (text: string) => {
    // Только цифры
    const filtered = text.replace(/[^0-9]/g, '');
    setHeight(filtered);
  };

  const handleWeightChange = (text: string) => {
    // Только цифры и одна точка
    let filtered = text.replace(/[^0-9.]/g, '');

    // Запрещаем точку в начале
    if (filtered.startsWith('.')) {
      return;
    }

    // Проверяем, что точка только одна
    const parts = filtered.split('.');
    if (parts.length > 2) {
      return;
    }

    // Ограничиваем одним знаком после точки
    if (parts.length === 2 && parts[0] && parts[1] && parts[1].length > 1) {
      filtered = parts[0] + '.' + parts[1].slice(0, 1);
    }

    setWeight(filtered);
  };

  const handleTargetWeightChange = (text: string) => {
    // Только цифры и одна точка
    let filtered = text.replace(/[^0-9.]/g, '');

    // Запрещаем точку в начале
    if (filtered.startsWith('.')) {
      return;
    }

    // Проверяем, что точка только одна
    const parts = filtered.split('.');
    if (parts.length > 2) {
      return;
    }

    // Ограничиваем одним знаком после точки
    if (parts.length === 2 && parts[0] && parts[1] && parts[1].length > 1) {
      filtered = parts[0] + '.' + parts[1].slice(0, 1);
    }

    setTargetWeight(filtered);
  };

  const totalSteps = 6;
  const currentStepNumber = {
    gender_age: 1,
    height_weight: 2,
    goal: 3,
    activity: 4,
    diet: 5,
    target_weight: 6,
    summary: 6,
  }[currentStep];

  const handleNext = () => {
    if (currentStep === 'gender_age') {
      if (!gender || !age || parseInt(age) < 13 || parseInt(age) > 120) {
        Alert.alert(t('common.error'), t('diary.addMealModal.invalidValues'));
        return;
      }
      setCurrentStep('height_weight');
    } else if (currentStep === 'height_weight') {
      const h = parseInt(height);
      const w = parseFloat(weight);
      if (!h || !w || h < 100 || h > 250 || w < 30 || w > 300) {
        Alert.alert(t('common.error'), t('profile.editModals.invalidWeight'));
        return;
      }
      setCurrentStep('goal');
    } else if (currentStep === 'goal') {
      if (!goalType) {
        Alert.alert(t('common.error'), t('profile.editModals.selectGoal'));
        return;
      }
      setCurrentStep('activity');
    } else if (currentStep === 'activity') {
      if (!activityLevel) {
        Alert.alert(t('common.error'), t('diary.addMealModal.invalidValues'));
        return;
      }
      setCurrentStep('diet');
    } else if (currentStep === 'diet') {
      if (!dietType) {
        Alert.alert(t('common.error'), t('profile.editModals.selectGoal'));
        return;
      }
      // Если цель - похудение или набор, спрашиваем целевой вес
      if (goalType === 'lose_weight' || goalType === 'gain_weight') {
        setCurrentStep('target_weight');
      } else {
        // Для поддержания веса целевой вес = текущему
        setTargetWeight(weight);
        setCurrentStep('summary');
      }
    } else if (currentStep === 'target_weight') {
      const tw = parseFloat(targetWeight);
      const w = parseFloat(weight);
      if (!tw || tw < 30 || tw > 300) {
        Alert.alert(t('common.error'), t('profile.editModals.invalidWeight'));
        return;
      }
      if (goalType === 'lose_weight' && tw >= w) {
        Alert.alert(t('common.error'), t('profile.editModals.targetWeightLowerForLoss'));
        return;
      }
      if (goalType === 'gain_weight' && tw <= w) {
        Alert.alert(t('common.error'), t('profile.editModals.targetWeightHigherForGain'));
        return;
      }
      setCurrentStep('summary');
    }
  };

  const handleBack = () => {
    if (currentStep === 'height_weight') setCurrentStep('gender_age');
    else if (currentStep === 'goal') setCurrentStep('height_weight');
    else if (currentStep === 'activity') setCurrentStep('goal');
    else if (currentStep === 'diet') setCurrentStep('activity');
    else if (currentStep === 'target_weight') setCurrentStep('diet');
    else if (currentStep === 'summary') {
      if (goalType === 'lose_weight' || goalType === 'gain_weight') {
        setCurrentStep('target_weight');
      } else {
        setCurrentStep('diet');
      }
    }
  };

  const handleComplete = async () => {
    if (!gender || !age || !height || !weight || !goalType || !activityLevel || !dietType) {
      Alert.alert(t('common.error'), t('diary.addMealModal.invalidValues'));
      return;
    }

    setLoading(true);

    try {
      // Рассчитываем калории
      const { targetCalories } = calculateUserCalories({
        weight: parseFloat(weight),
        height: parseInt(height),
        age: parseInt(age),
        gender,
        activityLevel,
        goalType,
      });

      // Обновляем профиль
      const updatedUser = await authService.updateProfile(user.id, {
        gender,
        age: parseInt(age),
        height: parseInt(height),
        weight: parseFloat(weight),
        goalType,
        activityLevel,
        dietType,
        targetWeight: parseFloat(targetWeight),
        dailyCalorieGoal: targetCalories,
      });

      analyticsService.track('onboarding_questionnaire_completed', {
        gender,
        age: parseInt(age),
        goalType,
        activityLevel,
        dietType,
        targetCalories,
      });

      onComplete(updatedUser);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('profile.alerts.updateFailed'));
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: theme.primary, width: `${(currentStepNumber / totalSteps) * 100}%` },
          ]}
        />
      </View>
      <Text style={[styles.progressText, { color: theme.textSecondary }]}>
        {t('onboarding.next')} {currentStepNumber} / {totalSteps}
      </Text>
    </View>
  );

  const renderGenderAgeStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>{t('onboarding.genderAge')}</Text>
      <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
        {t('profile.editModals.basedOnProfile')}
      </Text>

      <Text style={[styles.label, { color: theme.text }]}>{t('onboarding.gender')}</Text>
      <View style={styles.genderContainer}>
        <TouchableOpacity
          style={[
            styles.genderOption,
            { backgroundColor: theme.surface, borderColor: theme.border },
            gender === 'male' && { borderColor: theme.primary, borderWidth: 2 },
          ]}
          onPress={() => setGender('male')}
        >
          <Text style={styles.genderEmoji}>👨</Text>
          <Text style={[styles.genderText, { color: theme.text }]}>{t('onboarding.male')}</Text>
          {gender === 'male' && (
            <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.genderOption,
            { backgroundColor: theme.surface, borderColor: theme.border },
            gender === 'female' && { borderColor: theme.primary, borderWidth: 2 },
          ]}
          onPress={() => setGender('female')}
        >
          <Text style={styles.genderEmoji}>👩</Text>
          <Text style={[styles.genderText, { color: theme.text }]}>{t('onboarding.female')}</Text>
          {gender === 'female' && (
            <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
          )}
        </TouchableOpacity>
      </View>

      <Text style={[styles.label, { color: theme.text }]}>{t('onboarding.age')}</Text>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border },
        ]}
        placeholder="25"
        placeholderTextColor={theme.disabled}
        keyboardType="number-pad"
        value={age}
        onChangeText={handleAgeChange}
        maxLength={3}
      />
    </View>
  );

  const renderHeightWeightStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>
        {t('onboarding.heightWeightTitle')}
      </Text>
      <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
        {t('onboarding.heightWeightDesc')}
      </Text>

      <Text style={[styles.label, { color: theme.text }]}>
        {t('onboarding.height')}
      </Text>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border },
        ]}
        placeholder="175"
        placeholderTextColor={theme.disabled}
        keyboardType="number-pad"
        value={height}
        onChangeText={handleHeightChange}
        maxLength={3}
      />

      <Text style={[styles.label, { color: theme.text }]}>
        {t('onboarding.weight')}
      </Text>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border },
        ]}
        placeholder="70.5"
        placeholderTextColor={theme.disabled}
        keyboardType="decimal-pad"
        value={weight}
        onChangeText={handleWeightChange}
        maxLength={5}
      />
    </View>
  );

  const renderGoalStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>
        {t('profile.goalSettings.goal')}
      </Text>
      <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
        {t('profile.editModals.selectGoal')}
      </Text>

      <TouchableOpacity
        style={[
          styles.goalOption,
          { backgroundColor: theme.surface, borderColor: theme.border },
          goalType === 'lose_weight' && { borderColor: theme.primary, borderWidth: 2 },
        ]}
        onPress={() => setGoalType('lose_weight')}
      >
        <View style={styles.goalLeft}>
          <Text style={styles.goalEmoji}>📉</Text>
          <View>
            <Text style={[styles.goalTitle, { color: theme.text }]}>
              {t('goalTypes.lose_weight')}
            </Text>
            <Text style={[styles.goalSubtitle, { color: theme.textSecondary }]}>
              {t('goalTypes.lose_weight')}
            </Text>
          </View>
        </View>
        {goalType === 'lose_weight' && (
          <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.goalOption,
          { backgroundColor: theme.surface, borderColor: theme.border },
          goalType === 'maintain' && { borderColor: theme.primary, borderWidth: 2 },
        ]}
        onPress={() => setGoalType('maintain')}
      >
        <View style={styles.goalLeft}>
          <Text style={styles.goalEmoji}>➡️</Text>
          <View>
            <Text style={[styles.goalTitle, { color: theme.text }]}>{t('goalTypes.maintain')}</Text>
            <Text style={[styles.goalSubtitle, { color: theme.textSecondary }]}>
              {t('goalTypes.maintain')}
            </Text>
          </View>
        </View>
        {goalType === 'maintain' && (
          <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.goalOption,
          { backgroundColor: theme.surface, borderColor: theme.border },
          goalType === 'gain_weight' && { borderColor: theme.primary, borderWidth: 2 },
        ]}
        onPress={() => setGoalType('gain_weight')}
      >
        <View style={styles.goalLeft}>
          <Text style={styles.goalEmoji}>📈</Text>
          <View>
            <Text style={[styles.goalTitle, { color: theme.text }]}>
              {t('goalTypes.gain_weight')}
            </Text>
            <Text style={[styles.goalSubtitle, { color: theme.textSecondary }]}>
              {t('goalTypes.gain_weight')}
            </Text>
          </View>
        </View>
        {goalType === 'gain_weight' && (
          <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
        )}
      </TouchableOpacity>
    </View>
  );

  const renderActivityStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>
        {t('onboarding.activityTitle')}
      </Text>
      <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
        {t('onboarding.activityDesc')}
      </Text>

      {(['sedentary', 'light', 'moderate', 'active', 'very_active'] as ActivityLevel[]).map(
        level => (
          <TouchableOpacity
            key={level}
            style={[
              styles.activityOption,
              { backgroundColor: theme.surface, borderColor: theme.border },
              activityLevel === level && { borderColor: theme.primary, borderWidth: 2 },
            ]}
            onPress={() => setActivityLevel(level)}
          >
            <View style={styles.activityLeft}>
              <Text style={[styles.activityTitle, { color: theme.text }]}>
                {getActivityLevelLabel(level)}
              </Text>
            </View>
            {activityLevel === level && (
              <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
            )}
          </TouchableOpacity>
        )
      )}
    </View>
  );

  const renderDietStep = () => {
    const dietOptions: Array<{ type: DietType; emoji: string; title: string; subtitle: string }> = [
      {
        type: 'balanced',
        emoji: '🍽️',
        title: t('dietTypes.balanced.title'),
        subtitle: t('dietTypes.balanced.subtitle'),
      },
      {
        type: 'calorie_deficit',
        emoji: '📉',
        title: t('dietTypes.calorie_deficit.title'),
        subtitle: t('dietTypes.calorie_deficit.subtitle'),
      },
      {
        type: 'keto',
        emoji: '🥑',
        title: t('dietTypes.keto.title'),
        subtitle: t('dietTypes.keto.subtitle'),
      },
      {
        type: 'low_carb',
        emoji: '🥦',
        title: t('dietTypes.low_carb.title'),
        subtitle: t('dietTypes.low_carb.subtitle'),
      },
      {
        type: 'high_protein',
        emoji: '💪',
        title: t('dietTypes.high_protein.title'),
        subtitle: t('dietTypes.high_protein.subtitle'),
      },
      {
        type: 'mediterranean',
        emoji: '🫒',
        title: t('dietTypes.mediterranean.title'),
        subtitle: t('dietTypes.mediterranean.subtitle'),
      },
      {
        type: 'intermittent_fasting',
        emoji: '⏰',
        title: t('dietTypes.intermittent_fasting.title'),
        subtitle: t('dietTypes.intermittent_fasting.subtitle'),
      },
      {
        type: 'paleo',
        emoji: '🍖',
        title: t('dietTypes.paleo.title'),
        subtitle: t('dietTypes.paleo.subtitle'),
      },
      {
        type: 'vegan',
        emoji: '🌱',
        title: t('dietTypes.vegan.title'),
        subtitle: t('dietTypes.vegan.subtitle'),
      },
      {
        type: 'vegetarian',
        emoji: '🥗',
        title: t('dietTypes.vegetarian.title'),
        subtitle: t('dietTypes.vegetarian.subtitle'),
      },
    ];

    return (
      <View style={styles.stepContainer}>
        <Text style={[styles.stepTitle, { color: theme.text }]}>
          {t('onboarding.selectDiet')}
        </Text>
        <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
          {t('onboarding.selectDietDesc')}
        </Text>

        {dietOptions.map(option => (
          <TouchableOpacity
            key={option.type}
            style={[
              styles.goalOption,
              { backgroundColor: theme.surface, borderColor: theme.border },
              dietType === option.type && { borderColor: theme.primary, borderWidth: 2 },
            ]}
            onPress={() => setDietType(option.type)}
          >
            <View style={styles.goalLeft}>
              <Text style={styles.goalEmoji}>{option.emoji}</Text>
              <View>
                <Text style={[styles.goalTitle, { color: theme.text }]}>{option.title}</Text>
                <Text style={[styles.goalSubtitle, { color: theme.textSecondary }]}>
                  {option.subtitle}
                </Text>
              </View>
            </View>
            {dietType === option.type && (
              <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderTargetWeightStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>
        {t('profile.goalSettings.targetWeight')}
      </Text>
      <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
        {t('profile.editModals.editTargetWeight')}
      </Text>

      <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
        <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
          {t('onboarding.weight')}
        </Text>
        <Text style={[styles.summaryValue, { color: theme.text }]}>
          {weight} кг
        </Text>
      </View>

      <Text style={[styles.label, { color: theme.text }]}>
        {t('profile.goalSettings.targetWeight')}
      </Text>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border },
        ]}
        placeholder={
          goalType === 'lose_weight'
            ? t('profile.editModals.targetWeightLowerForLoss')
            : t('profile.editModals.targetWeightHigherForGain')
        }
        placeholderTextColor={theme.disabled}
        keyboardType="decimal-pad"
        value={targetWeight}
        onChangeText={handleTargetWeightChange}
        maxLength={5}
      />
    </View>
  );

  const renderSummaryStep = () => {
    if (!gender || !age || !height || !weight || !goalType || !activityLevel) return null;

    const { bmr, tdee, targetCalories } = calculateUserCalories({
      weight: parseFloat(weight),
      height: parseInt(height),
      age: parseInt(age),
      gender,
      activityLevel,
      goalType,
    });

    return (
      <View style={styles.stepContainer}>
        <Text style={[styles.stepTitle, { color: theme.text }]}>{t('common.success')}!</Text>
        <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
          {t('profile.editModals.recommended', { calories: targetCalories })}
        </Text>

        <Card style={[styles.calorieCard, { backgroundColor: theme.primaryLight }]}>
          <Text style={[styles.calorieValue, { color: theme.primary }]}>{targetCalories}</Text>
          <Text style={[styles.calorieLabel, { color: theme.primary }]}>{t('diary.calories')}</Text>
        </Card>

        <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
            {t('profile.goalSettings.goal')}
          </Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>
            {getGoalTypeLabel(goalType)}
          </Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
            {t('profile.goalSettings.targetWeight')}
          </Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>
            {weight} → {targetWeight}
          </Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
            {t('diary.calories')}
          </Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>{bmr}</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
            {t('diary.goal')}
          </Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>{tdee}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {renderProgressBar()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 'gender_age' && renderGenderAgeStep()}
        {currentStep === 'height_weight' && renderHeightWeightStep()}
        {currentStep === 'goal' && renderGoalStep()}
        {currentStep === 'activity' && renderActivityStep()}
        {currentStep === 'diet' && renderDietStep()}
        {currentStep === 'target_weight' && renderTargetWeightStep()}
        {currentStep === 'summary' && renderSummaryStep()}
      </ScrollView>

      <View style={styles.footer}>
        {currentStep !== 'gender_age' && (
          <Button
            title={t('common.cancel')}
            variant="secondary"
            onPress={handleBack}
            style={styles.backButton}
          />
        )}
        {currentStep !== 'summary' ? (
          <Button title={t('onboarding.next')} onPress={handleNext} style={styles.nextButton} />
        ) : (
          <Button
            title={t('common.save')}
            onPress={handleComplete}
            loading={loading}
            disabled={loading}
            style={styles.nextButton}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  activityLeft: {
    flex: 1,
  },
  activityOption: {
    alignItems: 'center',
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  activityTitle: {
    ...Typography.body,
  },
  backButton: {
    flex: 1,
  },
  calorieCard: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    padding: Spacing.xl,
    paddingVertical: Spacing.xl * 1.5,
  },
  calorieLabel: {
    ...Typography.bodyLarge,
  },
  calorieValue: {
    ...Typography.h1,
    fontSize: 48,
    lineHeight: 56,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  genderContainer: {
    marginBottom: Spacing.md,
  },
  genderEmoji: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  genderOption: {
    alignItems: 'center',
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  genderText: {
    ...Typography.bodyLarge,
    flex: 1,
  },
  goalEmoji: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  goalLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  goalOption: {
    alignItems: 'center',
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  goalSubtitle: {
    ...Typography.caption,
  },
  goalTitle: {
    ...Typography.bodyLarge,
  },
  input: {
    ...Typography.bodyLarge,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    padding: Spacing.md,
  },
  label: {
    ...Typography.bodyLarge,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  nextButton: {
    flex: 2,
  },
  progressBar: {
    borderRadius: 2,
    height: 4,
    marginBottom: Spacing.xs,
  },
  progressContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  progressFill: {
    borderRadius: 2,
    height: '100%',
  },
  progressText: {
    ...Typography.caption,
    textAlign: 'center',
  },
  stepContainer: {
    paddingBottom: Spacing.xl,
  },
  stepDescription: {
    ...Typography.body,
    marginBottom: Spacing.lg,
  },
  stepTitle: {
    ...Typography.h2,
    marginBottom: Spacing.xs,
  },
  summaryCard: {
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  summaryLabel: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    ...Typography.bodyLarge,
  },
});
