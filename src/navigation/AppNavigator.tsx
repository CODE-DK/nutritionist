// AppNavigator - главная навигация приложения

import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import OnboardingScreen from '../screens/OnboardingScreen';
import OnboardingQuestionnaire from '../screens/OnboardingQuestionnaire';
import AuthScreen from '../screens/AuthScreen';
import ChatScreen from '../screens/ChatScreen';
import DiaryScreen from '../screens/DiaryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PaywallScreen from '../screens/PaywallScreen';

// Services
import authService from '../services/authService';
import analyticsService from '../services/analyticsService';

// Config
import { Colors } from '../config/theme';
import { STORAGE_KEYS } from '../config/constants';
import type { User } from '../types';
import Loading from '../components/Loading';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tabs Navigator
function MainTabs({ user, onUserUpdate, onLogout }: {
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
        <Tab.Screen
          name="ChatTab"
          options={{ tabBarLabel: 'Чат' }}
        >
          {() => <ChatScreen userId={user.id} onLimitReached={() => setShowPaywall(true)} />}
        </Tab.Screen>

        <Tab.Screen
          name="DiaryTab"
          options={{ tabBarLabel: 'Дневник' }}
        >
          {() => <DiaryScreen userId={user.id} />}
        </Tab.Screen>

        <Tab.Screen
          name="ProfileTab"
          options={{ tabBarLabel: 'Профиль' }}
        >
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
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    checkInitialState();
  }, []);

  const checkInitialState = async () => {
    try {
      // Проверяем onboarding
      const onboardingComplete = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      setIsOnboardingComplete(onboardingComplete === 'true');

      // Проверяем авторизацию
      const user = await authService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        analyticsService.setUserId(user.id);
      }
    } catch (error) {
      console.error('Error checking initial state:', error);
    } finally {
      setIsLoading(false);
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
    const user = await authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      analyticsService.setUserId(user.id);
    }
  };

  const handleQuestionnaireComplete = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    analyticsService.track('profile_setup_completed');
  };

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    analyticsService.clearUserId();
  };

  if (isLoading) {
    return <Loading fullScreen text="Загрузка..." />;
  }

  const profileComplete = currentUser ? isProfileComplete(currentUser) : false;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isOnboardingComplete ? (
          // Шаг 1: Приветственный экран (показывается только один раз)
          <Stack.Screen name="Onboarding">
            {() => (
              <OnboardingScreen
                onComplete={handleOnboardingComplete}
                onSkip={handleOnboardingSkip}
              />
            )}
          </Stack.Screen>
        ) : !currentUser ? (
          // Шаг 2: Авторизация (если пользователь не залогинен)
          <Stack.Screen name="Auth">
            {() => <AuthScreen onAuthSuccess={handleAuthSuccess} />}
          </Stack.Screen>
        ) : !profileComplete ? (
          // Шаг 3: Анкета профиля (если профиль не заполнен)
          <Stack.Screen name="Questionnaire">
            {() => (
              <OnboardingQuestionnaire
                user={currentUser}
                onComplete={handleQuestionnaireComplete}
              />
            )}
          </Stack.Screen>
        ) : (
          // Шаг 4: Главное приложение (все готово!)
          <Stack.Screen name="Main">
            {() => (
              <MainTabs
                user={currentUser}
                onUserUpdate={handleUserUpdate}
                onLogout={handleLogout}
              />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
