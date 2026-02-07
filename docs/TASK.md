# Текущая задача: Улучшение ProfileScreen

**Приоритет:** Средний | **Срок:** 1-2 дня | **Статус:** В работе

---

## Контекст

**Что уже есть (Фаза 1):**
- ✅ База данных: типы User расширены (height, weight, age, gender, goalType, activityLevel, targetWeight)
- ✅ Калькулятор: BMR/TDEE по формуле Mifflin-St Jeor
- ✅ Onboarding: 5-шаговая анкета для новых пользователей
- ✅ Базовые модалки: редактирование имени, веса, калорий, цели

**Что нужно добавить:**
- Секция "Мои показатели" (вес, рост, возраст, пол)
- Секция "Метаболизм" (BMR, TDEE, целевая норма)
- Секция "Прогресс к цели" (progress bar, темп изменения)
- Модалка редактирования физических параметров
- Образовательная модалка о метаболизме

**Зачем:** Сделать профиль информативным, показать пользователю "науку" за калориями, мотивировать прогрессом.

---

## Архитектура решения

### Новые компоненты (3 файла):

```
1. /src/components/EditPhysicalParamsModal.tsx (NEW)
   └─ Редактирование: рост, вес, возраст, пол + авто-пересчет калорий

2. /src/components/MetabolismInfoModal.tsx (NEW)
   └─ Образовательная информация: что такое BMR, TDEE, дефицит

3. /src/components/ProgressCard.tsx (NEW)
   └─ Переиспользуемая карточка с progress bar

Обновить:
4. /src/screens/ProfileScreen.tsx (MODIFY)
   └─ Добавить 3 новые секции между User Info и Subscription
```

### UI структура ProfileScreen:

```
┌─────────────────────────────────┐
│ Header (Avatar + Name)          │
├─────────────────────────────────┤
│ 📊 Мои показатели               │  ← NEW
│   Вес, Рост, Возраст, Пол       │
│   [Редактировать]               │
├─────────────────────────────────┤
│ 🔥 Метаболизм              ℹ️   │  ← NEW
│   BMR, TDEE, Норма, Дефицит    │
├─────────────────────────────────┤
│ 🎯 Прогресс к цели              │  ← NEW
│   ▓▓▓▓░░░░░░ 40%               │
│   Темп, Время до цели           │
├─────────────────────────────────┤
│ 💎 Subscription Card            │
│ ... (existing sections)         │
└─────────────────────────────────┘
```

---

## Шаги реализации

### Шаг 1: Компонент EditPhysicalParamsModal

**Файл:** `/src/components/EditPhysicalParamsModal.tsx` (CREATE)

**Функционал:**
- Форма с 4 полями: рост (100-250 см), вес (30-300 кг), возраст (13-120 лет), пол
- Валидация в реальном времени
- Чекбокс "Пересчитать калории автоматически?"
- При сохранении → вызов onSave с данными + флаг recalculateCalories

**Props:**
```typescript
interface EditPhysicalParamsModalProps {
  visible: boolean;
  user: User;
  onClose: () => void;
  onSave: (updates: {
    height: number;
    weight: number;
    age: number;
    gender: Gender;
    recalculateCalories: boolean;
  }) => void;
}
```

**Переиспользовать:** Button, Input, Modal паттерны из существующих ProfileEditModals.

---

### Шаг 2: Компонент MetabolismInfoModal

**Файл:** `/src/components/MetabolismInfoModal.tsx` (CREATE)

**Содержание:** Образовательная модалка с объяснениями:

1. **BMR** (Базовый метаболизм)
   - "Калории в состоянии покоя для дыхания, кровообращения, температуры тела"

2. **TDEE** (Общий расход)
   - "BMR × коэффициент активности. Включает тренировки и движение"

3. **Целевая норма**
   - Похудение: TDEE - 20%
   - Набор: TDEE + 10%
   - Поддержание: TDEE

4. **Дефицит калорий**
   - "7700 ккал = 1 кг веса"
   - "Безопасная потеря: 0.5-1 кг/неделю"

**UI:** Простая модалка с ScrollView, секции с эмодзи и понятным текстом.

---

### Шаг 3: Компонент ProgressCard

**Файл:** `/src/components/ProgressCard.tsx` (CREATE)

**Назначение:** Переиспользуемая карточка прогресса с animated progress bar.

**Props:**
```typescript
interface ProgressCardProps {
  title: string;
  current: number;
  target: number;
  unit?: string;
  percentage: number;
  estimatedWeeks?: number;
  weeklyChange?: number;
}
```

**Использование:**
```tsx
<ProgressCard
  title="Прогресс к цели"
  current={70}
  target={65}
  unit="кг"
  percentage={30}
  estimatedWeeks={10}
  weeklyChange={0.5}
/>
```

**UI:** Карточка с заголовком, progress bar (анимированный), темп и время до цели.

---

### Шаг 4: Обновить ProfileScreen - добавить секции

**Файл:** `/src/screens/ProfileScreen.tsx` (MODIFY)

**1. Импорты:**
```typescript
import { calculateUserCalories, calculateWeeklyWeightChange, calculateWeeksToGoal } from '../utils/calorieCalculator';
import EditPhysicalParamsModal from '../components/EditPhysicalParamsModal';
import MetabolismInfoModal from '../components/MetabolismInfoModal';
import ProgressCard from '../components/ProgressCard';
```

**2. State:**
```typescript
const [showPhysicalParamsModal, setShowPhysicalParamsModal] = useState(false);
const [showMetabolismInfoModal, setShowMetabolismInfoModal] = useState(false);
```

**3. Расчеты (если профиль заполнен):**
```typescript
const hasCompleteProfile = currentUser.height && currentUser.weight &&
  currentUser.age && currentUser.gender && currentUser.activityLevel && currentUser.goalType;

const metabolismData = hasCompleteProfile ? calculateUserCalories({
  weight: currentUser.weight!,
  height: currentUser.height!,
  age: currentUser.age!,
  gender: currentUser.gender!,
  activityLevel: currentUser.activityLevel!,
  goalType: currentUser.goalType!,
}) : null;

const dailyDeficit = metabolismData ? metabolismData.tdee - metabolismData.targetCalories : 0;
const weeklyChange = calculateWeeklyWeightChange(dailyDeficit);
const weeksToGoal = calculateWeeksToGoal(currentUser.weight!, currentUser.targetWeight!, weeklyChange);
```

**4. Добавить 3 новые секции:**

**Секция 1: Мои показатели**
```tsx
<View style={styles.section}>
  <Text style={styles.sectionTitle}>📊 Мои показатели</Text>
  <View style={styles.statsGrid}>
    <StatRow label="Текущий вес" value={`${currentUser.weight} кг`} />
    <StatRow label="Целевой вес" value={`${currentUser.targetWeight} кг`} badge={`${diff} кг`} />
    <StatRow label="Рост" value={`${currentUser.height} см`} />
    <StatRow label="Возраст" value={`${currentUser.age} лет`} />
    <StatRow label="Пол" value={genderLabel} />
  </View>
  <Button title="Редактировать" onPress={() => setShowPhysicalParamsModal(true)} />
</View>
```

**Секция 2: Метаболизм**
```tsx
{hasCompleteProfile && (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>🔥 Метаболизм</Text>
      <TouchableOpacity onPress={() => setShowMetabolismInfoModal(true)}>
        <Ionicons name="information-circle-outline" size={24} />
      </TouchableOpacity>
    </View>
    <StatRow label="BMR (базовый)" value={`${metabolismData.bmr} ккал/день`} color="green" />
    <StatRow label="TDEE (с активностью)" value={`${metabolismData.tdee} ккал/день`} color="blue" />
    <StatRow label="Ваша норма" value={`${metabolismData.targetCalories} ккал/день`} color="orange" />
    <StatRow label="" value={`(дефицит ${dailyDeficit})`} color="red" />
  </View>
)}
```

**Секция 3: Прогресс**
```tsx
{hasCompleteProfile && currentUser.targetWeight && (
  <ProgressCard
    title="🎯 Прогресс к цели"
    current={currentUser.weight!}
    target={currentUser.targetWeight}
    unit="кг"
    percentage={calculateProgress()}
    estimatedWeeks={weeksToGoal}
    weeklyChange={weeklyChange}
  />
)}
```

**5. Обработчик сохранения:**
```typescript
const handleSavePhysicalParams = async (updates: any) => {
  let finalUpdates = { ...updates };

  if (updates.recalculateCalories) {
    const { targetCalories } = calculateUserCalories({
      weight: updates.weight,
      height: updates.height,
      age: updates.age,
      gender: updates.gender,
      activityLevel: currentUser.activityLevel!,
      goalType: currentUser.goalType!,
    });
    finalUpdates.dailyCalorieGoal = targetCalories;
  }

  await handleUpdateProfile(finalUpdates);
  setShowPhysicalParamsModal(false);
};
```

**6. Модалки в render:**
```tsx
<EditPhysicalParamsModal
  visible={showPhysicalParamsModal}
  user={currentUser}
  onClose={() => setShowPhysicalParamsModal(false)}
  onSave={handleSavePhysicalParams}
/>

<MetabolismInfoModal
  visible={showMetabolismInfoModal}
  onClose={() => setShowMetabolismInfoModal(false)}
/>
```

---

### Шаг 5: Проверка утилит calorieCalculator

**Файл:** `/src/utils/calorieCalculator.ts` (VERIFY)

**Убедиться что есть функции:**
- `calculateUserCalories()` - основной расчет BMR/TDEE/targetCalories
- `calculateWeeklyWeightChange(dailyDeficit)` - темп изменения веса
- `calculateWeeksToGoal(current, target, weeklyChange)` - время до цели

**Если нет - добавить:**
```typescript
export function calculateWeeklyWeightChange(dailyDeficit: number): number {
  // 7700 ккал = 1 кг веса
  return (dailyDeficit * 7) / 7700;
}

export function calculateWeeksToGoal(
  currentWeight: number,
  targetWeight: number,
  weeklyChange: number
): number {
  if (weeklyChange === 0) return Infinity;
  const weightDiff = Math.abs(currentWeight - targetWeight);
  return Math.ceil(weightDiff / Math.abs(weeklyChange));
}
```

---

## Verification (End-to-End)

### Test Case 1: Заполненный профиль
1. Открыть ProfileScreen с пользователем (все поля заполнены)
2. **Expected:** Видны 3 новые секции:
   - 📊 Мои показатели (вес, рост, возраст, пол)
   - 🔥 Метаболизм (BMR, TDEE, норма, дефицит)
   - 🎯 Прогресс (progress bar, темп, время)
3. Tap кнопку ℹ️ в секции Метаболизм
4. **Expected:** Открылась MetabolismInfoModal с объяснениями
5. Закрыть модалку → tap "Редактировать" в секции Мои показатели
6. **Expected:** Открылась EditPhysicalParamsModal с текущими значениями

### Test Case 2: Незаполненный профиль
1. Открыть ProfileScreen с пользователем без height/weight/age
2. **Expected:** Секции "Метаболизм" и "Прогресс" скрыты
3. **Expected:** Видна только секция "Мои показатели" с призывом заполнить

### Test Case 3: Редактирование параметров
1. В EditPhysicalParamsModal изменить вес с 80 кг на 75 кг
2. Включить чекбокс "Пересчитать калории автоматически"
3. Tap "Сохранить"
4. **Expected:**
   - Вес обновился в БД
   - Целевая норма калорий пересчиталась
   - Progress bar обновился (прогресс вырос)
   - Секция "Прогресс" показывает новое время до цели

### Test Case 4: Progress bar анимация
1. Открыть ProfileScreen
2. **Expected:** Progress bar анимированно заполняется от 0% до текущего значения
3. Изменить вес → вернуться на ProfileScreen
4. **Expected:** Progress bar re-анимируется с новым значением

### Test Case 5: Валидация
1. В EditPhysicalParamsModal ввести возраст = 10 (< 13)
2. **Expected:** Показать ошибку "Минимальный возраст: 13 лет"
3. Ввести вес = 500 кг (> 300)
4. **Expected:** Показать ошибку "Максимальный вес: 300 кг"

### Database Verification:
```sql
-- Проверить что данные сохранились
SELECT id, email, height, weight, age, gender, daily_calorie_goal
FROM users
WHERE id = 'user-uuid'
LIMIT 1;
```

### UI Verification:
- Все секции используют theme colors из ThemeContext
- Spacing между элементами согласован (Spacing.sm/md/lg)
- Шрифты соответствуют Typography (h2, h3, body, caption)
- Иконки Ionicons корректно отображаются
- Модалки открываются/закрываются плавно (анимация)

---

## Success Metrics

**Primary:**
- ✓ Все 3 новые секции отображаются корректно
- ✓ Расчеты BMR/TDEE/прогресс математически верны
- ✓ Редактирование параметров → обновление UI в реальном времени

**Secondary:**
- Progress bar анимация работает плавно (60 fps)
- Модалки открываются < 300ms
- Валидация ловит все edge cases (возраст, вес, рост)
- TypeScript errors = 0

---

## Edge Cases

1. **Цель достигнута** (current === target)
   - Показать progress bar 100% + текст "🎉 Цель достигнута!"

2. **Превышение цели** (current < target при похудении)
   - Показать progress bar > 100% + предупреждение "Вы превысили цель"

3. **Нереальный дефицит** (> 1000 ккал/день)
   - Показать предупреждение "⚠️ Слишком большой дефицит. Рекомендуем 500-700 ккал."

4. **Частично заполненный профиль**
   - Graceful degradation: показать только доступные данные
   - Призыв заполнить остальное

---

## Критические файлы

**По приоритету:**

1. **`/src/components/EditPhysicalParamsModal.tsx`** - Основная функциональность редактирования
2. **`/src/screens/ProfileScreen.tsx`** - Интеграция всех компонентов
3. **`/src/components/ProgressCard.tsx`** - Визуальный прогресс (ключевой UX)
4. **`/src/components/MetabolismInfoModal.tsx`** - Образовательная часть
5. **`/src/utils/calorieCalculator.ts`** - Убедиться что утилиты есть

**Порядок реализации:** 1 → 2 → 3 → 4 → 5 (модалка редактирования → интеграция в ProfileScreen → прогресс → инфо → проверка утилит)

---

## Итого: 1-2 дня работы

- **День 1 (4-6 часов):**
  - EditPhysicalParamsModal (1.5ч)
  - MetabolismInfoModal (1ч)
  - ProgressCard (1.5ч)
  - Обновление ProfileScreen (1-2ч)

- **День 2 (2-3 часа):**
  - Тестирование всех сценариев (1ч)
  - Фиксы багов и edge cases (1ч)
  - Финальная полировка UI (0.5-1ч)

**Готов к implementation!** 🚀
