// AppNavigator - главная навигация приложения

import React, { useState, useEffect } from 'react';

import { View, Linking } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Screens
import Loading from '../components/Loading';
import { useAuth } from '../config/AuthContext';
import { STORAGE_KEYS } from '../config/constants';
import { supabase } from '../config/supabase';
import { Colors } from '../config/theme';
import AuthScreen from '../screens/AuthScreen';
import ChatScreen from '../screens/ChatScreen';
import DiaryScreen from '../screens/DiaryScreen';
import EmailConfirmationScreen from '../screens/EmailConfirmationScreen';
import OnboardingQuestionnaire from '../screens/OnboardingQuestionnaire';
import OnboardingScreen from '../screens/OnboardingScreen';
import PaywallScreen from '../screens/PaywallScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
// Services
import analyticsService from '../services/analyticsService';

// Config

import type { User } from '../types';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tabs Navigator
function MainTabs({
  user,
  onUserUpdate,
  onLogout,
}: {
  user: User;
  onUserUpdate: (user: User) => void;
  onLogout: () => void;
}) {
  const [showPaywall, setShowPaywall] = useState(false);

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'ChatTab') {
              iconName = focused ? 'chatbubble' : 'chatbubble-outline';
            } else if (route.name === 'DiaryTab') {
              iconName = focused ? 'book' : 'book-outline';
            } else {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.disabled,
          tabBarStyle: {
            borderTopColor: Colors.border,
            borderTopWidth: 1,
          },
        })}
      >
        <Tab.Screen name="ChatTab" options={{ tabBarLabel: 'Чат' }}>
          {() => <ChatScreen userId={user.id} onLimitReached={() => setShowPaywall(true)} />}
        </Tab.Screen>

        <Tab.Screen name="DiaryTab" options={{ tabBarLabel: 'Дневник' }}>
          {() => <DiaryScreen userId={user.id} user={user} />}
        </Tab.Screen>

        <Tab.Screen name="ProfileTab" options={{ tabBarLabel: 'Профиль' }}>
          {() => <ProfileScreen user={user} onUserUpdate={onUserUpdate} onLogout={onLogout} />}
        </Tab.Screen>
      </Tab.Navigator>

      {/* Paywall Modal */}
      {showPaywall && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <PaywallScreen onClose={() => setShowPaywall(false)} />
        </View>
      )}
    </>
  );
}

/**
 * Проверяет, заполнен ли профиль пользователя
 */
function isProfileComplete(user: User): boolean {
  return !!(
    user.height &&
    user.weight &&
    user.age &&
    user.gender &&
    user.activityLevel &&
    user.goalType &&
    user.targetWeight
  );
}

export default function AppNavigator() {
  const { user, loading, signOut, updateUser, refreshUser } = useAuth();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  useEffect(() => {
    checkOnboardingState();
    setupDeepLinking();
  }, []);

  const setupDeepLinking = () => {
    // Обработка deep links при запуске приложения
    Linking.getInitialURL().then(url => {
      if (url) {
        void handleDeepLink(url);
      }
    });

    // Обработка deep links когда приложение уже запущено
    const subscription = Linking.addEventListener('url', event => {
      void handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  };

  const getDeepLinkParams = (url: string): URLSearchParams => {
    const [basePart, hashPart = ''] = url.split('#');
    const queryPart = basePart.includes('?') ? basePart.split('?')[1] : '';
    const combined = [queryPart, hashPart].filter(Boolean).join('&');
    return new URLSearchParams(combined);
  };

  const handleDeepLink = async (url: string) => {
    console.log('Deep link received:', url);

    const params = getDeepLinkParams(url);
    const linkType = params.get('type');

    // Fallback для старого custom path без query/hash
    if (!linkType) {
      if (url.includes('auth/confirmed')) {
        setShowEmailConfirmation(true);
      }
      return;
    }

    if (linkType !== 'signup' && linkType !== 'recovery' && linkType !== 'magiclink') {
      return;
    }

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!accessToken || !refreshToken) {
      console.error('Auth link is missing access_token or refresh_token');
      return;
    }

    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      console.error('Failed to set auth session from link:', error);
      return;
    }

    if (linkType === 'recovery') {
      setShowResetPassword(true);
      return;
    }

    if (linkType === 'signup') {
      setShowEmailConfirmation(true);
    }

    await refreshUser();
  };

  const checkOnboardingState = async () => {
    try {
      // Проверяем onboarding
      const onboardingComplete = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      setIsOnboardingComplete(onboardingComplete === 'true');
    } catch (error) {
      console.error('Error checking onboarding state:', error);
    } finally {
      setIsCheckingOnboarding(false);
    }
  };

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    setIsOnboardingComplete(true);
    analyticsService.track('onboarding_completed');
  };

  const handleOnboardingSkip = async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    setIsOnboardingComplete(true);
    analyticsService.track('onboarding_skipped');
  };

  const handleAuthSuccess = async () => {
    // Пользователь уже обновлен через AuthContext
    await refreshUser();
  };

  const handleQuestionnaireComplete = async (_updatedUser: User) => {
    await refreshUser();
    analyticsService.track('profile_setup_completed');
  };

  const handleUserUpdate = async (updates: Partial<User>) => {
    await updateUser(updates);
  };

  const handleLogout = async () => {
    await signOut();
  };

  if (loading || isCheckingOnboarding) {
    return <Loading fullScreen text="Загрузка..." />;
  }

  const profileComplete = user ? isProfileComplete(user) : false;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {showResetPassword ? (
          <Stack.Screen name="ResetPassword">
            {() => (
              <ResetPasswordScreen
                onSuccess={async () => {
                  setShowResetPassword(false);
                  await refreshUser();
                }}
                onClose={() => setShowResetPassword(false)}
              />
            )}
          </Stack.Screen>
        ) : showEmailConfirmation ? (
          // Email подтверждение (показывается при переходе по ссылке из письма)
          <Stack.Screen name="EmailConfirmation">
            {() => (
              <EmailConfirmationScreen
                onSuccess={async () => {
                  setShowEmailConfirmation(false);
                  await refreshUser();
                }}
              />
            )}
          </Stack.Screen>
        ) : !isOnboardingComplete ? (
          // Шаг 1: Приветственный экран (показывается только один раз)
          <Stack.Screen name="Onboarding">
            {() => (
              <OnboardingScreen
                onComplete={handleOnboardingComplete}
                onSkip={handleOnboardingSkip}
              />
            )}
          </Stack.Screen>
        ) : !user ? (
          // Шаг 2: Авторизация (если пользователь не залогинен)
          <Stack.Screen name="Auth">
            {() => <AuthScreen onAuthSuccess={handleAuthSuccess} />}
          </Stack.Screen>
        ) : !profileComplete ? (
          // Шаг 3: Анкета профиля (если профиль не заполнен)
          <Stack.Screen name="Questionnaire">
            {() => <OnboardingQuestionnaire user={user} onComplete={handleQuestionnaireComplete} />}
          </Stack.Screen>
        ) : (
          // Шаг 4: Главное приложение (все готово!)
          <Stack.Screen name="Main">
            {() => <MainTabs user={user} onUserUpdate={handleUserUpdate} onLogout={handleLogout} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
