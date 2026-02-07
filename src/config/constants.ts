// Константы приложения

export const APP_CONFIG = {
  FREE_DAILY_AI_LIMIT: 10,
  DEFAULT_CALORIE_GOAL: 2000,
  MAX_MESSAGE_LENGTH: 500,
  CHAT_HISTORY_LIMIT: 20,

  // Photo recognition limits
  FREE_PHOTO_LIMIT: 5,
  PREMIUM_PHOTO_LIMIT: 999,
  MAX_PHOTO_SIZE_MB: 2,
  PHOTO_CLEANUP_DAYS: 30,
};

export const ONBOARDING_EXAMPLES = [
  'Сколько калорий в овсянке?',
  'Составь план питания',
  'Что съесть на ужин?',
];

export const MEAL_TYPES = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
  SNACK: 'snack',
} as const;

export const MEAL_TYPE_LABELS = {
  [MEAL_TYPES.BREAKFAST]: '🍳 Завтрак',
  [MEAL_TYPES.LUNCH]: '🍔 Обед',
  [MEAL_TYPES.DINNER]: '🍕 Ужин',
  [MEAL_TYPES.SNACK]: '🍎 Перекус',
};

export const SUBSCRIPTION_TYPES = {
  FREE: 'free',
  PREMIUM: 'premium',
} as const;

export const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: '@onboarding_completed',
  USER_TOKEN: '@user_token',
  USER_DATA: '@user_data',
};

export const API_CONFIG = {
  AI_MODEL: 'gpt-4o-mini',
  AI_TEMPERATURE: 0.7,
  AI_MAX_TOKENS: 800,
};

export const PHOTO_CONFIG = {
  COMPRESSION_QUALITY: 0.8,
  MAX_WIDTH: 1024,
  MIN_CONFIDENCE: 0.3,
  GOOD_CONFIDENCE: 0.7,
};
