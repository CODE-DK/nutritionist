# Supabase Edge Functions

Serverless функции для приложения "Персональный Диетолог".

## Структура

```
functions/
├── chat-gpt/           # AI диетолог через OpenAI GPT-4
│   ├── index.ts        # Основная логика
│   └── README.md       # Документация
└── stripe-webhook/     # Обработка Stripe webhooks (TODO)
    ├── index.ts
    └── README.md
```

## Доступные функции

### 1. chat-gpt

**Назначение**: Интеграция с OpenAI для AI диетолога

**Эндпоинт**: `POST /functions/v1/chat-gpt`

**Требования**:
- Авторизация через Supabase Auth
- OPENAI_API_KEY в Secrets

**Подробнее**: [chat-gpt/README.md](./chat-gpt/README.md)

### 2. stripe-webhook (TODO)

**Назначение**: Обработка событий оплаты от Stripe

**Эндпоинт**: `POST /functions/v1/stripe-webhook`

**Требования**:
- STRIPE_SECRET_KEY в Secrets
- STRIPE_WEBHOOK_SECRET в Secrets

## Деплой всех функций

```bash
# Локальная разработка
supabase functions serve

# Деплой в продакшн
supabase functions deploy chat-gpt
supabase functions deploy stripe-webhook

# Просмотр логов
supabase functions logs chat-gpt --tail
```

## Добавление новой функции

```bash
# Создайте новую функцию
supabase functions new my-function

# Отредактируйте index.ts
cd functions/my-function
# ... ваш код ...

# Задеплойте
supabase functions deploy my-function
```

## Секреты

Добавьте необходимые секреты:

```bash
# OpenAI для chat-gpt
supabase secrets set OPENAI_API_KEY=sk-your-key

# Stripe для stripe-webhook
supabase secrets set STRIPE_SECRET_KEY=sk_test_your-key
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your-secret

# Просмотр секретов
supabase secrets list
```

## Локальная разработка

Создайте `.env.local`:

```env
OPENAI_API_KEY=sk-your-openai-key
STRIPE_SECRET_KEY=sk_test_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

Запустите локально:

```bash
supabase functions serve --env-file .env.local
```

## Тестирование

```bash
# Тест chat-gpt
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/chat-gpt' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"message":"Привет!"}'
```

## Мониторинг

1. **Логи в реальном времени**:
   ```bash
   supabase functions logs chat-gpt --tail
   ```

2. **Dashboard**: https://app.supabase.com → Functions → Logs

3. **Метрики**: Project Settings → Usage

## Лимиты

**Free tier**:
- 500,000 вызовов функций/месяц
- 1 GB исходящего трафика
- Таймаут: 150 секунд

**Pro tier** ($25/мес):
- 2,000,000 вызовов/месяц
- 100 GB трафика
- Таймаут: 400 секунд

## Best Practices

1. **Всегда проверяйте авторизацию**:
   ```typescript
   const authHeader = req.headers.get('Authorization');
   const { user } = await supabase.auth.getUser();
   if (!user) return unauthorized();
   ```

2. **Обрабатывайте CORS**:
   ```typescript
   const corsHeaders = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Headers': 'authorization, content-type',
   };
   ```

3. **Логируйте ошибки**:
   ```typescript
   try {
     // ...
   } catch (error) {
     console.error('Function error:', error);
     return errorResponse(error);
   }
   ```

4. **Используйте environment variables**:
   ```typescript
   const API_KEY = Deno.env.get('API_KEY');
   if (!API_KEY) throw new Error('Missing API_KEY');
   ```

5. **Таймауты для внешних API**:
   ```typescript
   const controller = new AbortController();
   const timeout = setTimeout(() => controller.abort(), 5000);

   await fetch(url, { signal: controller.signal });
   ```

## Troubleshooting

### Функция не деплоится

```bash
# Проверьте синтаксис TypeScript
deno check functions/chat-gpt/index.ts

# Проверьте логи
supabase functions logs chat-gpt
```

### Функция возвращает 500

1. Проверьте логи: `supabase functions logs chat-gpt --tail`
2. Убедитесь, что секреты установлены: `supabase secrets list`
3. Проверьте авторизацию в заголовках

### Долгое выполнение

- Используйте async/await правильно
- Добавьте таймауты для внешних API
- Оптимизируйте запросы к БД

## Полезные ссылки

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Runtime](https://deno.land/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
