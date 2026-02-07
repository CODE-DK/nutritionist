/**
 * Authentication Service
 *
 * Сервис для работы с аутентификацией через Supabase Auth.
 * Управляет регистрацией, входом, выходом и профилем пользователя.
 */

import { supabase } from '../config/supabase';

import type { User, AuthResponse, ApiError } from '../types';

class AuthService {
  /**
   * Регистрация нового пользователя
   */
  async signUp(email: string, password: string, name?: string): Promise<AuthResponse> {
    try {
      // Валидация
      if (!email || !email.includes('@')) {
        throw this.createError('Неверный формат email', 'INVALID_EMAIL');
      }
      if (!password || password.length < 6) {
        throw this.createError('Пароль должен быть минимум 6 символов', 'WEAK_PASSWORD');
      }

      // Регистрация через Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) {
        throw this.createError('Не удалось создать пользователя', 'SIGNUP_FAILED');
      }

      // Обновляем профиль с именем, если указано
      if (name) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ full_name: name })
          .eq('id', authData.user.id);

        if (updateError) {
          console.error('Failed to update profile name:', updateError);
        }
      }

      // Получаем полный профиль
      const user = await this.getUserProfile(authData.user.id, email);
      const token = authData.session?.access_token || '';

      return { user, token };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Вход в систему
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user || !data.session) {
        throw this.createError('Не удалось войти в систему', 'SIGNIN_FAILED');
      }

      const user = await this.getUserProfile(data.user.id, email);
      const token = data.session.access_token;

      return { user, token };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Выход из системы
   */
  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Получить текущего пользователя
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;
      if (!authUser) return null;

      const user = await this.getUserProfile(authUser.id, authUser.email || '');
      return user;
    } catch (error: any) {
      // AuthSessionMissingError - это нормально, когда пользователь не авторизован
      if (error?.message?.includes('Auth session missing')) {
        return null;
      }
      // Логируем только реальные ошибки
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Обновить профиль пользователя
   */
  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const dbUpdates: any = {};

      // Базовые поля
      if (updates.name !== undefined) {
        dbUpdates.full_name = updates.name;
      }
      if (updates.subscription !== undefined) {
        dbUpdates.subscription_tier = updates.subscription;
      }

      // Физические параметры
      if (updates.height !== undefined) {
        dbUpdates.height = updates.height;
      }
      if (updates.weight !== undefined) {
        dbUpdates.weight = updates.weight;
      }
      if (updates.age !== undefined) {
        dbUpdates.age = updates.age;
      }
      if (updates.gender !== undefined) {
        dbUpdates.gender = updates.gender;
      }

      // Цели и активность
      if (updates.activityLevel !== undefined) {
        dbUpdates.activity_level = updates.activityLevel;
      }
      if (updates.goalType !== undefined) {
        dbUpdates.goal_type = updates.goalType;
      }
      if (updates.targetWeight !== undefined) {
        dbUpdates.target_weight = updates.targetWeight;
      }

      // Калории
      if (updates.dailyCalorieGoal !== undefined) {
        dbUpdates.target_calories = updates.dailyCalorieGoal;
      }

      const { error } = await supabase.from('users').update(dbUpdates).eq('id', userId);

      if (error) throw error;

      // Получаем email из auth
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      const email = authUser?.email || '';

      // Возвращаем обновленный профиль
      return await this.getUserProfile(userId, email);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Проверка авторизации
   */
  async isAuthenticated(): Promise<boolean> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session !== null;
  }

  /**
   * Восстановление пароля
   */
  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'yourapp://reset-password',
      });

      if (error) throw error;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Обновление пароля
   */
  async updatePassword(newPassword: string): Promise<void> {
    try {
      if (newPassword.length < 6) {
        throw this.createError('Пароль должен быть минимум 6 символов', 'WEAK_PASSWORD');
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Слушатель изменения состояния авторизации
   */
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await this.getUserProfile(session.user.id, session.user.email || '');
        callback(user);
      } else {
        callback(null);
      }
    });
  }

  // Приватные методы

  /**
   * Получить полный профиль пользователя из БД
   */
  private async getUserProfile(userId: string, email: string): Promise<User> {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();

    if (error) throw error;

    // Маппинг из БД модели в модель приложения
    return {
      id: data.id,
      email: email,
      name: data.full_name || undefined,
      subscription: data.subscription_tier as 'free' | 'premium',

      // Физические параметры
      height: data.height || undefined,
      weight: data.weight ? parseFloat(data.weight) : undefined,
      age: data.age || undefined,
      gender: data.gender || undefined,

      // Цели и активность
      activityLevel: data.activity_level || undefined,
      goalType: data.goal_type || undefined,
      targetWeight: data.target_weight ? parseFloat(data.target_weight) : undefined,

      // Калории
      dailyCalorieGoal: data.target_calories || 2000,

      createdAt: data.created_at,
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
    // Специфичные ошибки Supabase
    if (error.message?.includes('Invalid login credentials')) {
      return this.createError('Неверный email или пароль', 'INVALID_CREDENTIALS');
    }
    if (error.message?.includes('User already registered')) {
      return this.createError('Пользователь с таким email уже существует', 'USER_EXISTS');
    }
    if (error.message?.includes('Email rate limit exceeded')) {
      return this.createError('Слишком много попыток. Попробуйте позже', 'RATE_LIMIT');
    }

    // Общая ошибка
    return {
      message: error.message || 'Произошла ошибка при работе с аутентификацией',
      code: error.code || 'AUTH_ERROR',
      statusCode: error.status || 500,
    };
  }
}

export default new AuthService();
