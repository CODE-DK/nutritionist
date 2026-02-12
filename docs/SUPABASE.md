# 🚀 Настройка Supabase для проекта

Пошаговая инструкция по настройке Supabase для приложения "Персональный Диетолог".

## Предварительные требования

- Аккаунт на [supabase.com](https://supabase.com)
- Установленный [Supabase CLI](https://supabase.com/docs/guides/cli)
- API ключ от [OpenAI](https://platform.openai.com)

## Шаг 1: Создание проекта

1. Перейдите на [supabase.com](https://app.supabase.com)
2. Нажмите **"New Project"**
3. Заполните:
   - **Name**: personal-dietitian
   - **Database Password**: (сохраните пароль)
   - **Region**: выберите ближайший регион
4. Дождитесь завершения создания проекта (~2 минуты)

## Шаг 2: Получение учетных данных

1. Откройте **Project Settings → API**
2. Скопируйте:
   - **Project URL** (например: `https://xxxxx.supabase.co`)
   - **anon public** ключ (начинается с `eyJ...`)

## Шаг 3: Настройка переменных окружения

Обновите файл `.env` в корне проекта:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
```

## Шаг 4: Выполнение миграции БД

1. Откройте **SQL Editor** в Supabase Dashboard
2. Скопируйте содержимое файла `supabase/migrations/001_initial_fixed.sql`
3. Вставьте в редактор и нажмите **"Run"**
4. Проверьте создание таблиц в **Table Editor**: `users`, `chat_history`, `food_diary`

> **Структура БД:** [DATABASE.md](DATABASE.md)

## Шаг 5: Настройка Supabase CLI

### 5.1 Получение Access Token

1. Откройте https://app.supabase.com/account/tokens
2. Нажмите **"Generate New Token"**
3. Скопируйте токен и добавьте в `.env`:
   ```bash
   SUPABASE_ACCESS_TOKEN=ваш_токен_здесь
   ```

### 5.2 Связывание проекта с CLI

```bash
# Загрузить переменные из .env
source .env

# Войти в Supabase CLI
supabase login --token $SUPABASE_ACCESS_TOKEN

# Связать проект (Project ID из URL: https://app.supabase.com/project/YOUR_PROJECT_ID)
supabase link --project-ref YOUR_PROJECT_ID
```

**Как найти Project ID:**

- Откройте ваш проект в https://app.supabase.com
- Project ID это часть URL: `https://app.supabase.com/project/sltpiyphjwlawrabkcnh`
- В данном случае: `sltpiyphjwlawrabkcnh`

---

## Шаг 6: Настройка Edge Functions

### 6.1 Добавьте API ключи в Secrets

```bash
# OpenAI для chat-gpt
supabase secrets set OPENAI_API_KEY="ваш_openai_api_key"

# Anthropic для analyze-food-photo
supabase secrets set ANTHROPIC_API_KEY="ваш_anthropic_api_key"
```

**Важно:** Используйте значения из `.env`:

- `OPENAI_API_KEY` - для первой команды
- `CLAUDE_API_KEY` - используйте его значение для `ANTHROPIC_API_KEY`

### 6.2 Задеплойте функции

```bash
# Задеплоить обе функции
supabase functions deploy chat-gpt
supabase functions deploy analyze-food-photo

# Проверьте статус
supabase functions list
supabase secrets list
```

### 6.3 Быстрая настройка (всё в одном)

После получения access token и установки в `.env`:

```bash
# Загрузить .env
source .env

# 1. Логин
supabase login --token $SUPABASE_ACCESS_TOKEN

# 2. Связать проект (замените YOUR_PROJECT_ID)
supabase link --project-ref YOUR_PROJECT_ID

# 3. Применить миграции
supabase db push

# 4. Установить секреты
supabase secrets set OPENAI_API_KEY="$OPENAI_API_KEY"
supabase secrets set ANTHROPIC_API_KEY="$CLAUDE_API_KEY"

# 5. Деплой функций
supabase functions deploy chat-gpt
supabase functions deploy analyze-food-photo

# 6. Проверка
supabase functions list
supabase secrets list
```

## Шаг 7: Тест Edge Function

```bash
curl -i --location --request POST \
  'https://your-project.supabase.co/functions/v1/chat-gpt' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "message": "Сколько калорий в банане?"
  }'
```

Ожидаемый ответ:

```json
{
  "message": "Средний банан (120г) содержит около 105 ккал...",
  "usage": {
    "promptTokens": 150,
    "completionTokens": 50,
    "totalTokens": 200
  }
}
```

## Шаг 8: Запуск приложения

```bash
# Установите зависимости (если еще не установлены)
pnpm install

# Запустите на iOS
pnpm ios

# Или на Android
pnpm android
```

## Возможные проблемы и решения

### Ошибка: "Missing authorization header"

**Причина**: Edge Function не получает токен авторизации

**Решение**:

- Проверьте, что вы вошли в систему
- Убедитесь, что токен передается в заголовке `Authorization: Bearer <token>`

### Ошибка: "OPENAI_API_KEY is not set"

**Причина**: Секрет не добавлен в Supabase

**Решение**:

```bash
supabase secrets set OPENAI_API_KEY=sk-your-key
supabase functions deploy chat-gpt
```

### Ошибка: "violates row level security policy"

**Причина**: RLS блокирует запрос

**Решение**:

- Проверьте политики в **Authentication → Policies**
- Убедитесь, что пользователь авторизован
- Проверьте, что `user_id` совпадает с `auth.uid()`

### Таблицы не видны в Table Editor

**Решение**: Выполните миграцию через SQL Editor из файла `supabase/migrations/001_initial_fixed.sql`

## Дополнительные настройки

### Настройка email подтверждения

#### Локальная разработка

Для локальной разработки настройки уже сконфигурированы в `supabase/config.toml`:

```toml
[auth.email]
enable_confirmations = true  # Email подтверждение включено
template = "supabase/templates/confirmation"  # Путь к шаблону
```

**Просмотр писем локально:**

1. Запустите Supabase: `npx supabase start`
2. Откройте Inbucket: http://localhost:54324
3. Зарегистрируйте пользователя в приложении
4. Проверьте письмо в Inbucket

#### Production настройка

**1. Загрузка Email Template:**

1. Откройте проект в [Supabase Dashboard](https://app.supabase.com)
2. Перейдите в **Authentication → Email Templates**
3. Выберите шаблон **Confirm signup**
4. Замените содержимое на HTML из `supabase/templates/confirmation.html`
5. Настройте Subject: `Подтвердите ваш email - Личный Диетолог`
6. Нажмите **Save**

**2. Настройка Redirect URLs:**

В **Authentication → URL Configuration** добавьте:

```
Site URL: https://yourdomain.com
Redirect URLs:
  - https://yourdomain.com/auth/callback
  - yourapp://auth/confirmed
  - yourapp://auth/callback
```

**3. SMTP Provider (опционально):**

Для production рекомендуется настроить SendGrid или Mailgun:

**Project Settings → Auth → SMTP Settings:**
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: [ваш SendGrid API ключ]
Sender email: noreply@yourdomain.com
```

**4. Deep Linking:**

Приложение обрабатывает подтверждение через deep links:
- `yourapp://auth/confirmed` - основной URL для подтверждения
- Показывается экран `EmailConfirmationScreen`
- Автоматический переход в приложение после подтверждения

**Email шаблоны:**
- Русская версия: `supabase/templates/confirmation.html`
- Английская версия: `supabase/templates/confirmation_en.html`

**Переменные в шаблоне:**
- `{{ .ConfirmationURL }}` - ссылка подтверждения
- `{{ .Email }}` - email пользователя
- `{{ .SiteURL }}` - базовый URL

#### Отключение для разработки

Если нужно отключить подтверждение для тестирования:

1. **Authentication → Settings → Email Auth**
2. Отключите "Enable email confirmations"
3. Или в `supabase/config.toml`: `enable_confirmations = false`

### Мониторинг и логи

1. **Logs**: Просмотр логов Edge Functions и SQL запросов
2. **Reports**: Статистика использования БД
3. **Database → Backups**: Автоматические бэкапы

### Лимиты Free tier

- 500 МБ БД
- 2 ГБ файлового хранилища
- 50 ГБ трафика
- 500,000 запросов к Edge Functions

Этого достаточно для разработки и тестирования!

## Полезные ссылки

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/guides/cli)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## 🚨 Troubleshooting

### Проблема: "Email not configured"

**Причина:** Email провайдер не настроен в Supabase Auth.

**Решение (быстрое для разработки):**

1. Откройте [Auth Providers](https://app.supabase.com/project/sltpiyphjwlawrabkcnh/auth/providers)
2. Найдите **Email** в списке
3. Настройте:
   - ✅ **Enable Email provider** - включите
   - ❌ **Confirm email** - ОТКЛЮЧИТЕ для разработки
   - ✅ **Autoconfirm users** - включите
4. Нажмите **Save**

Теперь регистрация будет работать БЕЗ подтверждения email.

**Для production:** Настройте SMTP (SendGrid/Mailgun) в разделе SMTP Settings выше.

### Проблема: "violates row level security policy"

**Причина:** RLS блокирует запрос.

**Решение:**
1. Проверьте политики в Authentication → Policies
2. Убедитесь, что пользователь авторизован
3. Проверьте, что `user_id` совпадает с `auth.uid()`

### Проблема: Edge Function не работает

**Причина:** Секреты не установлены или функция не задеплоена.

**Решение:**
```bash
# Проверьте секреты
supabase secrets list

# Переустановите секреты
supabase secrets set OPENAI_API_KEY="your-key"

# Передеплойте функцию
supabase functions deploy chat-gpt
```

### Проблема: Таблицы не видны в Table Editor

**Решение:** Выполните миграцию через SQL Editor из файла `supabase/migrations/001_initial_fixed.sql`.

### Проблема: "Missing authorization header"

**Причина:** Edge Function не получает токен авторизации.

**Решение:**
- Проверьте, что вы вошли в систему
- Убедитесь, что токен передается в заголовке `Authorization: Bearer <token>`

---

## Готово! 🎉

Теперь ваше приложение полностью интегрировано с Supabase и готово к использованию.

**Следующие шаги:**
1. Протестируйте регистрацию и вход
2. Попробуйте отправить сообщение AI диетологу
3. Добавьте прием пищи в дневник
4. Проверьте статистику

Приятной разработки! 🚀
