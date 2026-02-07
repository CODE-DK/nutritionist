/**
 * Food Diary Service
 *
 * Сервис для работы с дневником питания через Supabase.
 * Управляет записями приемов пищи и статистикой.
 */

import { supabase } from '../config/supabase';
import type { FoodEntry, DailyStats, ApiError, MealType } from '../types';
import { APP_CONFIG } from '../config/constants';

class DiaryService {
  /**
   * Добавить прием пищи
   */
  async addMeal(
    userId: string,
    entry: Omit<FoodEntry, 'id' | 'userId' | 'timestamp'>
  ): Promise<FoodEntry> {
    try {
      // Валидация
      if (!entry.name || entry.name.trim().length === 0) {
        throw this.createError('Название блюда обязательно', 'INVALID_NAME');
      }
      if (entry.calories < 0 || entry.calories > 10000) {
        throw this.createError('Калории должны быть от 0 до 10000', 'INVALID_CALORIES');
      }

      // Подготовка данных для вставки в БД
      const insertData = {
        user_id: userId,
        meal_type: entry.mealType,
        food_name: entry.name,
        calories: entry.calories,
        protein: entry.protein || null,
        carbs: entry.carbs || null,
        fats: entry.fat || null,
        meal_date: entry.date,
        // Photo recognition fields
        photo_url: entry.photoUrl || null,
        ai_confidence: entry.aiConfidence || null,
        ai_reasoning: entry.aiReasoning || null,
      };

      const { data, error } = await supabase
        .from('food_diary')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Маппинг из БД модели в модель приложения
      return this.mapToFoodEntry(data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Получить записи за конкретный день
   */
  async getMealsByDate(userId: string, date: string): Promise<FoodEntry[]> {
    try {
      const { data, error } = await supabase
        .from('food_diary')
        .select('*')
        .eq('user_id', userId)
        .eq('meal_date', date)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(this.mapToFoodEntry);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Получить статистику за день
   */
  async getDailyStats(userId: string, date: string): Promise<DailyStats> {
    try {
      const meals = await this.getMealsByDate(userId, date);

      const stats = meals.reduce(
        (acc, meal) => ({
          totalCalories: acc.totalCalories + (meal.calories || 0),
          totalProtein: acc.totalProtein + (meal.protein || 0),
          totalCarbs: acc.totalCarbs + (meal.carbs || 0),
          totalFat: acc.totalFat + (meal.fat || 0),
        }),
        {
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
        }
      );

      return {
        date,
        ...stats,
        calorieGoal: APP_CONFIG.DEFAULT_CALORIE_GOAL,
        meals,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Получить статистику за период
   */
  async getStatsForPeriod(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<DailyStats[]> {
    try {
      const { data, error } = await supabase
        .from('food_diary')
        .select('*')
        .eq('user_id', userId)
        .gte('meal_date', startDate)
        .lte('meal_date', endDate)
        .order('meal_date', { ascending: false });

      if (error) throw error;

      // Группируем по датам
      const mealsByDate: Record<string, FoodEntry[]> = {};
      (data || []).forEach((item) => {
        const meal = this.mapToFoodEntry(item);
        if (!mealsByDate[meal.date]) {
          mealsByDate[meal.date] = [];
        }
        mealsByDate[meal.date].push(meal);
      });

      // Создаем статистику для каждого дня
      return Object.entries(mealsByDate).map(([date, meals]) => {
        const stats = meals.reduce(
          (acc, meal) => ({
            totalCalories: acc.totalCalories + (meal.calories || 0),
            totalProtein: acc.totalProtein + (meal.protein || 0),
            totalCarbs: acc.totalCarbs + (meal.carbs || 0),
            totalFat: acc.totalFat + (meal.fat || 0),
          }),
          {
            totalCalories: 0,
            totalProtein: 0,
            totalCarbs: 0,
            totalFat: 0,
          }
        );

        return {
          date,
          ...stats,
          calorieGoal: APP_CONFIG.DEFAULT_CALORIE_GOAL,
          meals,
        };
      });
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Обновить запись
   */
  async updateMeal(
    mealId: string,
    updates: Partial<Omit<FoodEntry, 'id' | 'userId' | 'timestamp'>>
  ): Promise<FoodEntry> {
    try {
      const dbUpdates: any = {};

      if (updates.mealType) dbUpdates.meal_type = updates.mealType;
      if (updates.name) dbUpdates.food_name = updates.name;
      if (updates.calories !== undefined) dbUpdates.calories = updates.calories;
      if (updates.protein !== undefined) dbUpdates.protein = updates.protein;
      if (updates.carbs !== undefined) dbUpdates.carbs = updates.carbs;
      if (updates.fat !== undefined) dbUpdates.fats = updates.fat;
      if (updates.date) dbUpdates.meal_date = updates.date;

      const { data, error } = await supabase
        .from('food_diary')
        .update(dbUpdates)
        .eq('id', mealId)
        .select()
        .single();

      if (error) throw error;

      return this.mapToFoodEntry(data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Удалить запись
   */
  async deleteMeal(mealId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('food_diary')
        .delete()
        .eq('id', mealId);

      if (error) throw error;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Получить последние записи пользователя
   */
  async getRecentMeals(userId: string, limit: number = 10): Promise<FoodEntry[]> {
    try {
      const { data, error } = await supabase
        .from('food_diary')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(this.mapToFoodEntry);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Поиск продуктов по имени
   */
  async searchMeals(userId: string, query: string): Promise<FoodEntry[]> {
    try {
      const { data, error } = await supabase
        .from('food_diary')
        .select('*')
        .eq('user_id', userId)
        .ilike('food_name', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data || []).map(this.mapToFoodEntry);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Приватные методы

  /**
   * Маппинг из БД модели в модель приложения
   */
  private mapToFoodEntry(data: any): FoodEntry {
    return {
      id: data.id,
      userId: data.user_id,
      mealType: data.meal_type as MealType,
      name: data.food_name,
      calories: data.calories || 0,
      protein: data.protein || undefined,
      carbs: data.carbs || undefined,
      fat: data.fats || undefined,
      date: data.meal_date,
      timestamp: data.created_at,
      // Photo recognition fields
      photoUrl: data.photo_url || undefined,
      aiConfidence: data.ai_confidence || undefined,
      aiReasoning: data.ai_reasoning || undefined,
    };
  }

  /**
   * Создать ошибку
   */
  private createError(message: string, code: string): ApiError {
    return {
      message,
      code,
      statusCode: 400,
    };
  }

  /**
   * Обработать ошибку от Supabase
   */
  private handleError(error: any): ApiError {
    if (error.code === 'PGRST116') {
      return this.createError('Запись не найдена', 'NOT_FOUND');
    }

    if (error.message?.includes('violates check constraint')) {
      return this.createError('Неверные значения полей', 'VALIDATION_ERROR');
    }

    return {
      message: error.message || 'Произошла ошибка при работе с дневником питания',
      code: error.code || 'DIARY_ERROR',
      statusCode: error.status || 500,
    };
  }
}

export default new DiaryService();
