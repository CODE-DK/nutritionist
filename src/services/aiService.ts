/**
 * AI Service
 *
 * Сервис для работы с AI диетологом через Supabase Edge Functions.
 * Управляет отправкой запросов к ChatGPT и сохранением истории.
 */

import { supabase } from '../config/supabase';
import type { ChatMessage, AIResponse, ApiError } from '../types';
import { APP_CONFIG } from '../config/constants';

class AIService {
  /**
   * Отправить сообщение AI диетологу
   */
  async sendMessage(
    userId: string,
    message: string,
    chatHistory: ChatMessage[] = []
  ): Promise<AIResponse> {
    try {
      // Валидация
      if (!message || message.trim().length === 0) {
        throw this.createError('Сообщение не может быть пустым', 'EMPTY_MESSAGE');
      }

      if (message.length > APP_CONFIG.MAX_MESSAGE_LENGTH) {
        throw this.createError(
          `Сообщение слишком длинное (макс ${APP_CONFIG.MAX_MESSAGE_LENGTH} символов)`,
          'MESSAGE_TOO_LONG'
        );
      }

      // Проверка лимита запросов
      const canSend = await this.checkAndIncrementLimit(userId);
      if (!canSend) {
        throw this.createError(
          'Вы использовали все бесплатные запросы на сегодня. Перейдите на Premium для безлимитного доступа!',
          'RATE_LIMIT_EXCEEDED'
        );
      }

      // Вызов Edge Function для ChatGPT
      const { data, error } = await supabase.functions.invoke('chat-gpt', {
        body: {
          message,
          chatHistory: chatHistory.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        },
      });

      if (error) throw error;

      const response: AIResponse = {
        message: data.message,
        usage: {
          promptTokens: data.usage?.promptTokens || 0,
          completionTokens: data.usage?.completionTokens || 0,
          totalTokens: data.usage?.totalTokens || 0,
        },
      };

      // Сохраняем в историю чата
      await this.saveChatHistory(userId, message, response.message, response.usage.totalTokens);

      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Получить историю чата
   */
  async getChatHistory(userId: string, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;

      // Преобразуем в формат ChatMessage
      const messages: ChatMessage[] = [];
      (data || []).forEach((item) => {
        messages.push({
          id: `${item.id}-user`,
          role: 'user',
          content: item.message,
          timestamp: item.created_at,
        });
        messages.push({
          id: `${item.id}-assistant`,
          role: 'assistant',
          content: item.response,
          timestamp: item.created_at,
        });
      });

      return messages;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Получить статистику использования AI
   */
  async getUsageStats(userId: string): Promise<{
    count: number;
    limit: number;
    remaining: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('daily_ai_requests, subscription_tier, last_request_date')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Определяем лимит на основе подписки
      const limit = data.subscription_tier === 'premium' ? 100 : APP_CONFIG.FREE_DAILY_AI_LIMIT;

      // Проверяем, нужно ли сбросить счетчик (новый день)
      const today = new Date().toISOString().split('T')[0];
      const lastRequestDate = data.last_request_date;
      const count = lastRequestDate === today ? data.daily_ai_requests : 0;

      const remaining = Math.max(0, limit - count);

      return { count, limit, remaining };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Проверить, достигнут ли лимит
   */
  async hasReachedLimit(userId: string): Promise<boolean> {
    const stats = await this.getUsageStats(userId);
    return stats.remaining === 0;
  }

  /**
   * Очистить историю чата
   */
  async clearChatHistory(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Удалить конкретное сообщение из истории
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Приватные методы

  /**
   * Проверить лимит и увеличить счетчик через RPC функцию
   */
  private async checkAndIncrementLimit(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('check_and_increment_limit', {
        p_user_id: userId,
      });

      if (error) throw error;

      return data === true;
    } catch (error: any) {
      console.error('Error checking limit:', error);
      // В случае ошибки разрешаем запрос (fail-open)
      return true;
    }
  }

  /**
   * Сохранить запись в историю чата
   */
  private async saveChatHistory(
    userId: string,
    message: string,
    response: string,
    tokensUsed: number
  ): Promise<void> {
    try {
      const { error } = await supabase.from('chat_history').insert({
        user_id: userId,
        message,
        response,
        tokens_used: tokensUsed,
      });

      if (error) {
        console.error('Failed to save chat history:', error);
        // Не прерываем выполнение, если не удалось сохранить историю
      }
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }

  /**
   * Создать ошибку
   */
  private createError(message: string, code: string): ApiError {
    return {
      message,
      code,
      statusCode: code === 'RATE_LIMIT_EXCEEDED' ? 429 : 400,
    };
  }

  /**
   * Обработать ошибку от Supabase или Edge Function
   */
  private handleError(error: any): ApiError {
    // Ошибка от Edge Function
    if (error.context?.body) {
      const body = error.context.body;
      return {
        message: body.error || 'Ошибка при обращении к AI',
        code: 'EDGE_FUNCTION_ERROR',
        statusCode: error.context.status || 500,
      };
    }

    // Ошибка лимита
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      return error;
    }

    // Общая ошибка
    return {
      message: error.message || 'Произошла ошибка при работе с AI',
      code: error.code || 'AI_ERROR',
      statusCode: error.status || 500,
    };
  }
}

export default new AIService();
