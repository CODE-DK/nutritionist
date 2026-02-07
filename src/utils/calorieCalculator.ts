/**
 * Калькулятор калорий
 *
 * Использует формулу Mifflin-St Jeor для расчета базового метаболизма (BMR)
 * и общего дневного расхода энергии (TDEE).
 */

import i18n from '../config/i18n';

import type { Gender, ActivityLevel, GoalType } from '../types';

/**
 * Коэффициенты активности для расчета TDEE
 */
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2, // Сидячий образ жизни, минимум движения
  light: 1.375, // Легкие упражнения 1-3 раза в неделю
  moderate: 1.55, // Умеренные упражнения 3-5 раз в неделю
  active: 1.725, // Интенсивные упражнения 6-7 раз в неделю
  very_active: 1.9, // Очень интенсивные упражнения, физическая работа
};

/**
 * Процент корректировки калорий в зависимости от цели
 */
const GOAL_ADJUSTMENTS: Record<GoalType, number> = {
  lose_weight: -0.2, // Дефицит 20% для похудения
  maintain: 0, // Поддержание текущего веса
  gain_weight: 0.1, // Профицит 10% для набора массы
};

/**
 * Рассчитывает базовый метаболизм (BMR) по формуле Mifflin-St Jeor
 *
 * Для мужчин: BMR = 10 × вес(кг) + 6.25 × рост(см) - 5 × возраст + 5
 * Для женщин: BMR = 10 × вес(кг) + 6.25 × рост(см) - 5 × возраст - 161
 *
 * @param weight - вес в кг
 * @param height - рост в см
 * @param age - возраст в годах
 * @param gender - пол
 * @returns базовый метаболизм (калории в день)
 */
export function calculateBMR(weight: number, height: number, age: number, gender: Gender): number {
  const baseCalc = 10 * weight + 6.25 * height - 5 * age;
  const genderOffset = gender === 'male' ? 5 : -161;
  return Math.round(baseCalc + genderOffset);
}

/**
 * Рассчитывает общий дневной расход энергии (TDEE)
 * TDEE = BMR × коэффициент активности
 *
 * @param bmr - базовый метаболизм
 * @param activityLevel - уровень активности
 * @returns общий дневной расход энергии (калории в день)
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  return Math.round(bmr * multiplier);
}

/**
 * Рассчитывает целевую норму калорий с учетом цели пользователя
 *
 * @param tdee - общий дневной расход энергии
 * @param goalType - цель пользователя
 * @returns целевая норма калорий в день
 */
export function calculateTargetCalories(tdee: number, goalType: GoalType): number {
  const adjustment = GOAL_ADJUSTMENTS[goalType];
  const targetCalories = tdee * (1 + adjustment);

  // Минимум 1200 калорий для женщин, 1500 для мужчин (безопасные границы)
  const minCalories = 1200;
  return Math.max(minCalories, Math.round(targetCalories));
}

/**
 * Рассчитывает все показатели калорий для пользователя
 *
 * @param params - параметры пользователя
 * @returns объект с BMR, TDEE и целевой нормой калорий
 */
export function calculateUserCalories(params: {
  weight: number;
  height: number;
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  goalType: GoalType;
}): {
  bmr: number;
  tdee: number;
  targetCalories: number;
} {
  const bmr = calculateBMR(params.weight, params.height, params.age, params.gender);
  const tdee = calculateTDEE(bmr, params.activityLevel);
  const targetCalories = calculateTargetCalories(tdee, params.goalType);

  return { bmr, tdee, targetCalories };
}

/**
 * Рассчитывает рекомендуемый темп потери/набора веса в неделю (кг)
 *
 * 1 кг жира ≈ 7700 калорий
 * Безопасная потеря: 0.5-1 кг в неделю
 * Безопасный набор: 0.25-0.5 кг в неделю
 *
 * @param dailyCalorieDeficit - дефицит/профицит калорий в день
 * @returns темп изменения веса в кг/неделю
 */
export function calculateWeeklyWeightChange(dailyCalorieDeficit: number): number {
  const weeklyDeficit = dailyCalorieDeficit * 7;
  const caloriesPerKg = 7700;
  return Math.round((weeklyDeficit / caloriesPerKg) * 10) / 10; // Округление до 0.1 кг
}

/**
 * Рассчитывает примерное время достижения целевого веса
 *
 * @param currentWeight - текущий вес в кг
 * @param targetWeight - целевой вес в кг
 * @param weeklyChange - изменение веса в неделю в кг
 * @returns количество недель до достижения цели
 */
export function calculateWeeksToGoal(
  currentWeight: number,
  targetWeight: number,
  weeklyChange: number
): number {
  if (weeklyChange === 0) return 0;

  const weightDifference = Math.abs(targetWeight - currentWeight);
  const weeks = Math.ceil(weightDifference / Math.abs(weeklyChange));

  return weeks;
}

/**
 * Получает описание уровня активности с учетом локализации
 */
export function getActivityLevelLabel(activityLevel: ActivityLevel): string {
  return i18n.t(`activityLevels.${activityLevel}`);
}

/**
 * Получает описание цели с учетом локализации
 */
export function getGoalTypeLabel(goalType: GoalType): string {
  return i18n.t(`goalTypes.${goalType}`);
}
