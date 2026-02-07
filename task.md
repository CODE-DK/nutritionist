# Задача: Система ежедневных советов по питанию

**Статус:** TODO
**Приоритет:** Medium
**Оценка:** 6-9 часов (1 спринт)
**Дата создания:** 2026-02-07

---

## 🎯 Цель

Реализовать систему персонализированных ежедневных советов по питанию, которые показываются пользователю при открытии приложения (DiaryScreen). Советы подбираются на основе выбранной диеты и цели пользователя.

**Бизнес-цели:**
- Повысить вовлеченность и удержание пользователей
- Обеспечить образовательную ценность
- Мотивировать придерживаться выбранной диеты

---

## ✅ Что уже готово

### 1. База советов (70 штук!)
```
src/data/tips/
├── nutrition.ts        - 20 советов по питанию
├── hydration.ts        - 10 советов по воде
├── meal-timing.ts      - 10 советов по времени еды
├── food-benefits.ts    - 15 советов о пользе продуктов
└── general.ts          - 15 общих советов
```

### 2. TypeScript типы
```typescript
// src/types/index.ts
export type DietType = 'balanced' | 'calorie_deficit' | 'keto' |
  'low_carb' | 'high_protein' | 'mediterranean' |
  'intermittent_fasting' | 'paleo' | 'vegan' | 'vegetarian';

export interface DailyTip {
  id: string;
  category: 'nutrition' | 'hydration' | 'meal_timing' | 'food_benefits' | 'general';
  dietTypes: DietType[];
  goalTypes?: GoalType[];
  title: string;
  text: string;
  emoji?: string;
}

export interface User {
  // ... существующие поля
  dietType?: DietType;
  showDailyTips?: boolean;
}
```

### 3. Документация
- [**TASK_DAILY_TIPS.md**](docs/TASK_DAILY_TIPS.md) - Полное техническое задание
- [**DAILY_TIPS.md**](docs/DAILY_TIPS.md) - Архитектура системы
- [**NUTRITION.md**](docs/NUTRITION.md) - База знаний по диетам
- [**QUICK_START.md**](src/data/tips/QUICK_START.md) - Как добавлять советы

---

## 🏗️ Что нужно реализовать

### Этап 1: База данных (1 час)

**Файл:** `supabase/migrations/005_add_diet_type.sql`

```sql
-- Добавить поля в таблицу users
ALTER TABLE users ADD COLUMN diet_type TEXT;
ALTER TABLE users ADD COLUMN show_daily_tips BOOLEAN DEFAULT true;

-- Опционально: таблица для трекинга показов
CREATE TABLE daily_tips_shown (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tip_id TEXT NOT NULL,
  shown_at TIMESTAMP DEFAULT NOW(),
  dismissed BOOLEAN DEFAULT false
);

CREATE INDEX idx_tips_shown_user_date ON daily_tips_shown(user_id, shown_at);
```

**Обновить:**
- `src/services/authService.ts` - добавить сохранение `dietType`

---

### Этап 2: Выбор диеты в онбординге (1-2 часа)

**Файл:** `src/screens/OnboardingQuestionnaire.tsx`

**Задача:** Добавить новый шаг выбора диеты между шагами `activity` и `summary`

**UI:**
```
┌─────────────────────────────────────┐
│  Выберите тип питания               │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🍽️  Сбалансированное       │   │
│  │     Для поддержания здоровья│   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🥑  Кето-диета              │   │
│  │     Для быстрого похудения  │   │
│  └─────────────────────────────┘   │
│  ... (еще 8 вариантов)             │
└─────────────────────────────────────┘
```

**10 типов диет:**
1. 🍽️ Сбалансированное питание (balanced)
2. 📉 Дефицит калорий (calorie_deficit)
3. 🥑 Кето-диета (keto)
4. 🥦 Низкоуглеводная (low_carb)
5. 💪 Высокобелковая (high_protein)
6. 🫒 Средиземноморская (mediterranean)
7. ⏰ Интервальное голодание (intermittent_fasting)
8. 🍖 Палео (paleo)
9. 🌱 Веганская (vegan)
10. 🥗 Вегетарианская (vegetarian)

**Обновить:**
- Добавить `diet` в состояние компонента
- Добавить новый step между `activity` и `summary`
- Сохранить `dietType` при `handleComplete`

---

### Этап 3: Сервис для работы с советами (2-3 часа)

**Файл:** `src/services/nutritionTipsService.ts` (СОЗДАТЬ)

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ALL_TIPS } from '../data/tips';
import type { DailyTip, User, DietType, GoalType } from '../types';

interface ShownTipData {
  date: string;
  tipId: string;
  dismissed: boolean;
}

class NutritionTipsService {
  private readonly STORAGE_KEY = 'daily_tip_shown';
  private readonly SHOWN_TIPS_KEY = 'shown_tips_history';

  /**
   * Получить совет дня для пользователя
   */
  async getDailyTip(user: User): Promise<DailyTip | null> {
    // 1. Проверить настройки
    if (user.showDailyTips === false) return null;
    if (!user.dietType) return null;

    // 2. Проверить, показывался ли сегодня совет
    const todayTip = await this.getTodayTip(user.id);
    if (todayTip && !todayTip.dismissed) {
      const tip = ALL_TIPS.find(t => t.id === todayTip.tipId);
      return tip || null;
    }

    // 3. Выбрать новый совет
    const applicableTips = this.getApplicableTips(user);
    if (applicableTips.length === 0) return null;

    // 4. Исключить недавно показанные
    const shownTips = await this.getShownTipsHistory(user.id);
    const recentTipIds = shownTips.slice(-30).map(t => t.tipId);
    const availableTips = applicableTips.filter(
      tip => !recentTipIds.includes(tip.id)
    );

    // 5. Выбрать случайный совет
    const tips = availableTips.length > 0 ? availableTips : applicableTips;
    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    // 6. Сохранить как показанный
    await this.markTipAsShown(user.id, randomTip.id);

    return randomTip;
  }

  /**
   * Получить все подходящие советы для пользователя
   */
  getApplicableTips(user: User): DailyTip[] {
    return this.filterTips(ALL_TIPS, user.dietType!, user.goalType);
  }

  /**
   * Фильтровать советы по диете и цели
   */
  filterTips(
    tips: DailyTip[],
    dietType: DietType,
    goalType?: GoalType
  ): DailyTip[] {
    return tips.filter(tip => {
      const matchesDiet = tip.dietTypes.includes(dietType);
      const matchesGoal = !tip.goalTypes ||
        !goalType ||
        tip.goalTypes.includes(goalType);
      return matchesDiet && matchesGoal;
    });
  }

  /**
   * Получить совет, показанный сегодня
   */
  async getTodayTip(userId: string): Promise<ShownTipData | null> {
    try {
      const data = await AsyncStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
      if (!data) return null;

      const tipData: ShownTipData = JSON.parse(data);
      const today = new Date().toISOString().split('T')[0];

      if (tipData.date === today) {
        return tipData;
      }
      return null;
    } catch (error) {
      console.error('Error getting today tip:', error);
      return null;
    }
  }

  /**
   * Сохранить показанный совет
   */
  async markTipAsShown(userId: string, tipId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const tipData: ShownTipData = {
        date: today,
        tipId,
        dismissed: false,
      };

      await AsyncStorage.setItem(
        `${this.STORAGE_KEY}_${userId}`,
        JSON.stringify(tipData)
      );

      // Добавить в историю
      await this.addToHistory(userId, tipId);
    } catch (error) {
      console.error('Error marking tip as shown:', error);
    }
  }

  /**
   * Отметить совет как закрытый
   */
  async dismissTip(userId: string, tipId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const tipData: ShownTipData = {
        date: today,
        tipId,
        dismissed: true,
      };

      await AsyncStorage.setItem(
        `${this.STORAGE_KEY}_${userId}`,
        JSON.stringify(tipData)
      );
    } catch (error) {
      console.error('Error dismissing tip:', error);
    }
  }

  /**
   * Получить историю показанных советов
   */
  async getShownTipsHistory(userId: string): Promise<Array<{ tipId: string; date: string }>> {
    try {
      const data = await AsyncStorage.getItem(`${this.SHOWN_TIPS_KEY}_${userId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting shown tips history:', error);
      return [];
    }
  }

  /**
   * Добавить в историю показанных советов
   */
  private async addToHistory(userId: string, tipId: string): Promise<void> {
    try {
      const history = await this.getShownTipsHistory(userId);
      const today = new Date().toISOString().split('T')[0];

      history.push({ tipId, date: today });

      // Хранить только последние 100 записей
      const trimmedHistory = history.slice(-100);

      await AsyncStorage.setItem(
        `${this.SHOWN_TIPS_KEY}_${userId}`,
        JSON.stringify(trimmedHistory)
      );
    } catch (error) {
      console.error('Error adding to history:', error);
    }
  }
}

export default new NutritionTipsService();
```

---

### Этап 4: UI компонент карточки (1-2 часа)

**Файл:** `src/components/DailyTipCard.tsx` (СОЗДАТЬ)

```typescript
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import Card from './Card';
import Button from './Button';
import { Typography, Spacing, BorderRadius } from '../config/theme';
import { useTheme } from '../config/ThemeContext';

import type { DailyTip } from '../types';

interface DailyTipCardProps {
  tip: DailyTip;
  onDismiss: () => void;
  onLearnMore?: () => void;
}

export default function DailyTipCard({ tip, onDismiss, onLearnMore }: DailyTipCardProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <Card style={[styles.container, { backgroundColor: theme.surface }]}>
      {/* Заголовок */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.lightbulb}>💡</Text>
          <Text style={[styles.headerTitle, { color: theme.primary }]}>
            {t('tips.dailyTip')}
          </Text>
        </View>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Эмодзи и заголовок совета */}
      <View style={styles.content}>
        {tip.emoji && <Text style={styles.emoji}>{tip.emoji}</Text>}
        <Text style={[styles.tipTitle, { color: theme.text }]}>{tip.title}</Text>
        <Text style={[styles.tipText, { color: theme.textSecondary }]}>{tip.text}</Text>
      </View>

      {/* Кнопки */}
      <View style={styles.actions}>
        <Button
          title={t('tips.gotIt')}
          variant="secondary"
          onPress={onDismiss}
          style={styles.button}
        />
        {onLearnMore && (
          <Button
            title={t('tips.learnMore')}
            onPress={onLearnMore}
            style={styles.button}
          />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lightbulb: {
    fontSize: 20,
    marginRight: Spacing.xs,
  },
  headerTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  content: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  tipTitle: {
    ...Typography.h3,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  tipText: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
  },
});
```

**Добавить в локализацию:**

```typescript
// src/locales/ru.ts
tips: {
  dailyTip: 'Совет дня',
  gotIt: 'Понятно',
  learnMore: 'Подробнее',
}

// src/locales/en.ts
tips: {
  dailyTip: 'Daily Tip',
  gotIt: 'Got it',
  learnMore: 'Learn more',
}
```

---

### Этап 5: Интеграция в DiaryScreen (1 час)

**Файл:** `src/screens/DiaryScreen.tsx`

**Изменения:**

```typescript
// Добавить импорты
import DailyTipCard from '../components/DailyTipCard';
import nutritionTipsService from '../services/nutritionTipsService';

// Добавить в интерфейс props
interface DiaryScreenProps {
  userId: string;
  user: User; // Добавить!
}

// Добавить состояние
const [dailyTip, setDailyTip] = useState<DailyTip | null>(null);
const [tipDismissed, setTipDismissed] = useState(false);

// Добавить загрузку совета
useEffect(() => {
  const loadTip = async () => {
    if (!tipDismissed) {
      const tip = await nutritionTipsService.getDailyTip(user);
      setDailyTip(tip);
    }
  };
  loadTip();
}, [user, tipDismissed]);

// Добавить обработчик закрытия
const handleDismissTip = async () => {
  if (dailyTip) {
    await nutritionTipsService.dismissTip(userId, dailyTip.id);
    analyticsService.track('daily_tip_dismissed', {
      tipId: dailyTip.id,
      category: dailyTip.category,
    });
    setTipDismissed(true);
    setDailyTip(null);
  }
};

// В render добавить карточку
return (
  <SafeAreaView>
    <ScrollView>
      {/* Карточка совета ПЕРЕД StatsCard */}
      {dailyTip && !tipDismissed && (
        <DailyTipCard
          tip={dailyTip}
          onDismiss={handleDismissTip}
        />
      )}

      <StatsCard ... />
      {/* Остальное */}
    </ScrollView>
  </SafeAreaView>
);
```

---

### Этап 6: Настройки в ProfileScreen (30 мин)

**Файл:** `src/screens/ProfileScreen.tsx`

**Добавить:**

```typescript
// В секцию Settings
<Card>
  <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>

  {/* Существующие настройки */}

  {/* Новая настройка */}
  <View style={styles.row}>
    <View style={styles.settingInfo}>
      <Text style={styles.label}>{t('profile.showDailyTips')}</Text>
      <Text style={styles.description}>{t('profile.showDailyTipsDesc')}</Text>
    </View>
    <Switch
      value={user.showDailyTips ?? true}
      onValueChange={handleToggleDailyTips}
    />
  </View>
</Card>

// Обработчик
const handleToggleDailyTips = async (value: boolean) => {
  try {
    const updatedUser = await authService.updateProfile(user.id, {
      showDailyTips: value,
    });
    setUser(updatedUser);

    analyticsService.track(value ? 'daily_tips_enabled' : 'daily_tips_disabled');
  } catch (error) {
    Alert.alert(t('common.error'), t('profile.alerts.updateFailed'));
  }
};
```

**Локализация:**

```typescript
// ru.ts
profile: {
  showDailyTips: 'Советы дня',
  showDailyTipsDesc: 'Показывать ежедневные советы по питанию',
}

// en.ts
profile: {
  showDailyTips: 'Daily Tips',
  showDailyTipsDesc: 'Show daily nutrition tips',
}
```

---

## 📊 Критерии приемки

### Обязательно

- [ ] Пользователь выбирает тип диеты в онбординге
- [ ] При открытии DiaryScreen показывается релевантный совет
- [ ] Совет показывается один раз в день
- [ ] При закрытии совета он скрывается до следующего дня
- [ ] Советы не повторяются минимум 30 дней
- [ ] Можно отключить советы в настройках
- [ ] Работает в светлой и темной теме
- [ ] Локализация на русский и английский

### Желательно

- [ ] Анимация появления карточки
- [ ] Кнопка "Подробнее" (открывает NUTRITION.md)
- [ ] Аналитика просмотров и закрытий

---

## 📈 Метрики успеха

После запуска отслеживать:

1. **% пользователей, которые видят советы**
2. **Среднее время просмотра совета**
3. **% кликов на "Подробнее"**
4. **Влияние на retention (DAU/MAU)**
5. **% отключений советов**

---

## 📚 Ссылки на документацию

- [Полное ТЗ](docs/TASK_DAILY_TIPS.md)
- [Архитектура](docs/DAILY_TIPS.md)
- [База знаний по диетам](docs/NUTRITION.md)
- [Как добавлять советы](src/data/tips/QUICK_START.md)

---

**Создано:** 2026-02-07
**Обновлено:** 2026-02-07
**Автор:** AI Assistant
