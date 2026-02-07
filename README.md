# 🥗 Персональный Диетолог

React Native приложение с AI-диетологом на базе ChatGPT. Помогает планировать питание, считать калории и достигать целей.

## Стек

- **Frontend**: React Native
- **Backend**: Supabase (PostgreSQL + Edge Functions + Auth)
- **AI**: OpenAI ChatGPT-4
- **Payments**: Stripe

## Быстрый старт

```bash
# Установка
pnpm install
cd ios && pod install && cd ..

# Запуск
pnpm ios      # или
pnpm android
```

## Проверка зависимостей

Рекомендуется регулярно проверять совместимость зависимостей с текущей версией Expo SDK:

```bash
# Проверка совместимости всех зависимостей
npx expo-doctor

# Проверка актуальности версий для текущего SDK
npx expo install --check

# Установка совместимых версий пакетов
npx expo install expo-font expo-camera expo-image-picker
```

**Что проверяет `expo-doctor`:**
- ✅ Совместимость версий пакетов с Expo SDK
- ✅ Наличие обязательных peer dependencies
- ✅ Конфигурация проекта
- ✅ Переменные окружения

**При проблемах:**
1. Удалите `node_modules` и lock-файл: `rm -rf node_modules pnpm-lock.yaml`
2. Переустановите зависимости: `pnpm install`
3. Запустите проверку: `npx expo-doctor`

## Настройка

### 1. Создайте `.env`

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

### 2. Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. Выполните SQL из `supabase/migrations/001_initial.sql`
3. Добавьте в Secrets:
   - `OPENAI_API_KEY`
   - `STRIPE_SECRET_KEY`
4. Задеплойте функции:

```bash
supabase functions deploy chat-gpt
supabase functions deploy stripe-webhook
```

### 3. OpenAI & Stripe

- [OpenAI API](https://platform.openai.com) → получите ключ
- [Stripe](https://stripe.com) → настройте продукт ($9.99/мес)
- Webhook URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`

## Структура

```
checkout/
├── src/
│   ├── screens/       # Экраны (Auth, Chat, Diary)
│   ├── components/    # UI компоненты
│   ├── services/      # API (Supabase, Stripe)
│   └── navigation/    # Навигация
├── docs/              # Документация проекта
│   ├── MVP.md
│   ├── DATABASE.md
│   ├── AGENTS.md
│   └── ...
├── supabase/
│   ├── functions/     # Edge Functions
│   │   ├── chat-gpt/
│   │   └── stripe-webhook/
│   └── migrations/    # SQL
└── README.md          # Этот файл
```

## Функции

**Бесплатно:**

- 5 запросов к AI в день
- Дневник питания
- Подсчет калорий

**Premium ($9.99/мес):**

- Неограниченный AI
- Планы питания
- Аналитика

## Документация

**Проектная документация:**

- [MVP.md](docs/MVP.md) - План минимального продукта
- [DATABASE.md](docs/DATABASE.md) - Структура БД и схема таблиц
- [DESIGN.md](docs/DESIGN.md) - Дизайн система и UI/UX
- [AGENTS.md](docs/AGENTS.md) - AI промпты и настройки
- [TASK.md](docs/TASK.md) - Текущие задачи
- [PLAN.md](docs/PLAN.md) - План разработки

**Настройка окружения:**

- [SETUP.md](docs/SETUP.md) - Запуск приложения
- [ENV.md](docs/ENV.md) - Настройка переменных окружения
- [SUPABASE.md](docs/SUPABASE.md) - Настройка Supabase
- [LOCALIZATION.md](docs/LOCALIZATION.md) - Локализация (ru/en)

**Внешние ресурсы:**

- [Supabase Docs](https://supabase.com/docs)
- [OpenAI API](https://platform.openai.com/docs)

## Лицензия

MIT
