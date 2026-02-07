/**
 * Supabase Edge Function: chat-gpt
 *
 * Обрабатывает запросы к OpenAI GPT-4 для AI диетолога.
 * Требует OPENAI_API_KEY в Supabase Secrets.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Системный промпт для AI диетолога
const SYSTEM_PROMPT = `Ты - опытный персональный диетолог и нутрициолог с глубокими знаниями в области правильного питания, калорийности продуктов и здорового образа жизни.

Твои задачи:
- Отвечать на вопросы о калориях, составе продуктов и питательной ценности
- Помогать составлять планы питания с учетом целей пользователя
- Давать рекомендации по здоровому питанию
- Быть дружелюбным, мотивирующим и поддерживающим

Правила:
- Давай конкретные и точные данные о калориях
- Используй простой язык без сложных терминов
- Всегда упоминай калории в ккал
- Добавляй эмоджи для дружелюбности (🥗🍎🥑🐟🥩🍳 и т.д.)
- Ответы должны быть краткими (2-4 предложения), но информативными
- Если не уверен в точных данных - предупреди об этом

Не медицинский совет: напоминай, что твои рекомендации не заменяют консультацию врача.`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

serve(async req => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Проверка API ключа
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    // Получаем JWT токен из заголовка
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Создаем Supabase клиент для проверки пользователя
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Проверяем авторизацию
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Парсим тело запроса
    const { message, chatHistory = [] } = await req.json();

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid message' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Подготавливаем сообщения для OpenAI
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...chatHistory.slice(-10), // Последние 10 сообщений для контекста
      { role: 'user', content: message },
    ];

    // Запрос к OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Быстрая и экономичная модель
        messages,
        max_tokens: 500, // Ограничиваем длину ответа
        temperature: 0.7, // Баланс между креативностью и точностью
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();

    // Проверяем наличие ответа
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from OpenAI');
    }

    const aiMessage = data.choices[0].message.content;
    const usage = data.usage;

    // Возвращаем ответ
    return new Response(
      JSON.stringify({
        message: aiMessage,
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
