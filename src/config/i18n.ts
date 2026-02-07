import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../locales/en';
import ru from '../locales/ru';

const LANGUAGE_KEY = '@app_language';

// Доступные языки
export const LANGUAGES = {
  ru: { label: 'Русский', value: 'ru' },
  en: { label: 'English', value: 'en' },
};

// Инициализация i18n
i18n.use(initReactI18next).init({
  resources: {
    ru,
    en,
  },
  lng: 'ru', // Язык по умолчанию
  fallbackLng: 'ru',
  compatibilityJSON: 'v3',
  interpolation: {
    escapeValue: false, // React уже экранирует значения
  },
});

// Функция для загрузки сохраненного языка
export const loadLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (savedLanguage && (savedLanguage === 'ru' || savedLanguage === 'en')) {
      await i18n.changeLanguage(savedLanguage);
    }
  } catch (error) {
    console.error('Error loading language:', error);
  }
};

// Функция для сохранения выбранного языка
export const saveLanguage = async (language: string) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
    await i18n.changeLanguage(language);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

export default i18n;
