/**
 * Analytics Service
 *
 * Сервис для аналитики и статистики использования приложения.
 * Работает с Supabase для получения данных из chat_history и food_diary.
 */

import { supabase } from '../config/supabase';

type EventName =
  | 'user_registered'
  | 'user_logged_in'
  | 'user_logged_out'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'onboarding_skipped'
  | 'ai_message_sent'
  | 'ai_response_received'
  | 'ai_error_occurred'
  | 'ai_limit_reached'
  | 'meal_added'
  | 'meal_edited'
  | 'meal_deleted'
  | 'diary_viewed'
  | 'paywall_viewed'
  | 'paywall_dismissed'
  | 'profile_viewed'
  | 'profile_edited'
  | 'theme_changed';

type EventProperties = Record<string, string | number | boolean>;

interface UserStats {
  totalAIMessages: number;
  totalMeals: number;
  totalTokensUsed: number;
  averageDailyCalories: number;
  daysActive: number;
  memberSince: string;
}

interface WeeklyStats {
  date: string;
  meals: number;
  aiMessages: number;
  calories: number;
}

class AnalyticsService {
  private userId: string | null = null;

  /**
   * Установить ID пользователя
   */
  setUserId(userId: string): void {
    this.userId = userId;
    console.log('[Analytics] User ID set:', userId);
  }

  /**
   * Очистить ID пользователя (при выходе)
   */
  clearUserId(): void {
    this.userId = null;
    console.log('[Analytics] User ID cleared');
  }

  /**
   * Отследить событие (логирование в консоль)
   */
  track(eventName: EventName, properties?: EventProperties): void {
    console.log('[Analytics] Event tracked:', eventName, properties);

    // В будущем здесь можно добавить отправку в Amplitude, Mixpanel и т.д.
  }

  /**
   * Установить свойства пользователя
   */
  setUserProperties(properties: EventProperties): void {
    console.log('[Analytics] User properties set:', properties);
  }

  /**
   * Получить общую статистику пользователя
   */
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      // Получаем дату регистрации
      const { data: userData } = await supabase
        .from('users')
        .select('created_at')
        .eq('id', userId)
        .single();

      // Получаем статистику по AI сообщениям
      const { data: chatData, count: totalAIMessages } = await supabase
        .from('chat_history')
        .select('*', { count: 'exact', head: false })
        .eq('user_id', userId);

      // Подсчитываем токены
      const totalTokensUsed = (chatData || []).reduce(
        (sum, item) => sum + (item.tokens_used || 0),
        0
      );

      // Получаем статистику по приемам пищи
      const { count: totalMeals } = await supabase
        .from('food_diary')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Средние калории за последние 30 дней
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

      const { data: recentMeals } = await supabase
        .from('food_diary')
        .select('calories, meal_date')
        .eq('user_id', userId)
        .gte('meal_date', dateStr);

      // Группируем по дням и считаем среднее
      const dailyCalories: Record<string, number> = {};
      (recentMeals || []).forEach(meal => {
        const date = meal.meal_date;
        dailyCalories[date] = (dailyCalories[date] || 0) + (meal.calories || 0);
      });

      const daysActive = Object.keys(dailyCalories).length;
      const totalCalories = Object.values(dailyCalories).reduce((sum, cal) => sum + cal, 0);
      const averageDailyCalories = daysActive > 0 ? Math.round(totalCalories / daysActive) : 0;

      return {
        totalAIMessages: totalAIMessages || 0,
        totalMeals: totalMeals || 0,
        totalTokensUsed,
        averageDailyCalories,
        daysActive,
        memberSince: userData?.created_at || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        totalAIMessages: 0,
        totalMeals: 0,
        totalTokensUsed: 0,
        averageDailyCalories: 0,
        daysActive: 0,
        memberSince: new Date().toISOString(),
      };
    }
  }

  /**
   * Получить статистику за последние 7 дней
   */
  async getWeeklyStats(userId: string): Promise<WeeklyStats[]> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const startDate = sevenDaysAgo.toISOString().split('T')[0];

      // Получаем приемы пищи за неделю
      const { data: meals } = await supabase
        .from('food_diary')
        .select('meal_date, calories')
        .eq('user_id', userId)
        .gte('meal_date', startDate)
        .order('meal_date', { ascending: true });

      // Получаем AI сообщения за неделю
      const { data: messages } = await supabase
        .from('chat_history')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString());

      // Группируем по датам
      const statsByDate: Record<string, WeeklyStats> = {};

      // Инициализируем все 7 дней
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        statsByDate[dateStr] = {
          date: dateStr,
          meals: 0,
          aiMessages: 0,
          calories: 0,
        };
      }

      // Заполняем данные по приемам пищи
      (meals || []).forEach(meal => {
        const date = meal.meal_date;
        if (statsByDate[date]) {
          statsByDate[date].meals++;
          statsByDate[date].calories += meal.calories || 0;
        }
      });

      // Заполняем данные по AI сообщениям
      (messages || []).forEach(msg => {
        const date = msg.created_at.split('T')[0];
        if (statsByDate[date]) {
          statsByDate[date].aiMessages++;
        }
      });

      // Возвращаем отсортированный массив
      return Object.values(statsByDate).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    } catch (error) {
      console.error('Error getting weekly stats:', error);
      return [];
    }
  }

  /**
   * Получить топ продуктов по калориям
   */
  async getTopFoods(
    userId: string,
    limit: number = 10
  ): Promise<
    Array<{
      name: string;
      count: number;
      totalCalories: number;
    }>
  > {
    try {
      const { data } = await supabase
        .from('food_diary')
        .select('food_name, calories')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100); // Берем последние 100 записей

      if (!data) return [];

      // Группируем по названию
      const foodStats: Record<string, { count: number; totalCalories: number }> = {};
      data.forEach(meal => {
        const name = meal.food_name;
        if (!foodStats[name]) {
          foodStats[name] = { count: 0, totalCalories: 0 };
        }
        foodStats[name].count++;
        foodStats[name].totalCalories += meal.calories || 0;
      });

      // Преобразуем в массив и сортируем по частоте
      return Object.entries(foodStats)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top foods:', error);
      return [];
    }
  }

  /**
   * Получить статистику по использованию AI
   */
  async getAIUsageStats(userId: string): Promise<{
    today: number;
    thisWeek: number;
    thisMonth: number;
    totalTokens: number;
  }> {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      // Получаем все сообщения пользователя
      const { data } = await supabase
        .from('chat_history')
        .select('created_at, tokens_used')
        .eq('user_id', userId);

      if (!data) return { today: 0, thisWeek: 0, thisMonth: 0, totalTokens: 0 };

      let todayCount = 0;
      let weekCount = 0;
      let monthCount = 0;
      let totalTokens = 0;

      data.forEach(msg => {
        const msgDate = new Date(msg.created_at);
        const msgDateStr = msg.created_at.split('T')[0];

        if (msgDateStr === today) todayCount++;
        if (msgDate >= weekAgo) weekCount++;
        if (msgDate >= monthAgo) monthCount++;

        totalTokens += msg.tokens_used || 0;
      });

      return {
        today: todayCount,
        thisWeek: weekCount,
        thisMonth: monthCount,
        totalTokens,
      };
    } catch (error) {
      console.error('Error getting AI usage stats:', error);
      return { today: 0, thisWeek: 0, thisMonth: 0, totalTokens: 0 };
    }
  }
}

export default new AnalyticsService();
