# План реализации: Фото-распознавание еды (KILLER FEATURE)

## Контекст

**Проблема:** Проект имеет базовый функционал дневника питания, но пользователи вводят еду вручную. Согласно исследованиям, 70% пользователей бросают фитнес-приложения из-за "лени вводить данные". Текущая retention составляет ~15-20%.

**Решение:** Добавить фото-распознавание еды через Claude Vision API, которое автоматически определяет блюдо и рассчитывает калории/БЖУ. Это снизит friction с 10+ кликов до 2 кликов и повысит 7-day retention до 40-50%.

**Бизнес-ценность:**
- Retention: 15-20% → 40-50% (2.5x improvement)
- Монетизация: лимит 5 фото/день для Free → естественный paywall для Premium
- УТП: Уникальная комбинация AI фото + AI консультант (конкуренты так не умеют)
- ROI: Окупается при 100 Premium пользователях ($499 MRR vs ~$500/мес costs)

**Риски без фото:** Приложение будет "еще одним калькулятором калорий" с низкой retention и провалом метрик.

---

## Архитектура решения

### Компоненты (5 критических файлов):

```
1. Frontend Service: /src/services/photoService.ts (NEW)
   └─ Логика: capture, compress, upload, analyze

2. Frontend UI: /src/components/PhotoCaptureModal.tsx (NEW)
   └─ Флоу: выбор источника → превью → анализ → результаты

3. Integration: /src/components/AddMealModal.tsx (MODIFY)
   └─ Добавить: кнопку фото, счетчик лимита, auto-fill

4. Backend: /supabase/functions/analyze-food-photo/index.ts (NEW)
   └─ Edge Function: JWT auth → Claude Vision API → JSON response

5. Database: /supabase/migrations/003_add_photo_support.sql (NEW)
   └─ Расширить: food_diary + photo_usage table + RLS policies
```

### Поток данных:

```
User taps "📸 Сфотографировать"
  ↓
PhotoCaptureModal: выбор Камера/Галерея (expo-image-picker)
  ↓
photoService.compressImage(): resize до 1024px, quality 0.8
  ↓
photoService.imageToBase64(): конвертация для API
  ↓
Edge Function /analyze-food-photo:
  - JWT auth
  - Check photo limit (5/day Free)
  - Claude Vision API call
  - Parse JSON: dish_name, calories, protein, carbs, fat, confidence
  - Increment usage counter
  ↓
AddMealModal: auto-fill формы с результатами
  ↓
photoService.uploadToStorage(): async upload в food-photos bucket
  ↓
diaryService.addMeal(): save с photo_url + ai_confidence
```

---

## Шаг 1: Установка зависимостей

**Задача:** Добавить библиотеки для работы с фото и AI.

```bash
npx expo install expo-image-picker expo-camera expo-file-system
npm install @anthropic-ai/sdk
```

**Обновить:** `/package.json` будет содержать новые dependencies.

**Проверка:** `npm list expo-image-picker` должен показать версию.

---

## Шаг 2: Database миграция

**Файл:** `/supabase/migrations/003_add_photo_support.sql` (CREATE)

**Содержание:**
1. Расширить `food_diary`:
   ```sql
   ALTER TABLE food_diary
     ADD COLUMN photo_url TEXT,
     ADD COLUMN ai_confidence FLOAT CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
     ADD COLUMN ai_reasoning TEXT;
   ```

2. Создать таблицу `photo_usage` для лимитов:
   ```sql
   CREATE TABLE photo_usage (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     usage_date DATE NOT NULL,
     count INTEGER DEFAULT 0 CHECK (count >= 0),
     UNIQUE(user_id, usage_date)
   );
   ```

3. RLS policies:
   - `food_diary`: существующая policy уже покрывает новые колонки
   - `photo_usage`: user can SELECT own records
   - Storage bucket `food-photos`: user can INSERT/SELECT/DELETE only own folder

4. PostgreSQL Function:
   ```sql
   CREATE FUNCTION increment_photo_usage(p_user_id UUID, p_date DATE)
   RETURNS void AS $$
   BEGIN
     INSERT INTO photo_usage (user_id, usage_date, count) VALUES (p_user_id, p_date, 1)
     ON CONFLICT (user_id, usage_date) DO UPDATE SET count = photo_usage.count + 1;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

5. Индексы:
   ```sql
   CREATE INDEX idx_food_diary_photo ON food_diary(user_id, photo_url) WHERE photo_url IS NOT NULL;
   CREATE INDEX idx_photo_usage_user_date ON photo_usage(user_id, usage_date DESC);
   ```

**Применить:**
```bash
cd supabase
supabase db push
```

**Проверка:** `supabase db diff` должен показать новые колонки и таблицу.

---

## Шаг 3: Supabase Storage setup

**Задача:** Создать bucket для фото через Supabase Dashboard.

**Через Dashboard:**
1. Storage → Create Bucket → Name: `food-photos`, Public: true
2. SQL Editor → Run policies:
   ```sql
   CREATE POLICY "Users upload to own folder" ON storage.objects FOR INSERT
     WITH CHECK (bucket_id = 'food-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

   CREATE POLICY "Users read own photos" ON storage.objects FOR SELECT
     USING (bucket_id = 'food-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

   CREATE POLICY "Users delete own photos" ON storage.objects FOR DELETE
     USING (bucket_id = 'food-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```

**Bucket settings:**
- Max file size: 2MB
- Allowed MIME types: image/jpeg, image/png

**Проверка:** Storage → food-photos bucket должен существовать.

---

## Шаг 4: Edge Function для Claude Vision

**Файл:** `/supabase/functions/analyze-food-photo/index.ts` (CREATE)

**Структура:** Скопировать паттерн из `/supabase/functions/chat-gpt/index.ts`:
- CORS handling (OPTIONS preflight)
- JWT auth через `supabase.auth.getUser()`
- Error handling на всех уровнях

**Специфика:**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.20.0';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

serve(async (req) => {
  // 1. CORS + JWT auth (как в chat-gpt)
  // 2. Parse body: { image: base64, userId: uuid }
  // 3. Check photo limit: call checkPhotoLimit()
  // 4. Claude Vision API call:
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20250219',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
        { type: 'text', text: FOOD_RECOGNITION_PROMPT }
      ]
    }]
  });
  // 5. Parse JSON response (extract from markdown if needed)
  // 6. Validate: dish_name required, calories 0-5000, confidence 0-1
  // 7. Increment usage: await supabase.rpc('increment_photo_usage')
  // 8. Return JSON: { dish_name, calories, protein, carbs, fat, confidence, reasoning }
});
```

**Промпт:**
```typescript
const FOOD_RECOGNITION_PROMPT = `Проанализируй это фото еды и верни JSON с данными о блюде.

ВАЖНО:
- Если видишь несколько блюд, суммируй калории
- Указывай типичные порции для России/СНГ
- Будь консервативен в оценке калорий (лучше больше)

ФОРМАТ (строго JSON без markdown):
{
  "dish_name": "Название на русском",
  "calories": 450,
  "protein": 25,
  "carbs": 55,
  "fat": 12,
  "confidence": 0.85,
  "reasoning": "Краткое объяснение оценки"
}

Если confidence < 0.3, всё равно дай оценку (пользователь сможет отредактировать).`;
```

**Deploy:**
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy analyze-food-photo
```

**Проверка:**
```bash
curl -i --location --request POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/analyze-food-photo' \
  --header 'Authorization: Bearer YOUR_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{"image": "base64...", "userId": "uuid"}'
```

---

## Шаг 5: Frontend Service (photoService.ts)

**Файл:** `/src/services/photoService.ts` (CREATE)

**Основные методы:**

```typescript
class PhotoService {
  // 1. Permissions
  async requestCameraPermission(): Promise<boolean>
  async requestMediaLibraryPermission(): Promise<boolean>

  // 2. Capture/Pick
  async capturePhoto(): Promise<string | null>  // expo-image-picker.launchCameraAsync
  async pickFromGallery(): Promise<string | null>  // expo-image-picker.launchImageLibraryAsync

  // 3. Processing
  async compressImage(uri: string, maxSizeBytes = 2MB): Promise<string>  // resize 1024px, quality 0.8
  async imageToBase64(uri: string): Promise<string>  // FileSystem.readAsStringAsync

  // 4. API calls
  async analyzeFood(photoUri: string, userId: string): Promise<PhotoAnalysisResult> {
    // - compressImage()
    // - imageToBase64()
    // - supabase.functions.invoke('analyze-food-photo')
    // - uploadToStorage() (async, non-blocking)
    // - return { dishName, calories, protein, carbs, fat, confidence, reasoning, photoUri, photoUrl }
  }

  async uploadToStorage(uri: string, userId: string): Promise<string> {
    // - fetch(uri) → blob
    // - supabase.storage.from('food-photos').upload(`${userId}/${timestamp}.jpg`, blob)
    // - return publicUrl
  }

  // 5. Limits
  async getPhotoUsage(userId: string): Promise<{ current, limit, remaining }>
  async canTakePhoto(userId: string): Promise<boolean>

  // 6. Cleanup
  async cleanupOldPhotos(userId: string, daysToKeep = 30): Promise<void>
}
```

**Error handling:** Wrap в try-catch, возвращать ApiError с code:
- `CAMERA_PERMISSION_DENIED`
- `LOW_CONFIDENCE` (< 0.3)
- `PHOTO_LIMIT_EXCEEDED`
- `NETWORK_ERROR`
- `EDGE_FUNCTION_ERROR`

**Использовать существующие паттерны:**
- Error handling как в `/src/services/aiService.ts`
- API calls через `supabase.functions.invoke()` как в aiService
- Типы из `/src/types/index.ts`

---

## Шаг 6: Frontend UI (PhotoCaptureModal)

**Файл:** `/src/components/PhotoCaptureModal.tsx` (CREATE)

**Props:**
```typescript
interface PhotoCaptureModalProps {
  visible: boolean;
  onClose: () => void;
  onPhotoSelected: (result: PhotoAnalysisResult) => void;
}
```

**States:**
- `idle`: показать кнопки "📷 Камера" / "🖼 Галерея"
- `capturing`: expo-image-picker open (handled by OS)
- `preview`: превью фото + кнопки "Повторить" / "Анализировать"
- `analyzing`: лоадер "Анализируем с помощью AI..." (2-4 сек)
- `result`: показ результата с confidence % + кнопка "Использовать"
- `error`: обработка ошибок (низкий confidence, нет еды, API error)

**UI components:** Переиспользовать:
- `Button` из `/src/components/Button.tsx`
- `Loading` из `/src/components/Loading.tsx`
- `Colors, Typography, Spacing` из `/src/config/theme.ts`
- `useTheme()` из `/src/config/ThemeContext.tsx`

**Флоу:**
```typescript
const handleCameraPress = async () => {
  const uri = await photoService.capturePhoto();
  if (uri) {
    setPhotoUri(uri);
    setState('preview');
  }
};

const handleAnalyze = async () => {
  setState('analyzing');
  try {
    const result = await photoService.analyzeFood(photoUri, userId);
    if (result.confidence < 0.3) {
      setState('error');
      setError('Не удалось распознать еду. Попробуйте другое фото.');
    } else {
      onPhotoSelected(result);
      onClose();
    }
  } catch (error) {
    setState('error');
    setError(error.message);
  }
};
```

---

## Шаг 7: Интеграция в AddMealModal

**Файл:** `/src/components/AddMealModal.tsx` (MODIFY)

**Изменения:**

1. **Новые imports:**
   ```typescript
   import PhotoCaptureModal from './PhotoCaptureModal';
   import photoService from '../services/photoService';
   ```

2. **Новые states:**
   ```typescript
   const [photoModalVisible, setPhotoModalVisible] = useState(false);
   const [photoResult, setPhotoResult] = useState<PhotoAnalysisResult | null>(null);
   const [photoUsage, setPhotoUsage] = useState({ current: 0, limit: 5, remaining: 5 });
   ```

3. **useEffect для загрузки лимита:**
   ```typescript
   useEffect(() => {
     if (visible && userId) {
       loadPhotoUsage();
     }
   }, [visible, userId]);

   const loadPhotoUsage = async () => {
     try {
       const usage = await photoService.getPhotoUsage(userId);
       setPhotoUsage(usage);
     } catch (error) {
       console.error('Failed to load photo usage:', error);
     }
   };
   ```

4. **Кнопка фото (добавить ПЕРЕД "Тип приема пищи"):**
   ```typescript
   {/* Photo Button */}
   <TouchableOpacity
     style={styles.photoButton}
     onPress={() => setPhotoModalVisible(true)}
     disabled={loading || photoUsage.remaining === 0}
   >
     <Ionicons name="camera" size={24} color={theme.primary} />
     <Text style={styles.photoButtonText}>📸 Сфотографировать</Text>
     <Text style={styles.photoCounter}>
       {photoUsage.remaining}/{photoUsage.limit} сегодня
     </Text>
   </TouchableOpacity>

   {photoUsage.remaining === 0 && (
     <View style={styles.limitBanner}>
       <Text>Лимит фото достигнут. Premium = безлимит 🚀</Text>
       <Button title="Узнать больше" onPress={showPaywall} variant="text" />
     </View>
   )}
   ```

5. **Callback после анализа:**
   ```typescript
   const handlePhotoAnalyzed = (result: PhotoAnalysisResult) => {
     setPhotoResult(result);

     // Auto-fill формы
     setName(result.dishName);
     setCalories(result.calories.toString());
     setProtein(result.protein.toString());
     setCarbs(result.carbs.toString());
     setFat(result.fat.toString());

     // Показать индикатор AI
     if (result.confidence >= 0.7) {
       Alert.alert('✓ AI распознал', `Уверенность: ${Math.round(result.confidence * 100)}%`);
     } else {
       Alert.alert('⚠ Низкая уверенность', 'Пожалуйста, проверьте данные');
     }

     setPhotoModalVisible(false);
   };
   ```

6. **Превью фото в форме (после БЖУ inputs):**
   ```typescript
   {photoResult && (
     <View style={styles.aiIndicator}>
       <Ionicons name="sparkles" size={16} color={theme.primary} />
       <Text>Данные получены с помощью AI ({Math.round(photoResult.confidence * 100)}%)</Text>
     </View>
   )}

   {photoResult?.photoUri && (
     <View style={styles.photoPreview}>
       <Image source={{ uri: photoResult.photoUri }} style={styles.photoImage} />
       <TouchableOpacity onPress={() => setPhotoResult(null)}>
         <Ionicons name="close-circle" size={24} color={theme.error} />
       </TouchableOpacity>
     </View>
   )}
   ```

7. **Обновить handleSave:**
   ```typescript
   const meal: Omit<FoodEntry, 'id' | 'timestamp'> = {
     // ... existing fields
     photoUrl: photoResult?.photoUrl,
     aiConfidence: photoResult?.confidence,
     aiReasoning: photoResult?.reasoning,
   };
   ```

8. **Modal:**
   ```typescript
   <PhotoCaptureModal
     visible={photoModalVisible}
     onClose={() => setPhotoModalVisible(false)}
     onPhotoSelected={handlePhotoAnalyzed}
   />
   ```

**Важно:** Сохранить существующую логику (валидация, editing, resetForm) без изменений.

---

## Шаг 8: Обновить типы

**Файл:** `/src/types/index.ts` (MODIFY)

**Добавить:**

```typescript
export interface PhotoAnalysisResult {
  dishName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;  // 0.0 - 1.0
  reasoning: string;
  photoUri: string;    // Local URI
  photoUrl?: string;   // Storage URL
}

export interface PhotoUsage {
  current: number;
  limit: number;
  remaining: number;
}

// Расширить FoodEntry:
export interface FoodEntry {
  // ... existing fields
  photoUrl?: string;
  aiConfidence?: number;
  aiReasoning?: string;
}
```

---

## Шаг 9: Обновить constants

**Файл:** `/src/config/constants.ts` (MODIFY)

**Добавить:**

```typescript
export const APP_CONFIG = {
  // ... existing
  FREE_PHOTO_LIMIT: 5,
  PREMIUM_PHOTO_LIMIT: 999,
  MAX_PHOTO_SIZE_MB: 2,
  PHOTO_CLEANUP_DAYS: 30,
};

export const PHOTO_CONFIG = {
  COMPRESSION_QUALITY: 0.8,
  MAX_WIDTH: 1024,
  MIN_CONFIDENCE: 0.3,
  GOOD_CONFIDENCE: 0.7,
};
```

---

## Шаг 10: Обновить diaryService

**Файл:** `/src/services/diaryService.ts` (MODIFY)

**Изменения:**

1. В `addMeal()` и `updateMeal()` добавить mapping для новых полей:
   ```typescript
   const insertData = {
     // ... existing fields
     photo_url: meal.photoUrl || null,
     ai_confidence: meal.aiConfidence || null,
     ai_reasoning: meal.aiReasoning || null,
   };
   ```

2. В `mapToFoodEntry()` добавить обратный mapping:
   ```typescript
   return {
     // ... existing fields
     photoUrl: data.photo_url,
     aiConfidence: data.ai_confidence,
     aiReasoning: data.ai_reasoning,
   };
   ```

---

## Verification (End-to-End тестирование)

### Test Case 1: Успешное распознавание фото

1. Запустить app: `npm start` → iOS simulator
2. Открыть DiaryScreen → tap FAB "+" (Add Meal)
3. В AddMealModal → tap кнопку "📸 Сфотографировать"
4. PhotoCaptureModal появился → tap "Камера" (или "Галерея" в simulator)
5. Выбрать/сфотографировать еду (например, греческий салат)
6. Превью фото появилось → tap "Анализировать"
7. Лоадер "Анализируем..." (2-4 сек)
8. **Expected:** AddMealModal auto-filled:
   - Name: "Греческий салат" (или похожее)
   - Calories: 280-350 ккал
   - Protein/Carbs/Fat заполнены
   - Индикатор "Данные получены с помощью AI (85%)" видим
9. Tap "Добавить" → meal saved
10. **Expected:** В DiaryScreen появилась карточка с блюдом + превью фото

### Test Case 2: Лимит фото достигнут

1. Использовать фото-функцию 5 раз (5 блюд)
2. Открыть AddMealModal в 6-й раз
3. **Expected:** Кнопка "📸 Сфотографировать" disabled
4. **Expected:** Banner "Лимит фото достигнут. Premium = безлимит 🚀" видим
5. Tap "Узнать больше" → PaywallScreen открылся

### Test Case 3: Низкая уверенность AI

1. Использовать размытое фото или не-еду (например, телефон)
2. **Expected:** PhotoCaptureModal показывает ошибку:
   - "Не удалось распознать еду. Попробуйте другое фото"
   - Кнопки "Повторить" / "Ввести вручную"
3. Tap "Ввести вручную" → AddMealModal с пустыми полями

### Test Case 4: Offline режим

1. Выключить Wi-Fi/Cellular на устройстве
2. Попытаться проанализировать фото
3. **Expected:** Error "Проверьте подключение к интернету"
4. Включить интернет → tap "Повторить" → успех

### Database Verification:

```sql
-- Проверить что photo_url сохранен
SELECT id, food_name, photo_url, ai_confidence
FROM food_diary
WHERE photo_url IS NOT NULL
LIMIT 5;

-- Проверить счетчик использования
SELECT user_id, usage_date, count
FROM photo_usage
WHERE usage_date = CURRENT_DATE;

-- Проверить файлы в Storage
SELECT name, created_at
FROM storage.objects
WHERE bucket_id = 'food-photos'
ORDER BY created_at DESC
LIMIT 5;
```

### Performance Verification:

- Photo compression: файл должен быть ≤ 2MB
- API response time: ≤ 5 seconds (p95)
- App не крашится при анализе фото
- Memory usage стабилен (нет leaks)

### Cost Verification (после 100 фото):

```bash
# Проверить spend в Anthropic Dashboard
# Expected: ~$0.80 за 100 фото (если $0.008/фото)
```

---

## Success Metrics (после 2 недель)

**Primary:**
- ✓ Photo Usage Rate: ≥40% пользователей использовали фото
- ✓ Photo Success Rate: ≥70% фото с confidence >0.5
- ✓ Edit Rate: ≤30% пользователей редактируют AI результаты

**Secondary:**
- Average confidence: ≥0.75
- Processing time: ≤4 сек (p95)
- Error rate: ≤5%
- Cost per photo: ≤$0.01

**Business (после 90 дней):**
- 7-Day Retention: ≥40% (up from 20%)
- Photo Limit Conversion: ≥20% hit limit → view paywall
- Premium Conversions: ≥5% upgrade to Premium

---

## Rollback Plan

Если возникнут критические проблемы:

1. **Disable Edge Function:**
   ```bash
   supabase functions delete analyze-food-photo
   ```

2. **Hide UI:** В AddMealModal добавить feature flag:
   ```typescript
   const PHOTO_FEATURE_ENABLED = false;
   {PHOTO_FEATURE_ENABLED && <PhotoButton />}
   ```

3. **Database:** Колонки `photo_url`, `ai_confidence` nullable, поэтому не ломают existing функционал.

4. **Costs:** Если spend >$50/день, автоматически disable через env variable.

---

## Критические файлы для реализации

**По приоритету:**

1. **`/supabase/migrations/003_add_photo_support.sql`** - Database foundation, без этого ничего не работает
2. **`/supabase/functions/analyze-food-photo/index.ts`** - Core AI logic, backbone фичи
3. **`/src/services/photoService.ts`** - Business logic, centralizes все photo operations
4. **`/src/components/PhotoCaptureModal.tsx`** - UI flow, критично для UX
5. **`/src/components/AddMealModal.tsx`** - Integration point, связывает всё вместе

**Порядок реализации:** 1 → 2 → 3 → 4 → 5 (database first, UI last)

---

## Итого: 5 дней работы

- День 1: Database + Storage setup (Шаги 1-3)
- День 2: Edge Function (Шаг 4)
- День 3: photoService.ts (Шаг 5)
- День 4: PhotoCaptureModal + интеграция (Шаги 6-7)
- День 5: Testing + bug fixes (Шаг 10)

**Готов к implementation!** 🚀
