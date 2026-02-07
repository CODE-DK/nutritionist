/**
 * AuthContext - контекст авторизации
 *
 * Управляет состоянием авторизации пользователя во всем приложении.
 * Предоставляет методы для входа, регистрации, выхода и обновления профиля.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import analyticsService from '../services/analyticsService';
import authService from '../services/authService';

import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Проверка текущего пользователя при загрузке
  useEffect(() => {
    checkCurrentUser();

    // Подписка на изменения авторизации
    const { data: authListener } = authService.onAuthStateChange(newUser => {
      setUser(newUser);
      if (newUser) {
        analyticsService.setUserId(newUser.id);
      } else {
        analyticsService.clearUserId();
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  /**
   * Проверить текущего пользователя
   */
  const checkCurrentUser = async () => {
    try {
      setLoading(true);
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        analyticsService.setUserId(currentUser.id);
      }
    } catch (err: any) {
      console.error('Error checking current user:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Вход в систему
   */
  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);

      const { user: newUser } = await authService.signIn(email, password);
      setUser(newUser);

      analyticsService.track('user_logged_in', { email });
      analyticsService.setUserId(newUser.id);
    } catch (err: any) {
      const errorMessage = err.message || 'Ошибка при входе в систему';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Регистрация
   */
  const signUp = async (email: string, password: string, name?: string) => {
    try {
      setError(null);
      setLoading(true);

      const { user: newUser } = await authService.signUp(email, password, name);
      setUser(newUser);

      analyticsService.track('user_registered', { email });
      analyticsService.setUserId(newUser.id);
    } catch (err: any) {
      const errorMessage = err.message || 'Ошибка при регистрации';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Выход из системы
   */
  const signOut = async () => {
    try {
      setError(null);
      setLoading(true);

      await authService.signOut();
      setUser(null);

      analyticsService.track('user_logged_out');
      analyticsService.clearUserId();
    } catch (err: any) {
      const errorMessage = err.message || 'Ошибка при выходе из системы';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Обновить профиль пользователя
   */
  const updateUser = async (updates: Partial<User>) => {
    if (!user) {
      throw new Error('Пользователь не авторизован');
    }

    try {
      setError(null);
      setLoading(true);

      const updatedUser = await authService.updateProfile(user.id, updates);
      setUser(updatedUser);

      analyticsService.track('profile_updated', { updates: Object.keys(updates) });
    } catch (err: any) {
      const errorMessage = err.message || 'Ошибка при обновлении профиля';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Обновить данные текущего пользователя
   */
  const refreshUser = async () => {
    try {
      setError(null);
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (err: any) {
      console.error('Error refreshing user:', err);
      setError(err.message);
    }
  };

  /**
   * Очистить ошибку
   */
  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    updateUser,
    refreshUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Хук для использования контекста авторизации
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export default AuthContext;
