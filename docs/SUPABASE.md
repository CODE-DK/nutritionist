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
yarn install

# Запустите на iOS
yarn ios

# Или на Android
yarn android
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

По умолчанию Supabase требует подтверждение email. Для разработки можно отключить:

1. **Authentication → Settings → Email Auth**
2. Отключите "Enable email confirmations"

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

## Готово! 🎉

Теперь ваше приложение полностью интегрировано с Supabase и готово к использованию.

Следующие шаги:
1. Протестируйте регистрацию и вход
2. Попробуйте отправить сообщение AI диетологу
3. Добавьте прием пищи в дневник
4. Проверьте статистику

Приятной разработки! 🚀
