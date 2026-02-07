# Chat GPT Edge Function

Edge Function для интеграции с OpenAI GPT-4 в приложении "Персональный Диетолог".

## Описание

Эта функция обрабатывает запросы к AI диетологу:

- Проверяет авторизацию пользователя
- Отправляет запрос к OpenAI GPT-4o-mini
- Возвращает ответ и статистику использования токенов

## Требования

- **OPENAI_API_KEY** - API ключ OpenAI (добавьте в Supabase Secrets)

## Деплой

```bash
# Добавьте секрет в Supabase
supabase secrets set OPENAI_API_KEY=sk-your-openai-api-key

# Задеплойте функцию
supabase functions deploy chat-gpt

# Проверьте логи
supabase functions logs chat-gpt
```

## Локальная разработка

```bash
# Запустите локально
supabase functions serve chat-gpt --env-file .env.local

# Создайте .env.local с:
OPENAI_API_KEY=sk-your-openai-api-key
```

## Тестирование

```bash
curl -i --location --request POST 'https://your-project.supabase.co/functions/v1/chat-gpt' \
  --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"message":"Сколько калорий в яблоке?"}'
```

## Формат запроса

```json
{
  "message": "Сколько калорий в яблоке?",
  "chatHistory": [
    {
      "role": "user",
      "content": "Привет"
    },
    {
      "role": "assistant",
      "content": "Привет! Я твой AI-диетолог."
    }
  ]
}
```

## Формат ответа

```json
{
  "message": "Среднее яблоко (180г) содержит около 95 ккал...",
  "usage": {
    "promptTokens": 120,
    "completionTokens": 45,
    "totalTokens": 165
  }
}
```

## Стоимость

GPT-4o-mini стоит:

- Input: $0.15 за 1M токенов
- Output: $0.60 за 1M токенов

Средний запрос: ~200 токенов = $0.0001 (~0.01₽)

## Лимиты

- Бесплатная версия: 10 запросов в день
- Premium: 100 запросов в день
- Лимит проверяется функцией `check_and_increment_limit` в БД
