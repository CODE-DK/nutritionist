/**
 * Nutrition Tips Service
 *
 * Сервис для управления ежедневными советами по питанию.
 * Обрабатывает персонализацию советов, отслеживание показов и историю.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { ALL_TIPS } from '../data/tips';

import type { DailyTip, User, DietType, GoalType } from '../types';

interface ShownTipData {
  date: string;
  tipId: string;
  dismissed: boolean;
}

class NutritionTipsService {
  private readonly STORAGE_KEY = 'daily_tip_shown';
  private readonly SHOWN_TIPS_KEY = 'shown_tips_history';

  /**
   * Получить совет дня для пользователя
   */
  async getDailyTip(user: User): Promise<DailyTip | null> {
    // 1. Проверить настройки
    if (user.showDailyTips === false) return null;
    if (!user.dietType) return null;

    // 2. Проверить, показывался ли сегодня совет
    const todayTip = await this.getTodayTip(user.id);
    if (todayTip && !todayTip.dismissed) {
      const tip = ALL_TIPS.find(t => t.id === todayTip.tipId);
      return tip || null;
    }

    // 3. Выбрать новый совет
    const applicableTips = this.getApplicableTips(user);
    if (applicableTips.length === 0) return null;

    // 4. Исключить недавно показанные
    const shownTips = await this.getShownTipsHistory(user.id);
    const recentTipIds = shownTips.slice(-30).map(t => t.tipId);
    const availableTips = applicableTips.filter(tip => !recentTipIds.includes(tip.id));

    // 5. Выбрать случайный совет
    const tips = availableTips.length > 0 ? availableTips : applicableTips;
    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    // 6. Сохранить как показанный
    await this.markTipAsShown(user.id, randomTip.id);

    return randomTip;
  }

  /**
   * Получить все подходящие советы для пользователя
   */
  getApplicableTips(user: User): DailyTip[] {
    return this.filterTips(ALL_TIPS, user.dietType!, user.goalType);
  }

  /**
   * Фильтровать советы по диете и цели
   */
  filterTips(tips: DailyTip[], dietType: DietType, goalType?: GoalType): DailyTip[] {
    return tips.filter(tip => {
      const matchesDiet = tip.dietTypes.includes(dietType);
      const matchesGoal = !tip.goalTypes || !goalType || tip.goalTypes.includes(goalType);
      return matchesDiet && matchesGoal;
    });
  }

  /**
   * Получить совет, показанный сегодня
   */
  async getTodayTip(userId: string): Promise<ShownTipData | null> {
    try {
      const data = await AsyncStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
      if (!data) return null;

      const tipData: ShownTipData = JSON.parse(data);
      const today = new Date().toISOString().split('T')[0];

      if (tipData.date === today) {
        return tipData;
      }
      return null;
    } catch (error) {
      console.error('Error getting today tip:', error);
      return null;
    }
  }

  /**
   * Сохранить показанный совет
   */
  async markTipAsShown(userId: string, tipId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const tipData: ShownTipData = {
        date: today,
        tipId,
        dismissed: false,
      };

      await AsyncStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(tipData));

      // Добавить в историю
      await this.addToHistory(userId, tipId);
    } catch (error) {
      console.error('Error marking tip as shown:', error);
    }
  }

  /**
   * Отметить совет как закрытый
   */
  async dismissTip(userId: string, tipId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const tipData: ShownTipData = {
        date: today,
        tipId,
        dismissed: true,
      };

      await AsyncStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(tipData));
    } catch (error) {
      console.error('Error dismissing tip:', error);
    }
  }

  /**
   * Получить историю показанных советов
   */
  async getShownTipsHistory(
    userId: string
  ): Promise<Array<{ tipId: string; date: string }>> {
    try {
      const data = await AsyncStorage.getItem(`${this.SHOWN_TIPS_KEY}_${userId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting shown tips history:', error);
      return [];
    }
  }

  /**
   * Добавить в историю показанных советов
   */
  private async addToHistory(userId: string, tipId: string): Promise<void> {
    try {
      const history = await this.getShownTipsHistory(userId);
      const today = new Date().toISOString().split('T')[0];

      history.push({ tipId, date: today });

      // Хранить только последние 100 записей
      const trimmedHistory = history.slice(-100);

      await AsyncStorage.setItem(
        `${this.SHOWN_TIPS_KEY}_${userId}`,
        JSON.stringify(trimmedHistory)
      );
    } catch (error) {
      console.error('Error adding to history:', error);
    }
  }
}

export default new NutritionTipsService();
