// TypeScript типы для приложения

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type SubscriptionType = 'free' | 'premium';

export type Gender = 'male' | 'female';

export type ActivityLevel =
  | 'sedentary'      // Сидячий образ жизни
  | 'light'          // Легкая активность (1-3 тренировки в неделю)
  | 'moderate'       // Средняя активность (3-5 тренировок в неделю)
  | 'active'         // Высокая активность (6-7 тренировок в неделю)
  | 'very_active';   // Очень высокая активность (2 тренировки в день)

export type GoalType =
  | 'lose_weight'    // Похудение
  | 'maintain'       // Поддержание веса
  | 'gain_weight';   // Набор массы

export interface User {
  id: string;
  email: string;
  name?: string;
  subscription: SubscriptionType;

  // Физические параметры
  height?: number;              // Рост в см
  weight?: number;              // Текущий вес в кг
  age?: number;                 // Возраст в годах
  gender?: Gender;              // Пол

  // Цели и активность
  activityLevel?: ActivityLevel;  // Уровень активности
  goalType?: GoalType;            // Цель пользователя
  targetWeight?: number;          // Целевой вес в кг

  // Калории
  dailyCalorieGoal: number;       // Целевая норма калорий в день

  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface FoodEntry {
  id: string;
  userId: string;
  mealType: MealType;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  timestamp: string;
  date: string; // YYYY-MM-DD format

  // Photo recognition fields
  photoUrl?: string;
  aiConfidence?: number;
  aiReasoning?: string;
}

export interface DailyStats {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  calorieGoal: number;
  meals: FoodEntry[];
}

export interface AIUsage {
  userId: string;
  date: string;
  count: number;
  limit: number;
}

// Photo recognition types
export interface PhotoAnalysisResult {
  dishName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;  // 0.0 - 1.0
  reasoning: string;
  photoUri: string;    // Local URI
  photoUrl?: string;   // Storage URL (after upload)
}

export interface PhotoUsage {
  current: number;
  limit: number;
  remaining: number;
}

// Navigation types
export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
  Paywall: undefined;
};

export type MainTabParamList = {
  Chat: undefined;
  Diary: undefined;
  Profile: undefined;
};

// API Response types
export interface AuthResponse {
  user: User;
  token: string;
}

export interface AIResponse {
  message: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}
