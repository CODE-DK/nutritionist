/**
 * Supabase Client Configuration
 *
 * Инициализирует и экспортирует единственный экземпляр Supabase клиента
 * для использования во всем приложении.
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Конфигурация из переменных окружения
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Проверка наличия обязательных переменных
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Supabase credentials are missing!');
  console.error('Please add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file');
}

/**
 * Создание Supabase клиента с поддержкой React Native
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Используем AsyncStorage для хранения сессии в React Native
    storage: AsyncStorage,
    // Автоматически обновлять токен при истечении
    autoRefreshToken: true,
    // Обнаруживать сессию из URL (для deep linking)
    detectSessionInUrl: false,
    // Сохранять сессию при закрытии приложения
    persistSession: true,
  },
  // Настройки для работы с realtime (опционально)
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Типы для работы с базой данных
 * Генерируются автоматически командой: supabase gen types typescript
 */
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          full_name: string | null;
          subscription_tier: 'free' | 'premium';
          stripe_customer_id: string | null;
          daily_ai_requests: number;
          last_request_date: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          subscription_tier?: 'free' | 'premium';
          stripe_customer_id?: string | null;
          daily_ai_requests?: number;
          last_request_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          subscription_tier?: 'free' | 'premium';
          stripe_customer_id?: string | null;
          daily_ai_requests?: number;
          last_request_date?: string | null;
          created_at?: string;
        };
      };
      chat_history: {
        Row: {
          id: string;
          user_id: string;
          message: string;
          response: string;
          tokens_used: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          message: string;
          response: string;
          tokens_used?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          message?: string;
          response?: string;
          tokens_used?: number | null;
          created_at?: string;
        };
      };
      food_diary: {
        Row: {
          id: string;
          user_id: string;
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          food_name: string;
          calories: number | null;
          protein: number | null;
          carbs: number | null;
          fats: number | null;
          meal_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          food_name: string;
          calories?: number | null;
          protein?: number | null;
          carbs?: number | null;
          fats?: number | null;
          meal_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          food_name?: string;
          calories?: number | null;
          protein?: number | null;
          carbs?: number | null;
          fats?: number | null;
          meal_date?: string;
          created_at?: string;
        };
      };
    };
    Functions: {
      check_and_increment_limit: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
    };
  };
};

export default supabase;
