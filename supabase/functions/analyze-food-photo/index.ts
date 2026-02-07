/**
 * Supabase Edge Function: analyze-food-photo
 *
 * Обрабатывает фото еды через Claude Vision API и возвращает данные о блюде.
 * Требует ANTHROPIC_API_KEY в Supabase Secrets.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.20.0';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Лимиты
const FREE_PHOTO_LIMIT = 5;
const PREMIUM_PHOTO_LIMIT = 999;

// AI Prompt для распознавания еды
const FOOD_RECOGNITION_PROMPT = `Проанализируй это фото еды и верни JSON с данными о блюде.

ВАЖНЫЕ ПРАВИЛА:
1. Если видишь несколько блюд на одной тарелке, суммируй их калорийность
2. Указывай типичные порции для России/СНГ (не США!)
3. Будь консервативен в оценке калорий (лучше чуть больше, чем меньше)
4. Если не уверен - снижай confidence, но всё равно давай оценку
5. Название блюда должно быть на русском языке, понятное пользователю

Примеры хороших названий:
✓ "Овсяная каша с бананом и орехами"
✓ "Куриная грудка с гречкой и овощами"
✓ "Греческий салат"
✗ "Еда" (плохо)
✗ "Meal" (на английском)

ФОРМАТ ОТВЕТА (строго JSON, без markdown):
{
  "dish_name": "Название блюда на русском",
  "calories": 450,
  "protein": 25,
  "carbs": 55,
  "fat": 12,
  "confidence": 0.85,
  "reasoning": "Краткое объяснение: видна порция ~200г куриной грудки (220 ккал), ~150г гречки (180 ккал), овощи ~50 ккал"
}

ШКАЛА CONFIDENCE:
- 0.9-1.0: Отлично видно блюдо, стандартная порция, уверен в оценке
- 0.7-0.9: Хорошо видно, есть небольшие сомнения в размере порции
- 0.5-0.7: Видно что это за блюдо, но размер порции неясен
- 0.3-0.5: Трудно определить точное блюдо или порцию
- <0.3: Вообще непонятно что на фото

ВАЖНО: Даже если confidence низкий, всё равно дай лучшую оценку. Пользователь сможет отредактировать.`;

interface FoodAnalysisResponse {
  dish_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
  reasoning: string;
}

serve(async (req) => {
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
    // 1. Проверка API ключа
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }

    // 2. Получение JWT токена
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // 3. Создание Supabase клиента
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // 4. Проверка авторизации
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

    // 5. Парсинг тела запроса
    const { image, userId } = await req.json();

    if (!image || !userId || userId !== user.id) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 6. Проверка лимита фото
    const canProceed = await checkPhotoLimit(supabase, userId);
    if (!canProceed) {
      return new Response(
        JSON.stringify({
          error: 'Вы использовали все фото на сегодня. Перейдите на Premium для безлимитного доступа!',
          code: 'PHOTO_LIMIT_EXCEEDED',
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 7. Вызов Claude Vision API
    console.log('Calling Claude Vision API...');
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20250219',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: image,
              },
            },
            {
              type: 'text',
              text: FOOD_RECOGNITION_PROMPT,
            },
          ],
        },
      ],
    });

    // 8. Парсинг ответа
    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Извлекаем JSON из ответа (может быть wrapped в markdown)
    let responseText = content.text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      responseText = jsonMatch[0];
    }

    console.log('Claude response:', responseText);

    const result: FoodAnalysisResponse = JSON.parse(responseText);

    // 9. Валидация ответа
    if (!result.dish_name || result.calories === undefined) {
      throw new Error('Invalid response format from AI');
    }

    // Ограничения на значения
    result.calories = Math.max(0, Math.min(5000, result.calories));
    result.protein = Math.max(0, Math.min(500, result.protein || 0));
    result.carbs = Math.max(0, Math.min(500, result.carbs || 0));
    result.fat = Math.max(0, Math.min(500, result.fat || 0));
    result.confidence = Math.max(0, Math.min(1, result.confidence));

    // 10. Увеличение счетчика использования
    await incrementPhotoUsage(supabase, userId);

    // 11. Логирование для аналитики
    await logPhotoAnalysis(supabase, userId, result);

    console.log('Photo analysis successful:', {
      dish: result.dish_name,
      confidence: result.confidence,
    });

    // 12. Возврат результата
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);

    let errorMessage = 'Internal server error';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      // Специфичные ошибки Anthropic
      if (error.message.includes('rate_limit')) {
        errorMessage = 'Слишком много запросов. Попробуйте через минуту.';
        statusCode = 429;
      } else if (error.message.includes('invalid_request')) {
        errorMessage = 'Не удалось обработать фото. Попробуйте другое.';
        statusCode = 400;
      }
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Проверить лимит фото и вернуть true если можно продолжить
 */
async function checkPhotoLimit(supabase: any, userId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];

  // Получаем подписку пользователя
  const { data: userData } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', userId)
    .single();

  const limit = userData?.subscription_tier === 'premium'
    ? PREMIUM_PHOTO_LIMIT
    : FREE_PHOTO_LIMIT;

  // Получаем текущее использование
  const { data: usageData } = await supabase
    .from('photo_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('usage_date', today)
    .single();

  const currentCount = usageData?.count || 0;

  return currentCount < limit;
}

/**
 * Увеличить счетчик использования фото
 */
async function incrementPhotoUsage(supabase: any, userId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  // Используем RPC для атомарной операции
  const { error } = await supabase.rpc('increment_photo_usage', {
    p_user_id: userId,
    p_date: today,
  });

  if (error) {
    console.error('Failed to increment photo usage:', error);
    // Не прерываем процесс
  }
}

/**
 * Логировать анализ фото для аналитики
 */
async function logPhotoAnalysis(
  supabase: any,
  userId: string,
  result: FoodAnalysisResponse
): Promise<void> {
  try {
    await supabase.from('photo_analysis_log').insert({
      user_id: userId,
      dish_name: result.dish_name,
      confidence: result.confidence,
      calories: result.calories,
      analyzed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log photo analysis:', error);
    // Не прерываем процесс
  }
}
