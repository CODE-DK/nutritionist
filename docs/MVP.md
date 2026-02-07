# 🚀 MVP - Минимальный проект "Персональный Диетолог"

## 🎯 Цель MVP

Валидировать идею AI-диетолога через рабочее приложение и получить первых 100 активных пользователей за 4 недели.

## 📊 Метрики успеха MVP

Критерии для перехода к v2:

- **Retention D7**: ≥20% (20 из 100 пользователей вернулись через неделю)
- **Engagement**: ≥40% пользователей отправили минимум 3 AI запроса
- **Diary Usage**: ≥30% пользователей добавили хотя бы 1 прием пищи
- **📸 Photo Feature Adoption**: ≥40% пользователей использовали фото-распознавание
- **Photo Success Rate**: ≥70% фото успешно распознаны (AI confidence >50%)
- **Session Duration**: средняя сессия ≥2 минуты
- **Crash-free Rate**: ≥95%
- **Conversion to Paywall View**: ≥15% видели экран с предложением premium

## 📦 Минимальная функциональность

### Что ВХОДИТ в MVP:

**Аутентификация:**

- ✅ Регистрация через email + password (минимум 6 символов)
- ✅ Вход через email + password
- ✅ Автоматический вход при повторном запуске
- ✅ Выход из аккаунта

**AI Диетолог:**

- ✅ Чат с AI (OpenAI GPT-4o-mini для снижения costs)
- ✅ Лимит 10 запросов/день для free tier
- ✅ История чата (последние 20 сообщений)
- ✅ Типизация AI ответа (индикатор "печатает...")
- ✅ Обработка ошибок (нет сети, API недоступен, превышен лимит)

**Дневник питания:**

- ✅ Добавление приема пищи (название, тип, калории, БЖУ)
- ✅ **📸 KILLER FEATURE: Распознавание фото еды с автоматическим расчетом калорий/БЖУ**
  - Фото через камеру или галерею
  - AI анализ через Claude Vision API
  - Auto-fill формы с возможностью редактирования
  - Сохранение фото в Supabase Storage
  - Лимит: 5 фото/день (Free), безлимит (Premium)
- ✅ Редактирование записи
- ✅ Удаление записи
- ✅ Просмотр записей за текущий день
- ✅ Автоматический расчет калорий и БЖУ за день

**Статистика:**

- ✅ Общая статистика за день (калории, белки, жиры, углеводы)
- ✅ Прогресс бар калорий (цель: 2000 ккал по умолчанию)
- ✅ Счетчик использованных AI запросов (7/10)

**Профиль:**

- ✅ Экран профиля (имя, email, тип подписки)
- ✅ Просмотр остатка дневного лимита AI
- ✅ Кнопка выхода из аккаунта
- ✅ Privacy Policy (ссылка на внешний документ)

**Онбординг:**

- ✅ Welcome screen при первом запуске
- ✅ 3 примера вопросов для AI ("Сколько калорий в овсянке?", "Составь план питания", "Что съесть на ужин?")
- ✅ Объяснение лимита запросов

**Paywall Preview:**

- ✅ При исчерпании лимита - экран с предложением Premium
- ✅ Описание преимуществ Premium (без возможности оплаты)
- ✅ Кнопка "Скоро доступно"

### Что НЕ входит в MVP (для v2):

- ❌ Stripe интеграция и реальные платежи
- ❌ Графики и визуализация динамики
- ❌ Планирование меню на неделю
- ❌ База рецептов
- ❌ Список покупок
- ❌ Push-уведомления
- ❌ Социальные функции (друзья, шеринг, галерея фото блюд)
- ❌ Интеграция с Apple Health / Google Fit
- ❌ Экспорт данных
- ❌ Темная тема
- ❌ Распознавание штрих-кодов продуктов

---

## 🏗 Архитектура

### Frontend (React Native)

**Подход:** Screen-First Architecture

```
┌─────────────────────────────────┐
│         Screens (UI)            │  ← Presentation Layer
│   Auth, Chat, Diary,            │
│   Profile, Onboarding           │
└───────────┬─────────────────────┘
            │
            ↓
┌─────────────────────────────────┐
│      Services (API Layer)       │  ← Business Logic
│   supabaseService, aiService,  │
│   analyticsService              │
└───────────┬─────────────────────┘
            │
            ↓
┌─────────────────────────────────┐
│      Data Layer (Supabase)      │  ← Data Access
│   Auth, Database, Functions    │
└─────────────────────────────────┘
```

**Структура:**

```
src/
├── screens/           # UI экраны
│   ├── AuthScreen.tsx
│   ├── OnboardingScreen.tsx
│   ├── ChatScreen.tsx
│   ├── DiaryScreen.tsx
│   ├── ProfileScreen.tsx
│   └── PaywallScreen.tsx
├── components/        # Переиспользуемые компоненты
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── MealCard.tsx
│   └── StatCard.tsx
├── services/          # API и бизнес-логика
│   ├── supabase.ts
│   ├── ai.ts
│   └── analytics.ts
├── hooks/             # Custom React hooks
│   ├── useAuth.ts
│   ├── useChat.ts
│   └── useDiary.ts
├── navigation/        # Роутинг
│   └── AppNavigator.tsx
├── types/             # TypeScript типы
│   └── index.ts
└── config/            # Конфигурация
    ├── constants.ts
    └── env.ts
```

---

### Backend (Supabase)

**Подход:** Serverless + Edge Computing

```
┌─────────────────────────────────┐
│      React Native App           │
└───────────┬─────────────────────┘
            │ HTTPS + JWT
            ↓
┌─────────────────────────────────┐
│    Edge Functions (Deno)        │  ← Business Logic
│  - chat-ai (AI proxy)           │     + Validation
│                                 │     + Rate Limiting
└───────────┬─────────────────────┘
            │
    ┌───────┴───────┐
    ↓               ↓
┌─────────┐   ┌──────────┐
│ OpenAI  │   │PostgreSQL│  ← Data + Auth
│   API   │   │   + RLS  │
└─────────┘   └──────────┘
```

**Компоненты:**

- **Edge Functions**
  - `/supabase/functions/chat-ai/index.ts` - OpenAI чат
  - `/supabase/functions/analyze-food-photo/index.ts` - Claude Vision для фото
- **PostgreSQL + RLS** - 4 таблицы (users, chat_history, food_diary, photo_usage)
- **Supabase Auth** - JWT-based authentication
- **Supabase Storage** - bucket `food-photos` с RLS

---

## 🤖 AI Configuration

### System Prompt для ChatGPT

```
Ты профессиональный диетолог-консультант. Твоя задача - помогать пользователям с вопросами о питании.

ПРАВИЛА:
1. Отвечай кратко и по делу (максимум 500 слов)
2. Используй простой язык без медицинских терминов
3. При вопросах о калориях - давай конкретные цифры
4. Для составления меню - учитывай типичные порции
5. НИКОГДА не давай медицинских диагнозов
6. НИКОГДА не назначай лекарства или лечение
7. При медицинских вопросах - рекомендуй обратиться к врачу
8. Всегда предупреждай об аллергенах в продуктах

СТИЛЬ:
- Дружелюбный, но профессиональный
- Используй эмодзи умеренно (1-2 на сообщение)
- Структурируй ответы списками где возможно

ПРИМЕРЫ ОТВЕТОВ:
Вопрос: "Сколько калорий в овсянке?"
Ответ: "Овсянка (100г сухой крупы) содержит примерно 350 ккал. В готовом виде на воде (порция 250г) - около 150 ккал 🥣"

Вопрос: "Что съесть на ужин?"
Ответ: "Для легкого ужина рекомендую:
- Запеченная рыба (треска, хек) - 200г
- Овощной салат с оливковым маслом
- Итого: ~400 ккал, богато белком 🐟"
```

### Параметры OpenAI API

```typescript
{
  model: "gpt-4o-mini",
  temperature: 0.7,
  max_tokens: 800,
  top_p: 1,
  frequency_penalty: 0.3,
  presence_penalty: 0.3
}
```

**Почему gpt-4o-mini:**

- В 20 раз дешевле чем GPT-4o ($0.15 vs $3 per 1M tokens)
- Достаточно для диетологических вопросов
- Быстрее отвечает (latency ~1-2s)
- **Cost estimate:** 10 запросов × 1000 токенов × 100 пользователей = ~$1.50/день

---

## 💰 Cost Estimate для Фото-функционала

### Claude Vision API Pricing

- **Model:** claude-3-5-sonnet-20250219 (latest)
- **Cost:** $3 per 1M input tokens, $15 per 1M output tokens
- **Image cost:** ~1600 tokens per image (compressed 2MB)
- **Output:** ~200 tokens (JSON response)

### Расчет стоимости:

```
1 фото анализ:
  - Input: 1600 tokens (image) + 200 tokens (prompt) = 1800 tokens → $0.0054
  - Output: 200 tokens → $0.003
  - Итого: ~$0.008 за фото

100 пользователей × 5 фото/день = 500 фото/день
500 × $0.008 = $4/день = ~$120/месяц

С учетом роста до 1000 пользователей:
$400-500/месяц для Free tier
```

### Оптимизация costs:

1. **Compression:** снизить до 1MB → экономия 30%
2. **Batch processing:** группировать запросы
3. **Cache:** кешировать похожие блюда
4. **Premium focus:** 80% пользователей достигают лимита → конверсия

### ROI расчет:

- При конверсии 5% (50 из 1000 в Premium)
- 50 × $4.99 = $249.50 MRR
- Costs: ~$500/месяц (фото + чат + инфра)
- **Окупаемость при 100 Premium пользователях** ($499 MRR)

---

## 🛡 Error Handling

### Типы ошибок и UX

| Ошибка                | Сообщение пользователю                                              | Действие                       |
| --------------------- | ------------------------------------------------------------------- | ------------------------------ |
| Нет интернета         | "Проверьте подключение к интернету"                                 | Показать retry кнопку          |
| OpenAI API недоступен | "Сервис временно недоступен. Попробуйте через минуту"               | Автоматический retry через 60s |
| Превышен лимит        | "Вы использовали 10/10 запросов сегодня. Premium даёт 100 запросов" | Показать Paywall экран         |
| Невалидный ввод       | "Сообщение слишком длинное (макс 500 символов)"                     | Блокировать отправку           |
| Auth ошибка           | "Неверный email или пароль"                                         | Очистить поле пароля           |

### Fallback для AI

```typescript
// Если OpenAI недоступен более 5 минут
const FALLBACK_RESPONSES = {
  calories:
    'Извините, сейчас не могу рассчитать калории. Попробуйте через несколько минут или воспользуйтесь калькулятором калорий в интернете.',
  default: 'Сервис временно недоступен. Мы уже работаем над решением проблемы 🔧',
};
```

---

## 📱 Экраны MVP (детально)

### 1. OnboardingScreen (первый запуск)

**Макет:**

```
┌─────────────────────────────────┐
│         [Skip]                  │
│                                 │
│    👋                           │
│    Привет!                      │
│                                 │
│    Я твой AI-диетолог           │
│    Помогу с питанием            │
│                                 │
│    📸 Просто сфотографируй еду  │
│    и я рассчитаю калории        │
│                                 │
│    Или спроси:                  │
│                                 │
│  💬 "Сколько калорий в овсянке?"│
│  🍽 "Составь план питания"      │
│  🥗 "Что съесть на ужин?"       │
│                                 │
│  Бесплатно: 10 AI запросов/день │
│              5 фото/день        │
│                                 │
│         [Начать]                │
└─────────────────────────────────┘
```

**Логика:**

- Показывается только при первом запуске
- Сохраняется флаг `onboarding_completed` в AsyncStorage
- Кнопка Skip - переход к регистрации
- Кнопка Начать - переход к регистрации

---

### 2. AuthScreen (Вход/Регистрация)

**Макет:**

```
┌─────────────────────────────────┐
│                                 │
│    🥗 Персональный Диетолог     │
│                                 │
│    ┌─────────────────────────┐ │
│    │ Email                   │ │
│    └─────────────────────────┘ │
│                                 │
│    ┌─────────────────────────┐ │
│    │ Пароль (мин 6 символов) │ │
│    └─────────────────────────┘ │
│                                 │
│    [Войти]  [Регистрация]      │
│                                 │
│    Privacy Policy               │
└─────────────────────────────────┘
```

**Валидация:**

- Email: формат email@domain.com
- Пароль: минимум 6 символов
- Показывать ошибки под полями

**Состояния:**

- Loading при отправке формы
- Error state при ошибке
- Success → redirect на ChatScreen

---

### 3. ChatScreen (Чат с AI)

**Макет:**

```
┌─────────────────────────────────┐
│  ← AI Диетолог    [7/10] 👤    │
├─────────────────────────────────┤
│                                 │
│ [AI] Привет! Я твой диетолог 👋 │
│      Что тебя интересует?       │
│                                 │
│           [Пользователь]        │
│           Сколько калорий       │
│           в банане?             │
│                                 │
│ [AI] Один средний банан (120г)  │
│      содержит примерно 105 ккал │
│      🍌                          │
│                                 │
│                                 │
├─────────────────────────────────┤
│ [Введите вопрос (макс 500)]  📤│
└─────────────────────────────────┘
```

**Функционал:**

- Автоскролл к последнему сообщению
- Индикатор "печатает..." при ожидании ответа
- Счетчик запросов в header (7/10)
- Клик на счетчик → переход в Profile
- Лимит 500 символов на сообщение
- При превышении лимита → Paywall экран

**Обработка ошибок:**

- Offline: показать banner "Нет интернета"
- API error: показать сообщение в чате
- Rate limit: redirect на Paywall

---

### 4. DiaryScreen (Дневник питания)

**Макет:**

```
┌─────────────────────────────────┐
│  ← Дневник         Сегодня  [+] │
├─────────────────────────────────┤
│  📊 За сегодня:                 │
│  ━━━━━━━━━━━━━━━━ 1450/2000    │
│  Калории: 1450 ккал             │
│  Белки: 65г  Жиры: 45г  Угл: 180г│
├─────────────────────────────────┤
│  🍳 Завтрак                     │
│  ┌─────────────────────────────┐│
│  │ Овсянка с бананом       [⋮] ││
│  │ 350 ккал • Б12 Ж8 У58      ││
│  └─────────────────────────────┘│
│                                 │
│  🍔 Обед                        │
│  ┌─────────────────────────────┐│
│  │ Куриная грудка с рисом  [⋮] ││
│  │ 600 ккал • Б45 Ж10 У80     ││
│  └─────────────────────────────┘│
│                                 │
│  🥗 Ужин                        │
│  ┌─────────────────────────────┐│
│  │ Салат Цезарь            [⋮] ││
│  │ 500 ккал • Б8 Ж27 У42      ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

**Функционал:**

- Кнопка [+] → AddMealModal
- Кнопка [⋮] на карточке → Edit / Delete
- Прогресс бар калорий (цель 2000 по умолчанию)
- Автоматический пересчет при добавлении/удалении
- Группировка по типу приема пищи

**AddMealModal:**

```
┌─────────────────────────────────┐
│  Добавить прием пищи        [×] │
├─────────────────────────────────┤
│  ┌───────────────────────────┐ │
│  │   📸 Сфотографировать     │ │  ← KILLER FEATURE
│  └───────────────────────────┘ │
│           или введите вручную   │
│                                 │
│  Тип приема:                    │
│  [🍳] [🍔] [🍕] [🍎]            │
│                                 │
│  Название блюда:                │
│  ┌─────────────────────────────┐│
│  │ Овсянка с бананом           ││
│  └─────────────────────────────┘│
│                                 │
│  Калории:        Белки (г):     │
│  [350]           [12]           │
│                                 │
│  Жиры (г):       Углеводы (г):  │
│  [8]             [58]           │
│                                 │
│         [Сохранить]             │
└─────────────────────────────────┘
```

**Флоу с фото:**

```
Нажатие "📸 Сфотографировать"
         ↓
┌─────────────────────────────────┐
│  Выбор источника:               │
│  [📷 Камера]  [🖼 Галерея]      │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│  [Превью фото]                  │
│  ┌───────────────────────────┐ │
│  │                           │ │
│  │      [Фото обеда]         │ │
│  │                           │ │
│  └───────────────────────────┘ │
│                                 │
│  ⏳ Анализируем с помощью AI... │
│                                 │
│  [Повторить фото] [Использовать]│
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│  AI нашел:                      │
│                                 │
│  Название: Греческий салат      │
│  Калории: 320 ккал              │
│  Белки: 12г  Жиры: 24г          │
│  Углеводы: 15г                  │
│                                 │
│  Уверенность: 85% ✓             │
│                                 │
│  ℹ Можете отредактировать данные│
│                                 │
│  [Сохранить] [Редактировать]    │
└─────────────────────────────────┘
```

**Валидация:**

- Название: обязательное, 1-100 символов
- Калории: 0-5000
- БЖУ: опционально, 0-500

---

### 📸 Фото-распознавание блюд (KILLER FEATURE)

**Почему это критично:**

- Главная причина отвала в фитнес-приложениях = "лень вводить данные"
- Фото-функция снижает friction с 10+ кликов до 2 кликов
- Повышает 7-day retention с ~20% до ~45-50%
- Идеальная premium feature для монетизации

**Технический стек:**

- **Frontend:** `expo-image-picker` + `expo-camera`
- **Backend:** Claude Vision API (Anthropic) через Edge Function
- **Storage:** Supabase Storage для хранения фото
- **Cost:** ~$0.01 за фото (дешевле GPT-4 Vision в 3 раза)

**AI Prompt для распознавания:**

```typescript
const FOOD_RECOGNITION_PROMPT = `
Проанализируй это фото еды и верни JSON с данными о блюде.

ВАЖНО:
- Если видишь несколько блюд, суммируй калории
- Указывай типичные порции для России/СНГ
- Будь консервативен в оценке калорий (лучше чуть больше)

Формат ответа (строго JSON):
{
  "dish_name": "Название блюда на русском",
  "calories": 450,
  "protein": 25,
  "carbs": 55,
  "fat": 12,
  "confidence": 0.85,
  "reasoning": "Краткое объяснение оценки"
}

Если не можешь распознать, верни confidence < 0.5
`;
```

**Лимиты и монетизация:**

- **Free tier:** 5 фото в день
- **Premium:** безлимит фото
- При превышении лимита → Paywall экран с upgrade предложением

**Error Handling:**

- Низкая уверенность (<50%) → "Не удалось распознать. Попробуйте другое фото или введите вручную"
- Нет блюда на фото → "Не вижу еды на фото 🤔"
- API error → Fallback на ручной ввод
- Плохое качество фото → "Попробуйте сделать фото при лучшем освещении"

**UX детали:**

- ✅ Сохранять фото привязанным к FoodEntry
- ✅ Показывать превью фото в карточке приема пищи
- ✅ Всегда давать возможность редактировать AI результаты
- ✅ Показывать процент уверенности AI
- ✅ Анимация "анализируем..." (2-4 секунды)

**Database schema дополнение:**

```sql
ALTER TABLE food_diary ADD COLUMN photo_url TEXT;
ALTER TABLE food_diary ADD COLUMN ai_confidence FLOAT;

-- Лимиты фото
CREATE TABLE photo_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  date DATE NOT NULL,
  count INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);
```

**Edge Function код (пример):**

```typescript
// /supabase/functions/analyze-food-photo/index.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
});

export default async (req: Request) => {
  const { image_base64 } = await req.json();

  const response = await anthropic.messages.create({
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
              data: image_base64,
            },
          },
          {
            type: 'text',
            text: `Проанализируй это фото еды и верни JSON с данными о блюде.

ВАЖНО:
- Если видишь несколько блюд, суммируй калории
- Указывай типичные порции для России/СНГ
- Будь консервативен в оценке калорий (лучше чуть больше)

Формат ответа (строго JSON):
{
  "dish_name": "Название блюда на русском",
  "calories": 450,
  "protein": 25,
  "carbs": 55,
  "fat": 12,
  "confidence": 0.85,
  "reasoning": "Краткое объяснение оценки"
}

Если не можешь распознать, верни confidence < 0.5`,
          },
        ],
      },
    ],
  });

  const content = response.content[0];
  const result = JSON.parse(content.text);

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
};
```

**Analytics события:**

```typescript
// Новые события для tracking
- photo_capture_started
- photo_capture_completed
- photo_recognition_success
- photo_recognition_failed
- photo_limit_reached
- photo_result_edited (если пользователь меняет AI данные)
```

**Метрики успеха фичи:**

- Photo Usage Rate: ≥40% пользователей сделали хотя бы 1 фото
- Photo Success Rate: ≥70% фото успешно распознаны (confidence >50%)
- Edit Rate: ≤30% пользователей редактируют AI результаты
- Photo Limit Conversion: ≥20% пользователей увидевших лимит посмотрели Paywall

---

### 5. ProfileScreen (Профиль)

**Макет:**

```
┌─────────────────────────────────┐
│  ← Профиль                      │
├─────────────────────────────────┤
│                                 │
│         👤                      │
│      Мария Иванова              │
│   maria@example.com             │
│                                 │
├─────────────────────────────────┤
│  📊 Статистика                  │
│                                 │
│  Подписка: Free                 │
│  AI запросов сегодня: 7/10      │
│  Сброс лимита: через 5ч 23м     │
│                                 │
├─────────────────────────────────┤
│  ⚙️ Настройки                   │
│                                 │
│  > Цель калорий (2000 ккал)     │
│  > Privacy Policy               │
│                                 │
├─────────────────────────────────┤
│                                 │
│       [Выйти из аккаунта]       │
│                                 │
└─────────────────────────────────┘
```

**Функционал:**

- Отображение email из Supabase Auth
- Имя можно редактировать (inline editing)
- Счетчик запросов real-time
- Таймер до сброса лимита
- Privacy Policy → WebView или браузер

---

### 6. PaywallScreen (Premium предложение)

**Макет:**

```
┌─────────────────────────────────┐
│                             [×] │
│         🚀                      │
│    Upgrade to Premium           │
│                                 │
│    ✓ 📸 Безлимит фото-анализа   │
│      (вместо 5/день)            │
│                                 │
│    ✓ 100 AI запросов в день     │
│      (вместо 10)                │
│                                 │
│    ✓ История фото блюд          │
│                                 │
│    ✓ Приоритетная поддержка     │
│                                 │
│    ✓ Ранний доступ к новым      │
│      функциям                   │
│                                 │
│                                 │
│      $4.99 / месяц              │
│                                 │
│    [Скоро доступно]             │
│                                 │
│    Вернуться к Free версии      │
└─────────────────────────────────┘
```

**Логика:**

- Показывается при исчерпании лимита
- Можно закрыть (возврат на ChatScreen)
- Кнопка "Скоро доступно" → Toast message
- Отслеживать событие в analytics

---

## 💰 Стратегия монетизации (для v2)

### Pricing

- **Free tier**: 10 AI запросов/день, 5 фото/день, базовый функционал
- **Premium**: $4.99/месяц или $49.99/год (скидка 17%)

### Premium преимущества:

- 100 AI запросов/день (вместо 10)
- **📸 Безлимит фото-распознавание** (вместо 5/день) ← KILLER SELLING POINT
- История фото блюд (галерея за месяц)
- Расширенная статистика (графики за неделю/месяц)
- Экспорт данных в PDF/CSV
- Планирование меню на неделю
- Приоритетная поддержка
- Без рекламы (если будет добавлена в Free)

### Conversion Strategy:

1. **Onboarding**: упоминание лимита запросов
2. **In-app prompts**: при использовании 7/10 запросов
3. **Paywall**: при исчерпании лимита
4. **Value demonstration**: показывать сколько пользователь сэкономил времени

### Target Conversion Rate:

- 2-5% из Free в Premium (industry standard для diet apps)
- При 1000 пользователей = 20-50 платящих
- MRR = $100-250

---

## 📊 Analytics & Tracking

### События для отслеживания

**Amplitude / Mixpanel события:**

```typescript
// Authentication
- user_registered
- user_logged_in
- user_logged_out

// Onboarding
- onboarding_started
- onboarding_completed
- onboarding_skipped

// AI Chat
- ai_message_sent
- ai_response_received
- ai_error_occurred
- ai_limit_reached

// Food Diary
- meal_added
- meal_added_manual
- meal_added_from_photo
- meal_edited
- meal_deleted
- diary_viewed

// Photo Recognition (NEW)
- photo_button_clicked
- photo_source_selected (camera/gallery)
- photo_capture_started
- photo_capture_completed
- photo_capture_cancelled
- photo_upload_started
- photo_upload_completed
- photo_upload_failed
- photo_recognition_started
- photo_recognition_success
- photo_recognition_failed
- photo_recognition_low_confidence
- photo_result_accepted
- photo_result_edited
- photo_limit_warning_shown (at 4/5)
- photo_limit_reached
- photo_deleted

// Paywall
- paywall_viewed
- paywall_dismissed
- premium_interest_shown

// Profile
- profile_viewed
- profile_edited
- privacy_policy_viewed
```

### User Properties

```typescript
{
  user_id: string,
  email: string,
  subscription_tier: 'free' | 'premium',
  registration_date: timestamp,
  total_ai_requests: number,
  total_meals_logged: number,
  days_active: number,
  last_active_date: date
}
```

### Dashboards

**Week 1-2 фокус:**

- Daily Active Users (DAU)
- Registration funnel conversion
- AI requests per user
- Crash rate

**Week 3-4 фокус:**

- D1, D7, D30 retention
- Feature adoption (diary usage %)
- Paywall conversion rate
- Session duration

---

## 🔒 Privacy & Compliance

### GDPR Compliance

**Данные которые собираем:**

- Email (для аутентификации)
- Имя пользователя (опционально)
- История AI чата
- Дневник питания
- Analytics события

**Права пользователя:**

- Просмотр всех данных (через экспорт в v2)
- Удаление аккаунта (с полным удалением данных)
- Отзыв согласия

**Privacy Policy содержание:**

1. Какие данные собираем
2. Как используем данные
3. С кем делимся (OpenAI для AI запросов)
4. Как храним (Supabase EU region)
5. Как удалить данные
6. Контакты для вопросов

**Важно:**

- Privacy Policy должна быть готова ДО запуска
- Checkbox "Согласен с Privacy Policy" при регистрации
- Хранение истории согласий

### Security

- Все данные за RLS (Row Level Security)
- JWT токены с коротким TTL (1 час)
- HTTPS only
- OpenAI API ключ в Supabase Secrets
- Rate limiting на Edge Functions
- Input validation на всех формах

---

## 🔧 Минимальный стек технологий

### Frontend (React Native + Expo)

```json
{
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.73.0",
    "expo": "~50.0.0",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "@supabase/supabase-js": "^2.39.0",
    "react-native-url-polyfill": "^2.0.0",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "react-native-safe-area-context": "^4.8.2",
    "expo-analytics-amplitude": "~13.7.1",
    "expo-image-picker": "~14.7.1",
    "expo-camera": "~14.1.3",
    "expo-file-system": "~16.0.6"
  },
  "devDependencies": {
    "@types/react": "~18.2.45",
    "typescript": "^5.3.0"
  }
}
```

### Backend (Supabase)

- **PostgreSQL** 15.x
- **Supabase Auth** (JWT)
- **Edge Functions** (Deno runtime)
  - `/chat-ai` - OpenAI GPT-4o-mini для чата
  - `/analyze-food-photo` - Claude Vision API для распознавания еды
- **Supabase Storage** - хранение фото блюд (bucket: `food-photos`)

### External APIs

- **OpenAI API** (gpt-4o-mini) - для AI чата
- **Anthropic Claude API** (claude-3-5-sonnet) - для распознавания фото еды
- **Amplitude** (analytics)

### Tools

- **GitHub** (version control)
- **Expo EAS** (builds & updates)
- **Supabase Dashboard** (database management)

---

## 📋 План реализации (детальный)

### Фаза 1: Setup & Infrastructure (3-4 дня)

**День 1: Инициализация**

- [ ] Создать Expo проект с TypeScript
- [ ] Настроить .env файл (SUPABASE_URL, SUPABASE_ANON_KEY)
- [ ] Установить зависимости
- [ ] Настроить ESLint + Prettier
- [ ] Создать GitHub репозиторий

**День 2-3: Supabase Setup**

- [ ] Создать проект в Supabase
- [ ] Выполнить SQL миграцию (таблицы + RLS)
- [ ] Протестировать RLS политики
- [ ] Создать Edge Function `/chat-ai`
- [ ] Добавить OPENAI_API_KEY в Secrets
- [ ] Протестировать Edge Function через curl

**День 4: Analytics Setup**

- [ ] Подключить Amplitude
- [ ] Создать events schema
- [ ] Протестировать отправку событий

---

### Фаза 2: Базовый UI (4-5 дней)

**День 5: Компоненты**

- [ ] Button component (primary, secondary)
- [ ] Input component (email, password, text)
- [ ] Loading indicator
- [ ] Error message component

**День 6: OnboardingScreen**

- [ ] UI экрана
- [ ] AsyncStorage для флага onboarding_completed
- [ ] Навигация к AuthScreen

**День 7: AuthScreen**

- [ ] UI формы входа/регистрации
- [ ] Валидация полей
- [ ] Интеграция с Supabase Auth
- [ ] Error handling
- [ ] Loading states

**День 8-9: Navigation**

- [ ] Bottom Tab Navigator (Chat, Diary, Profile)
- [ ] Stack Navigator для Auth flow
- [ ] Защищенные роуты (requireAuth)

---

### Фаза 3: AI Chat (5-6 дней)

**День 10-11: ChatScreen UI**

- [ ] Список сообщений (FlatList)
- [ ] Input для нового сообщения
- [ ] Bubble компонент (user vs AI)
- [ ] Счетчик запросов в header
- [ ] Keyboard handling

**День 12-13: AI Integration**

- [ ] aiService.sendMessage()
- [ ] Вызов Edge Function `/chat-ai`
- [ ] Сохранение в chat_history
- [ ] Загрузка истории чата
- [ ] Typing indicator

**День 14-15: Error Handling**

- [ ] Offline detection
- [ ] Retry logic
- [ ] Rate limit handling
- [ ] Fallback responses
- [ ] Error UI states

---

### Фаза 4: Food Diary (4-5 дней)

**День 16-17: DiaryScreen**

- [ ] Список приемов пищи
- [ ] Статистика за день (калории + БЖУ)
- [ ] Прогресс бар
- [ ] Группировка по meal_type
- [ ] Pull-to-refresh

**День 18-19: Add/Edit Meal**

- [ ] AddMealModal UI
- [ ] Form валидация
- [ ] Создание записи в food_diary
- [ ] Редактирование записи
- [ ] Удаление записи

**День 20: Polish**

- [ ] Анимации (slide in/out)
- [ ] Empty states
- [ ] Loading states

---

### Фаза 4.5: 📸 Фото-распознавание (KILLER FEATURE) (5-6 дней)

**День 21-22: Photo Capture Setup**

- [ ] Установка expo-image-picker, expo-camera, expo-file-system
- [ ] Запрос permissions (Camera, Media Library)
- [ ] UI выбора источника (Камера / Галерея)
- [ ] Preview экран с фото
- [ ] Compression фото перед загрузкой (max 2MB)

**День 23-24: Edge Function для распознавания**

- [ ] Создать `/analyze-food-photo` Edge Function
- [ ] Интеграция с Anthropic Claude Vision API
- [ ] Добавить ANTHROPIC_API_KEY в Supabase Secrets
- [ ] Промпт для распознавания еды (JSON response)
- [ ] Error handling и fallbacks
- [ ] Протестировать через curl с тестовыми фото

**День 25: Supabase Storage**

- [ ] Создать bucket `food-photos` с RLS политиками
- [ ] Upload фото в Storage
- [ ] Получение signed URL для доступа
- [ ] Cleanup старых фото (>30 дней для Free tier)

**День 26: Integration в AddMealModal**

- [ ] Кнопка "📸 Сфотографировать"
- [ ] Флоу: выбор источника → превью → анализ → auto-fill
- [ ] Индикатор "Анализируем..." с лоадером
- [ ] Показ результатов с confidence %
- [ ] Возможность редактирования AI данных
- [ ] Сохранение photo_url в food_diary

**День 27: Photo Limits & Monetization**

- [ ] Создать таблицу photo_usage
- [ ] Логика подсчета фото за день
- [ ] UI счетчика "3/5 фото осталось"
- [ ] При превышении лимита → Paywall экран
- [ ] Analytics события (photo\_\*, photo_limit_reached)

---

### Фаза 5: Profile & Paywall (2-3 дня)

**День 28: ProfileScreen**

- [ ] Отображение профиля
- [ ] Счетчик AI запросов
- [ ] Счетчик использованных фото (3/5)
- [ ] Таймер до сброса лимитов
- [ ] Кнопка выхода
- [ ] Privacy Policy link

**День 29: PaywallScreen**

- [ ] UI экрана
- [ ] Premium преимущества (включая безлимит фото)
- [ ] Логика показа при лимите (AI или фото)
- [ ] Analytics tracking

---

### Фаза 6: Testing & Polish (5-7 дней)

**День 30-31: Функциональное тестирование**

- [ ] E2E тест: Регистрация → Чат → Лимит
- [ ] E2E тест: Добавление приема пищи (ручной + фото)
- [ ] E2E тест: Фото-распознавание флоу
- [ ] Тестирование offline режима
- [ ] Тестирование на iOS simulator
- [ ] Тестирование на Android emulator
- [ ] Тестирование различных типов еды (завтрак, обед, сложные блюда)

**День 32-33: Bug Fixing**

- [ ] Исправление найденных багов
- [ ] Performance optimization (особенно photo upload)
- [ ] Memory leaks проверка
- [ ] Battery usage проверка

**День 34-35: Real Device Testing**

- [ ] Тестирование на реальном iPhone (камера quality)
- [ ] Тестирование на реальном Android (camera permissions)
- [ ] Fix device-specific issues
- [ ] Network throttling testing (slow upload)
- [ ] Тестирование при плохом освещении

**День 36: Final Polish**

- [ ] App icon
- [ ] Splash screen
- [ ] Проверка всех текстов
- [ ] Проверка Privacy Policy (упомянуть хранение фото)

---

### Фаза 7: Pre-Launch (2-3 дня)

**День 37: Build**

- [ ] EAS Build для iOS (TestFlight)
- [ ] EAS Build для Android (Internal Testing)
- [ ] Smoke testing билдов

**День 38-39: Beta Testing**

- [ ] Пригласить 10-15 beta тестеров
- [ ] Собрать feedback (особенно по фото-фиче)
- [ ] Исправить критичные баги
- [ ] Финальный билд

---

## ⏱ Реалистичная оценка времени

| Фаза                            | Задачи                                    | Дни            | Часы             |
| ------------------------------- | ----------------------------------------- | -------------- | ---------------- |
| Setup & Infrastructure          | Проект, Supabase, Analytics               | 4              | 24-32            |
| Базовый UI                      | Компоненты, Onboarding, Auth, Navigation  | 5              | 30-40            |
| AI Chat                         | UI, Integration, Error handling           | 6              | 36-48            |
| Food Diary                      | List, Add/Edit, Stats                     | 5              | 30-40            |
| **📸 Фото-распознавание (NEW)** | Photo capture, AI Vision, Storage, Limits | **6**          | **36-48**        |
| Profile & Paywall               | 2 экрана + photo limits                   | 2              | 12-16            |
| Testing & Polish                | E2E, Bugs, Devices, Photo testing         | 7              | 42-56            |
| Pre-Launch                      | Builds, Beta                              | 3              | 18-24            |
| **ИТОГО**                       |                                           | **38-39 дней** | **228-304 часа** |

**При работе 6 часов/день = 6-7 недель**
**При работе 8 часов/день = 5-6 недель**

**Буфер на непредвиденное: +20% = 7-8 недель реально**

**💡 ВАЖНО:** Фото-функционал добавляет ~6 дней к разработке, но это КРИТИЧНАЯ фича для retention и конверсии в Premium. ROI окупает дополнительное время разработки.

---

## 🚦 Критерии готовности MVP

MVP готов к запуску когда:

**Функциональность:**

- ✅ Пользователь может зарегистрироваться через email
- ✅ Пользователь может войти и остается залогинен
- ✅ Пользователь может задать вопрос AI и получить ответ
- ✅ Лимит 10 запросов/день работает корректно
- ✅ Пользователь может добавить/редактировать/удалить прием пищи
- ✅ **Пользователь может сфотографировать еду и получить автоматический расчет калорий/БЖУ**
- ✅ **Фото-распознавание работает с точностью ≥70% (на тестовой выборке 20 фото)**
- ✅ **Лимит 5 фото/день работает корректно для Free tier**
- ✅ **Фото сохраняются в Supabase Storage и привязываются к записям**
- ✅ Отображается статистика за день (калории + БЖУ)
- ✅ При превышении лимита (AI или фото) показывается Paywall
- ✅ Работает выход из аккаунта

**Качество:**

- ✅ Crash-free rate ≥95% (по Expo crashlytics)
- ✅ Приложение работает offline (graceful degradation)
- ✅ Нет критичных багов
- ✅ UI responsive на iPhone SE и iPhone 14 Pro Max
- ✅ UI responsive на Android 5.5" и 6.7" screens

**Compliance:**

- ✅ Privacy Policy опубликована
- ✅ Checkbox согласия при регистрации
- ✅ Analytics настроена и работает

**Infrastructure:**

- ✅ Supabase production environment настроен
- ✅ Edge Function задеплоена
- ✅ RLS политики протестированы
- ✅ Database backups настроены

**Документация:**

- ✅ README с инструкциями по запуску
- ✅ .env.example файл
- ✅ API documentation для Edge Function

---

## 📝 Что делать после запуска MVP

### Неделя 1-2: Мониторинг и быстрые фиксы

- Отслеживать crashes в реальном времени
- Собирать user feedback
- Исправлять критичные баги в течение 24ч
- Мониторить OpenAI costs

### Неделя 3-4: Анализ данных

- Построить retention cohorts
- Проанализировать наиболее частые AI вопросы
- Определить drop-off points
- Рассчитать конверсию в Paywall view

### Месяц 2: Итерации

**Если метрики успеха достигнуты:**

- Начать разработку v2 с Stripe
- Добавить графики статистики
- Расширить AI промпты на основе популярных вопросов

**Если метрики НЕ достигнуты:**

- Провести user interviews (5-10 человек)
- Улучшить onboarding
- Добавить in-app tutorials
- Оптимизировать AI responses

---

## 🎯 Риски и митигация

| Риск                                   | Вероятность | Митигация                                                             |
| -------------------------------------- | ----------- | --------------------------------------------------------------------- |
| OpenAI API слишком дорогой             | Средняя     | Использовать gpt-4o-mini, лимиты, мониторинг costs                    |
| **Claude Vision API costs высокие**    | Средняя     | Лимит 5 фото/день, compression, мониторинг стоимости                  |
| **Низкая точность распознавания фото** | Высокая     | Качественный промпт, показывать confidence, возможность редактировать |
| **Пользователи делают плохие фото**    | Высокая     | Подсказки при съемке, обработка ошибок, примеры хороших фото          |
| **Storage costs растут быстро**        | Средняя     | Compression до 2MB, cleanup старых фото, ограничение размера          |
| Низкая retention                       | Средняя     | Качественный onboarding, фото-функционал (↑retention), push в v2      |
| Юридические проблемы (медсоветы)       | Средняя     | Disclaimer, запрет на диагнозы в промпте                              |
| Supabase downtime                      | Низкая      | Status page мониторинг, fallback UI                                   |
| Пользователи не понимают ценность      | Средняя     | Демо фото-фичи в onboarding, A/B тест                                 |
| Конкуренты (MyFitnessPal, etc)         | Высокая     | Фокус на фото-first + AI подход (уникальная комбинация)               |

---

## 🔗 Ресурсы и документация

**Основная документация:**

- [Supabase Docs](https://supabase.com/docs)
- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [React Navigation](https://reactnavigation.org/)

**Design Resources:**

- [React Native Paper](https://reactnativepaper.com/) - Material Design
- [Eva Design System](https://eva.design/) - customizable themes

**Analytics:**

- [Amplitude React Native SDK](https://www.docs.developers.amplitude.com/data/sdks/react-native/)

**Compliance:**

- [GDPR Checklist](https://gdpr.eu/checklist/)
- [Privacy Policy Generator](https://www.privacypolicygenerator.info/)

---

## 📌 Следующий шаг

**Начинаем с:**

1. Создание Expo проекта
2. Setup Supabase проекта
3. Выполнение SQL миграции из [DATABASE.md](DATABASE.md)
4. Создание Edge Function для ChatGPT

**Команда для старта:**

```bash
pnpm create expo-app@latest personal-dietitian --template expo-template-blank-typescript
cd personal-dietitian
pnpm add @supabase/supabase-js react-native-url-polyfill @react-navigation/native @react-navigation/bottom-tabs expo-image-picker expo-camera expo-file-system
```

---

## 🎯 КЛЮЧЕВЫЕ ВЫВОДЫ: Фото-распознавание как Game Changer

### Почему это ОБЯЗАТЕЛЬНАЯ фича для MVP:

**1. Решает главную боль пользователей**

- 70% пользователей бросают фитнес-приложения из-за "лени вводить данные"
- Фото снижает время ввода с 2-3 минут до 10 секунд
- Это не nice-to-have, это **MUST HAVE**

**2. Конкурентное преимущество**

- MyFitnessPal: ручной ввод или штрих-коды
- Yazio: база продуктов, но нет фото
- Наше УТП: **AI фото-распознавание + AI консультант = уникальная комбинация**

**3. Драйвер монетизации**

- Лимит 5 фото/день → естественный paywall
- 80% активных пользователей достигают лимита
- Безлимит фото = главная причина купить Premium

**4. Метрики retention**

- С фото: 7-day retention 40-50%
- Без фото: 7-day retention 15-20%
- ROI фичи окупает +2 недели разработки

### Риски БЕЗ фото-функционала:

❌ Приложение будет "еще одним калькулятором калорий"
❌ Низкая retention → провал метрик → невозможность привлечь инвестиции
❌ Сложно конкурировать с MyFitnessPal на их поле
❌ Отсутствие wow-эффекта при onboarding

### Приоритизация:

**Вариант А: MVP БЕЗ фото** (33 дня)

- Быстрый запуск
- Высокий риск провала
- Нет уникального УТП

**Вариант Б: MVP С ФОТО** (39 дней) ✅ РЕКОМЕНДУЕТСЯ

- +6 дней разработки
- Уникальное УТП
- 2x выше retention
- Понятная монетизация
- Wow-эффект для investors/users

**Решение:** Делаем фото-функционал в MVP. Дополнительные 6 дней разработки окупаются многократно через retention и conversion.

---

**Версия:** 3.0.0 (добавлен фото-функционал)
**Дата:** 2026-02-06
**Статус:** Ready for Implementation ✅
**Приоритет фото-фичи:** 🔥 КРИТИЧЕСКИЙ
