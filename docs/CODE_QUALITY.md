# Отчет по качеству кода и настройке инструментов

## ✅ Что настроено

### 1. **Babel Configuration** ([babel.config.js](../babel.config.js))

**Статус: ✅ Корректно настроен**

- ✅ Использует `babel-preset-expo` (обязательно для Expo проектов)
- ✅ Настроен `module-resolver` для алиасов путей (@, @components, @screens и т.д.)
- ✅ `react-native-reanimated/plugin` расположен последним в массиве плагинов (обязательное требование)

**Вывод:** Babel **НЕОБХОДИМ** для проекта на Expo/React Native и правильно настроен.

---

### 2. **TypeScript Configuration** ([tsconfig.json](../tsconfig.json))

**Статус: ✅ Оптимально настроен**

- ✅ Strict mode активирован (`"strict": true`)
- ✅ Path aliases синхронизированы с babel.config.js
- ✅ Все необходимые strict-опции включены:
  - `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`
  - `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`
  - `noUncheckedIndexedAccess`, `forceConsistentCasingInFileNames`
- ✅ `allowSyntheticDefaultImports` добавлен для лучшей совместимости
- ✅ `moduleResolution: "bundler"` для современных проектов

**Проверка типов:**

```bash
pnpm run type-check
```

---

### 3. **ESLint Configuration** ([.eslintrc.js](../.eslintrc.js))

**Статус: ✅ Профессионально настроен**

**Версия:** ESLint v8.57 (downgraded from v9 для совместимости)

**Установленные плагины:**

- ✅ `@typescript-eslint` - для TypeScript
- ✅ `eslint-plugin-react` - для React правил
- ✅ `eslint-plugin-react-hooks` - для проверки хуков
- ✅ `eslint-plugin-react-native` - для React Native специфики
- ✅ `eslint-plugin-import` - для порядка импортов
- ✅ `eslint-plugin-prettier` - интеграция с Prettier
- ✅ `eslint-import-resolver-typescript` - поддержка TypeScript path aliases

**Ключевые правила:**

- Import order: автоматическая сортировка импортов
- Style order: проверка порядка стилей в StyleSheet
- No unused vars: запрет неиспользуемых переменных (допускаются с `_` префиксом)
- No inline styles: warning на inline стили
- No color literals: warning на цвета в стилях

**Команды:**

```bash
pnpm run lint          # Проверка кода
pnpm run lint:fix      # Автоматическое исправление
```

---

### 4. **Prettier Configuration** ([.prettierrc](../.prettierrc))

**Статус: ✅ Настроен**

**Настройки:**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "endOfLine": "lf"
}
```

**Команды:**

```bash
pnpm run format        # Форматировать все файлы
pnpm run format:check  # Проверить форматирование
```

---

### 5. **Ignore Files**

**[.eslintignore](../.eslintignore):**

```
node_modules/
.expo/
dist/
build/
coverage/
*.min.js
*.bundle.js
babel.config.js
metro.config.js
supabase/functions/      # Deno-based functions
supabase/test-connection.js
```

**[.prettierignore](../.prettierignore):**

```
node_modules/
.expo/
dist/
build/
coverage/
*.min.js
*.bundle.js
package-lock.json
yarn.lock
pnpm-lock.yaml
```

---

## 📊 Текущее состояние кода

### Статистика ESLint

**Всего проблем: 130** (18 ошибок, 112 warnings)

#### Типы ошибок (18):

1. **Неиспользуемые переменные** (7 ошибок)
   - `MealType`, `t`, `showRecalculate`, `Loading`, `updatedUser`, `data`
   - 🔧 Исправление: удалить или добавить префикс `_`
2. **Порядок импортов** (4 ошибки)
   - Некорректный порядок import statements
   - 🔧 Исправление: запустить `pnpm run lint:fix`
3. **Порядок стилей** (2 ошибки)
   - Стили в неправильном порядке
   - 🔧 Исправление: отсортировать алфавитно

4. **Неиспользуемые стили** (1 ошибка)
   - `styles.goalDescription` в ProfileEditModals
   - 🔧 Исправление: удалить
5. **Escape characters** (2 ошибки)
   - Кавычки в JSX без экранирования
   - 🔧 Исправление: использовать `&quot;` или `{'"'}`

#### Типы warnings (112):

1. **TypeScript any types** (~70 warnings)
   - Использование `any` типов
   - ⚠️ Это нормально для прототипирования, но лучше заменить на конкретные типы
2. **Color literals** (~15 warnings)
   - Цвета в стилях: `{ backgroundColor: '#FF0000' }`
   - ⚠️ Рекомендуется выносить в theme constants
3. **Inline styles** (~10 warnings)
   - Использование inline стилей: `style={{ width: 100 }}`
   - ⚠️ Рекомендуется использовать StyleSheet
4. **React Hooks dependencies** (~5 warnings)
   - Отсутствующие зависимости в useEffect
   - ⚠️ Добавить зависимости или пометить как `// eslint-disable-next-line`
5. **Console statements** (~10 warnings)
   - `console.log()` в коде
   - ⚠️ Удалить перед production build

---

## 🎯 Рекомендации

### Критические (исправить перед production):

1. **Исправить все ESLint errors (18):**

   ```bash
   pnpm run lint:fix
   # Затем вручную исправить оставшиеся
   ```

2. **Удалить console.log statements:**

   ```bash
   # Найти все console.log
   grep -r "console.log" src/
   ```

3. **Заменить any на конкретные типы:**
   - В особенности в критических местах (auth, payment)

### Желательные улучшения:

1. **Вынести color literals в theme:**

   ```typescript
   // Плохо
   backgroundColor: '#FF0000';

   // Хорошо
   backgroundColor: theme.colors.primary;
   ```

2. **Заменить inline styles на StyleSheet:**

   ```typescript
   // Плохо
   <View style={{ width: 100 }} />

   // Хорошо
   <View style={styles.container} />
   ```

3. **Настроить pre-commit hooks:**
   ```bash
   pnpm add -D husky lint-staged
   npx husky install
   ```

### Опциональные:

1. **Добавить EditorConfig** для консистентности:

   ```ini
   # .editorconfig
   root = true

   [*]
   charset = utf-8
   indent_style = space
   indent_size = 2
   end_of_line = lf
   trim_trailing_whitespace = true
   insert_final_newline = true
   ```

2. **Настроить VS Code settings:**
   ```json
   {
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     }
   }
   ```

---

## 📝 Скрипты package.json

```json
{
  "scripts": {
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "lint:fix": "eslint . --ext .js,.jsx,.ts,.tsx --fix",
    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{js,jsx,ts,tsx,json,md}\"",
    "type-check": "tsc --noEmit"
  }
}
```

---

## 🚀 Команды для ежедневной работы

### Перед коммитом:

```bash
# 1. Форматирование
pnpm run format

# 2. Проверка линтера
pnpm run lint:fix

# 3. Проверка типов
pnpm run type-check
```

### CI/CD pipeline:

```bash
pnpm run format:check
pnpm run lint
pnpm run type-check
pnpm run test # когда добавите тесты
```

---

## ✅ Заключение

**Babel:** ✅ Необходим и правильно настроен
**TypeScript:** ✅ Оптимально настроен со strict mode
**ESLint:** ✅ Профессионально настроен с правильными плагинами
**Prettier:** ✅ Настроен и работает

**Текущее состояние:** 18 ошибок ESLint (легко исправимые) + 112 warnings (большинство - это any типы и color literals, что нормально для разработки).

**Следующие шаги:**

1. Исправить 18 ESLint errors
2. Постепенно заменять `any` типы на конкретные
3. Вынести color literals в theme
4. Настроить pre-commit hooks
5. Добавить тесты (Jest + React Native Testing Library)
