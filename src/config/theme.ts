// Дизайн система согласно DESIGN.md

// Light Theme Colors
export const LightColors = {
  // Primary (Зелёный — здоровье, рост, жизнь)
  primary: '#4CAF50',
  primaryHover: '#66BB6A',
  primaryPressed: '#388E3C',
  primaryLight: '#E8F5E9',

  // Secondary (Синий — доверие, спокойствие)
  secondary: '#2196F3',
  secondaryHover: '#42A5F5',
  secondaryPressed: '#1976D2',
  secondaryLight: '#E3F2FD',

  // Нейтральные
  white: '#FFFFFF',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  border: '#E0E0E0',
  disabled: '#BDBDBD',
  textSecondary: '#757575',
  text: '#333333',
  black: '#000000',

  // Семантические цвета
  success: '#4CAF50',
  warning: '#FF9800',
  warningLight: '#FFF3E0',
  error: '#F44336',
  errorLight: '#FFEBEE',
  info: '#2196F3',

  // Градиенты
  gradientPremiumStart: '#FFD700',
  gradientPremiumEnd: '#FFA500',
  gradientHealthyStart: '#4CAF50',
  gradientHealthyEnd: '#8BC34A',

  // Meal types
  mealBreakfast: '#FF9800',
  mealLunch: '#4CAF50',
  mealDinner: '#2196F3',
  mealSnack: '#9C27B0',

  // Chat
  chatAIBackground: '#E8F5E9',
  chatUserBackground: '#2196F3',
  chatUserText: '#FFFFFF',
};

// Dark Theme Colors (согласно DESIGN.md Dark Mode)
export const DarkColors = {
  // Primary (более светлый для темной темы)
  primary: '#66BB6A',
  primaryHover: '#81C784',
  primaryPressed: '#4CAF50',
  primaryLight: '#1B5E20',

  // Secondary
  secondary: '#42A5F5',
  secondaryHover: '#64B5F6',
  secondaryPressed: '#2196F3',
  secondaryLight: '#0D47A1',

  // Backgrounds (Elevation System)
  white: '#1E1E1E',
  background: '#121212',
  surface: '#1E1E1E',
  surfaceElevation1: '#1E1E1E',
  surfaceElevation2: '#2C2C2C',
  surfaceElevation3: '#383838',
  surfaceElevation4: '#424242',
  border: '#383838',
  disabled: '#606060',
  textSecondary: '#B0B0B0',
  text: '#FFFFFF',
  black: '#000000',

  // Семантические цвета (приглушенные)
  success: '#66BB6A',
  warning: '#FFB74D',
  warningLight: 'rgba(255, 183, 77, 0.12)',
  error: '#EF5350',
  errorLight: 'rgba(239, 83, 80, 0.12)',
  info: '#4DD0E1',

  // Градиенты (приглушенные)
  gradientPremiumStart: '#C89600',
  gradientPremiumEnd: '#E07B00',
  gradientHealthyStart: '#1A4D2E',
  gradientHealthyEnd: '#2D5A3A',

  // Meal types (более светлые для темной темы)
  mealBreakfast: '#FFB74D',
  mealLunch: '#66BB6A',
  mealDinner: '#42A5F5',
  mealSnack: '#BA68C8',

  // Chat (темные зеленые оттенки)
  chatAIBackground: '#1F2C26',
  chatUserBackground: '#1A4D2E',
  chatUserText: '#FFFFFF',
};

// Экспортируем LightColors как Colors для обратной совместимости
export const Colors = LightColors;

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    color: Colors.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    color: Colors.text,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    color: Colors.text,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    color: Colors.text,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    color: Colors.disabled,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  small: 8,
  medium: 12,
  large: 16,
  xlarge: 20,
  pill: 999,
};

export const Shadows = {
  level0: {
    shadowColor: '#000',
    shadowOpacity: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
    elevation: 0,
  },
  level1: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  level2: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  level3: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  level4: {
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
};

export const Animations = {
  fast: 200,
  normal: 300,
  slow: 400,
};
