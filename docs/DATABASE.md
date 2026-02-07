# 🗄️ База данных - Структура и схема

## Диаграмма связей (ERD)

```
┌─────────────────────────────┐
│       auth.users            │
│  (Supabase Auth)            │
│ ─────────────────────────   │
│  id (uuid) PK               │
│  email                      │
│  created_at                 │
└──────────────┬──────────────┘
               │
               │ 1
               │
               │ N
┌──────────────┴──────────────┐
│       public.users          │
│ ─────────────────────────   │
│  id (uuid) PK, FK           │◄─────────┐
│  full_name                  │          │
│  subscription_tier          │          │
│  stripe_customer_id         │          │
│  daily_ai_requests          │          │
│  last_request_date          │          │
│  created_at                 │          │
└──────────────┬──────────────┘          │
               │                         │
       ┌───────┴────────┐               │
       │ 1              │ 1             │
       │                │               │
       │ N              │ N             │
┌──────┴────────┐  ┌────┴──────────┐   │
│ chat_history  │  │  food_diary   │   │
│───────────────│  │───────────────│   │
│ id (uuid) PK  │  │ id (uuid) PK  │   │
│ user_id FK ───┼──┤ user_id FK ───┼───┘
│ message       │  │ meal_type     │
│ response      │  │ food_name     │
│ tokens_used   │  │ calories      │
│ created_at    │  │ protein       │
└───────────────┘  │ carbs         │
                   │ fats          │
                   │ meal_date     │
                   │ created_at    │
                   └───────────────┘
```

## Таблицы

### 1. `auth.users` (Supabase Auth)

Управляется Supabase, не изменяется напрямую.

```sql
-- Автоматически создается при регистрации
{
  id: uuid,
  email: string,
  encrypted_password: string,
  created_at: timestamp
}
```

---

### 2. `public.users`

**Назначение:** Профиль пользователя с данными о подписке, лимитах и физических параметрах.

| Поле                 | Тип            | Описание                                            | По умолчанию |
| -------------------- | -------------- | --------------------------------------------------- | ------------ |
| `id`                 | `uuid`         | PK, связь с auth.users                              | -            |
| `full_name`          | `varchar(255)` | Имя пользователя                                    | `null`       |
| `subscription_tier`  | `text`         | free / premium                                      | `'free'`     |
| `stripe_customer_id` | `varchar(255)` | ID клиента в Stripe                                 | `null`       |
| `daily_ai_requests`  | `integer`      | Счетчик запросов за день                            | `0`          |
| `last_request_date`  | `date`         | Дата последнего запроса                             | `null`       |
| `height`             | `integer`      | Рост в см                                           | `null`       |
| `weight`             | `numeric(5,2)` | Текущий вес в кг                                    | `null`       |
| `age`                | `integer`      | Возраст в годах                                     | `null`       |
| `gender`             | `text`         | male / female                                       | `null`       |
| `activity_level`     | `text`         | sedentary / light / moderate / active / very_active | `null`       |
| `goal_type`          | `text`         | lose_weight / maintain / gain_weight                | `null`       |
| `target_weight`      | `numeric(5,2)` | Целевой вес в кг                                    | `null`       |
| `target_calories`    | `integer`      | Целевая норма калорий в день                        | `null`       |
| `created_at`         | `timestamptz`  | Дата регистрации                                    | `now()`      |

**Индексы:**

- `PRIMARY KEY (id)`
- `INDEX ON (stripe_customer_id)` - для быстрого поиска при webhook
- `INDEX ON (subscription_tier, daily_ai_requests)` - для проверки лимитов

**RLS политики:**

```sql
-- Пользователи могут читать только свои данные
CREATE POLICY "Users can read own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Пользователи могут обновлять свои данные
CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);
```

**Пример записи:**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "full_name": "Мария Иванова",
  "subscription_tier": "free",
  "stripe_customer_id": null,
  "daily_ai_requests": 3,
  "last_request_date": "2026-02-06",
  "height": 165,
  "weight": 62.5,
  "age": 28,
  "gender": "female",
  "activity_level": "moderate",
  "goal_type": "lose_weight",
  "target_weight": 58.0,
  "target_calories": 1800,
  "created_at": "2026-02-01T10:00:00Z"
}
```

> **Примечание:** Email хранится только в `auth.users`. Для получения email используйте JOIN или `auth.uid()`.

---

### 3. `chat_history`

**Назначение:** История диалогов с AI-диетологом.

| Поле          | Тип           | Описание                        | По умолчанию         |
| ------------- | ------------- | ------------------------------- | -------------------- |
| `id`          | `uuid`        | PK                              | `uuid_generate_v4()` |
| `user_id`     | `uuid`        | FK → users.id                   | -                    |
| `message`     | `text`        | Вопрос пользователя (макс 5000) | -                    |
| `response`    | `text`        | Ответ AI (макс 10000)           | -                    |
| `tokens_used` | `integer`     | Использовано токенов            | `null`               |
| `created_at`  | `timestamptz` | Время запроса                   | `now()`              |

**Индексы:**

- `PRIMARY KEY (id)`
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
- `INDEX ON (user_id, created_at DESC)` - для быстрой загрузки истории

**RLS политики:**

```sql
-- Пользователи видят только свою историю
CREATE POLICY "Users can read own chat history"
  ON chat_history FOR SELECT
  USING (auth.uid() = user_id);

-- Пользователи могут добавлять в свою историю
CREATE POLICY "Users can insert own chat history"
  ON chat_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Пример записи:**

```json
{
  "id": "223e4567-e89b-12d3-a456-426614174001",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "message": "Сколько калорий в овсянке с бананом?",
  "response": "Овсянка с бананом содержит примерно 350 ккал...",
  "tokens_used": 245,
  "created_at": "2026-02-06T14:30:00Z"
}
```

**Полезные запросы:**

```sql
-- Последние 10 сообщений пользователя
SELECT message, response, created_at
FROM chat_history
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC
LIMIT 10;

-- Общее использование токенов
SELECT SUM(tokens_used) as total_tokens
FROM chat_history
WHERE user_id = 'user-uuid';
```

---

### 4. `food_diary`

**Назначение:** Дневник питания - запись приемов пищи.

| Поле         | Тип            | Описание                     | По умолчанию         |
| ------------ | -------------- | ---------------------------- | -------------------- |
| `id`         | `uuid`         | PK                           | `uuid_generate_v4()` |
| `user_id`    | `uuid`         | FK → users.id                | -                    |
| `meal_type`  | `text`         | breakfast/lunch/dinner/snack | -                    |
| `food_name`  | `varchar(500)` | Название блюда               | -                    |
| `calories`   | `integer`      | Калории (ккал, 0-10000)      | `null`               |
| `protein`    | `numeric(6,2)` | Белки (г, 0-1000)            | `null`               |
| `carbs`      | `numeric(6,2)` | Углеводы (г, 0-1000)         | `null`               |
| `fats`       | `numeric(6,2)` | Жиры (г, 0-1000)             | `null`               |
| `meal_date`  | `date`         | Дата приема пищи             | -                    |
| `created_at` | `timestamptz`  | Время добавления             | `now()`              |

**Индексы:**

- `PRIMARY KEY (id)`
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
- `INDEX ON (user_id, meal_date DESC)` - для быстрой загрузки дневника
- `INDEX ON (user_id, meal_type, meal_date)` - для группировки по типу приема

**RLS политики:**

```sql
-- Пользователи имеют полный доступ к своему дневнику
CREATE POLICY "Users can manage own food diary"
  ON food_diary FOR ALL
  USING (auth.uid() = user_id);
```

**Пример записи:**

```json
{
  "id": "323e4567-e89b-12d3-a456-426614174002",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "meal_type": "breakfast",
  "food_name": "Овсянка с бананом и орехами",
  "calories": 350,
  "protein": 12,
  "carbs": 58,
  "fats": 8,
  "meal_date": "2026-02-06",
  "created_at": "2026-02-06T08:15:00Z"
}
```

**Полезные запросы:**

```sql
-- Дневник за сегодня
SELECT meal_type, food_name, calories, protein, carbs, fats
FROM food_diary
WHERE user_id = 'user-uuid'
  AND meal_date = CURRENT_DATE
ORDER BY created_at;

-- Статистика за день
SELECT
  meal_date,
  COUNT(*) as meals_count,
  SUM(calories) as total_calories,
  SUM(protein) as total_protein,
  SUM(carbs) as total_carbs,
  SUM(fats) as total_fats
FROM food_diary
WHERE user_id = 'user-uuid'
  AND meal_date = CURRENT_DATE
GROUP BY meal_date;

-- Статистика за неделю
SELECT
  meal_date,
  SUM(calories) as daily_calories
FROM food_diary
WHERE user_id = 'user-uuid'
  AND meal_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY meal_date
ORDER BY meal_date DESC;

-- Средние показатели за месяц
SELECT
  AVG(daily_calories) as avg_daily_calories,
  AVG(daily_protein) as avg_daily_protein
FROM (
  SELECT
    meal_date,
    SUM(calories) as daily_calories,
    SUM(protein) as daily_protein
  FROM food_diary
  WHERE user_id = 'user-uuid'
    AND meal_date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY meal_date
) daily_stats;
```

---

## Миграция

Полная SQL миграция в файле: `supabase/migrations/001_initial_fixed.sql`

### Применение миграции

**Способ 1: Через Supabase CLI (рекомендуется)**

```bash
supabase db push
```

**Способ 2: Через Dashboard**

1. Откройте **SQL Editor** в Supabase Dashboard
2. Скопируйте содержимое файла `001_initial_fixed.sql`
3. Вставьте в редактор и нажмите **"Run"**

### Тест функции лимитов

После применения миграции проверьте работу функций:

```sql
-- Проверить функцию проверки лимита
SELECT public.check_and_increment_limit(auth.uid());
```

### Миграция существующей БД

Если у вас уже есть старая версия БД, выполните:

```sql
-- Backup перед применением!
ALTER TABLE public.users DROP COLUMN IF EXISTS email;
ALTER TABLE public.users ALTER COLUMN full_name TYPE varchar(255);
ALTER TABLE public.food_diary ALTER COLUMN food_name TYPE varchar(500);
ALTER TABLE public.users
  ALTER COLUMN subscription_tier SET NOT NULL,
  ALTER COLUMN daily_ai_requests SET NOT NULL;
```

---

**Создание таблиц:**

```sql
-- 1. Создание таблицы users
CREATE TABLE public.users (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name varchar(255),
  subscription_tier text NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'premium')),
  stripe_customer_id varchar(255),
  daily_ai_requests integer NOT NULL DEFAULT 0
    CHECK (daily_ai_requests >= 0),
  last_request_date date,

  -- Физические параметры
  height integer CHECK (height > 0 AND height <= 300),
  weight numeric(5,2) CHECK (weight > 0 AND weight <= 500),
  age integer CHECK (age > 0 AND age <= 150),
  gender text CHECK (gender IN ('male', 'female')),

  -- Цели и активность
  activity_level text CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal_type text CHECK (goal_type IN ('lose_weight', 'maintain', 'gain_weight')),
  target_weight numeric(5,2) CHECK (target_weight > 0 AND target_weight <= 500),
  target_calories integer CHECK (target_calories > 0 AND target_calories <= 10000),

  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Создание таблицы chat_history
CREATE TABLE public.chat_history (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message text NOT NULL CHECK (length(message) > 0 AND length(message) <= 5000),
  response text NOT NULL CHECK (length(response) > 0 AND length(response) <= 10000),
  tokens_used integer CHECK (tokens_used >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Создание таблицы food_diary
CREATE TABLE public.food_diary (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  meal_type text NOT NULL
    CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name varchar(500) NOT NULL CHECK (length(food_name) > 0),
  calories integer CHECK (calories >= 0 AND calories <= 10000),
  protein numeric(6,2) CHECK (protein >= 0 AND protein <= 1000),
  carbs numeric(6,2) CHECK (carbs >= 0 AND carbs <= 1000),
  fats numeric(6,2) CHECK (fats >= 0 AND fats <= 1000),
  meal_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**Индексы:**

```sql
CREATE INDEX idx_chat_history_user_date ON chat_history(user_id, created_at DESC);
CREATE INDEX idx_food_diary_user_date ON food_diary(user_id, meal_date DESC);
CREATE INDEX idx_food_diary_user_type_date ON food_diary(user_id, meal_type, meal_date);
CREATE INDEX idx_users_stripe ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_users_subscription_limits ON users(subscription_tier, daily_ai_requests);
```

**Row Level Security:**

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_diary ENABLE ROW LEVEL SECURITY;

-- Политики описаны выше для каждой таблицы
```

---

## Триггеры

### Автоматическое создание профиля при регистрации

```sql
-- Функция для создания профиля
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер на auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Сброс счетчика запросов каждый день

```sql
-- Функция для автоматического сброса дневных лимитов
CREATE OR REPLACE FUNCTION public.reset_daily_limits()
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET daily_ai_requests = 0
  WHERE last_request_date < CURRENT_DATE
    AND last_request_date IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для проверки и обновления лимита при запросе
CREATE OR REPLACE FUNCTION public.check_and_increment_limit(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_tier text;
  v_current_requests integer;
  v_last_date date;
  v_limit integer;
BEGIN
  -- Получаем данные пользователя
  SELECT subscription_tier, daily_ai_requests, last_request_date
  INTO v_tier, v_current_requests, v_last_date
  FROM public.users
  WHERE id = p_user_id;

  -- Определяем лимит (free: 10, premium: 100)
  v_limit := CASE v_tier WHEN 'premium' THEN 100 ELSE 10 END;

  -- Если новый день - сбрасываем счетчик
  IF v_last_date IS NULL OR v_last_date < CURRENT_DATE THEN
    UPDATE public.users
    SET daily_ai_requests = 1,
        last_request_date = CURRENT_DATE
    WHERE id = p_user_id;
    RETURN true;
  END IF;

  -- Проверяем лимит
  IF v_current_requests >= v_limit THEN
    RETURN false;
  END IF;

  -- Увеличиваем счетчик
  UPDATE public.users
  SET daily_ai_requests = daily_ai_requests + 1,
      last_request_date = CURRENT_DATE
  WHERE id = p_user_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Использование в приложении:**

```typescript
// Проверка лимита перед AI-запросом
const { data, error } = await supabase.rpc('check_and_increment_limit', {
  p_user_id: userId,
});

if (!data) {
  throw new Error('Достигнут дневной лимит запросов');
}
```

---

## Примеры использования

### Создание нового пользователя

```typescript
// Регистрация через Supabase Auth
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});

// Профиль создается автоматически через триггер
// Email доступен через auth.users, не дублируется в public.users
```

### Получение профиля с email

```typescript
// Вариант 1: Использовать auth.getUser()
const {
  data: { user },
} = await supabase.auth.getUser();
const email = user?.email;

// Получить профиль
const { data: profile } = await supabase.from('users').select('*').eq('id', user?.id).single();

// Вариант 2: JOIN через SQL (если нужно)
const { data } = await supabase
  .from('users')
  .select(
    `
    *,
    email:auth.users(email)
  `
  )
  .eq('id', userId)
  .single();
```

### Добавление приема пищи

```typescript
const { data, error } = await supabase.from('food_diary').insert({
  meal_type: 'breakfast',
  food_name: 'Овсянка с бананом',
  calories: 350,
  protein: 12,
  carbs: 58,
  fats: 8,
  meal_date: new Date().toISOString().split('T')[0],
});
```

### Получение статистики за день

```typescript
const { data, error } = await supabase
  .from('food_diary')
  .select('calories, protein, carbs, fats')
  .eq('meal_date', new Date().toISOString().split('T')[0]);

const totals = data.reduce(
  (acc, meal) => ({
    calories: acc.calories + (meal.calories || 0),
    protein: acc.protein + (meal.protein || 0),
    carbs: acc.carbs + (meal.carbs || 0),
    fats: acc.fats + (meal.fats || 0),
  }),
  { calories: 0, protein: 0, carbs: 0, fats: 0 }
);
```

---

## Расширения для будущих версий

### v1.1 - Завершено ✅

Физические параметры и цели пользователя добавлены в таблицу users.

### v1.2 - Рецепты

```sql
CREATE TABLE recipes (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  description text,
  instructions text,
  calories integer,
  protein numeric,
  carbs numeric,
  fats numeric,
  prep_time integer, -- минуты
  created_at timestamptz DEFAULT now()
);

CREATE TABLE recipe_ingredients (
  id uuid PRIMARY KEY,
  recipe_id uuid REFERENCES recipes(id),
  ingredient text NOT NULL,
  quantity text
);
```

### v1.3 - Сохраненные планы питания

```sql
CREATE TABLE meal_plans (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  name text NOT NULL,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE meal_plan_items (
  id uuid PRIMARY KEY,
  meal_plan_id uuid REFERENCES meal_plans(id),
  day_number integer, -- 1-7
  meal_type text,
  food_name text,
  calories integer
);
```

---

**Версия:** 1.1.0
**Последнее обновление:** 2026-02-06

**История изменений:**

- v1.1.0: Добавлены физические параметры (рост, вес, возраст, пол), цели и уровень активности
- v1.0.0: Базовая структура (users, chat_history, food_diary)
