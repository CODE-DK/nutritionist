/**
 * Центральный экспорт всех советов по питанию
 *
 * Советы организованы по категориям в отдельных файлах.
 * Этот файл объединяет их в один массив для удобного использования.
 */

import type { DailyTip } from '../../types';

import { foodBenefitsTips } from './food-benefits';
import { generalTips } from './general';
import { hydrationTips } from './hydration';
import { mealTimingTips } from './meal-timing';
import { nutritionTips } from './nutrition';

/**
 * Все доступные советы по питанию
 */
export const ALL_TIPS: DailyTip[] = [
  ...nutritionTips,
  ...hydrationTips,
  ...mealTimingTips,
  ...foodBenefitsTips,
  ...generalTips,
];

/**
 * Советы, сгруппированные по категориям
 */
export const TIPS_BY_CATEGORY = {
  nutrition: nutritionTips,
  hydration: hydrationTips,
  meal_timing: mealTimingTips,
  food_benefits: foodBenefitsTips,
  general: generalTips,
};

/**
 * Статистика по советам
 */
export const getTipsStats = () => {
  return {
    total: ALL_TIPS.length,
    byCategory: {
      nutrition: nutritionTips.length,
      hydration: hydrationTips.length,
      meal_timing: mealTimingTips.length,
      food_benefits: foodBenefitsTips.length,
      general: generalTips.length,
    },
  };
};

/**
 * Валидация уникальности ID
 */
export const validateTipsIds = (): { isValid: boolean; duplicates: string[] } => {
  const ids = ALL_TIPS.map(tip => tip.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

  return {
    isValid: duplicates.length === 0,
    duplicates: [...new Set(duplicates)],
  };
};

// Экспорт по категориям для удобства
export { nutritionTips, hydrationTips, mealTimingTips, foodBenefitsTips, generalTips };
