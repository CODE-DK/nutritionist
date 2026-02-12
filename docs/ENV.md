# 🔐 Environment Configuration

## Текущий статус

**Активное окружение:** Development (`.env`)
**Supabase проект:** `sltpiyphjwlawrabkcnh.supabase.co`

```bash
# Проверка подключения
node supabase/test-connection.js

# Список Edge Functions
supabase functions list
```

---

## Быстрая настройка

### 1. Создайте `.env` из шаблона

```bash
cp .env.example .env
```

### 2. Заполните переменные

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# API ключи (для Edge Functions, через supabase secrets)
OPENAI_API_KEY=sk-your-openai-key
CLAUDE_API_KEY=sk-ant-your-claude-key

# Опционально
APP_ENV=development
```

### 3. Перезапустите приложение

```bash
pnpm start -- --clear
```

---

## Production окружение

Когда готовы к релизу:

1. Создайте отдельный Supabase проект для production
2. Скопируйте `.env.example` в `.env.production`
3. Заполните production ключами
4. Примените миграции к production БД
5. Задеплойте Edge Functions

**Переключение:**

```bash
# Development
ln -sf .env.local .env

# Production
ln -sf .env.production .env
```

---

## Безопасность

### ✅ Делайте:
- Используйте разные ключи для dev/production
- Храните production секреты в 1Password/Vault
- Ротируйте ключи регулярно

### ❌ Не делайте:
- НЕ коммитьте `.env` файлы
- НЕ публикуйте скриншоты с ключами
- НЕ используйте production ключи локально

---

## Troubleshooting

**Переменные не загружаются:**

```bash
pnpm start -- --clear
```

**Проверить активный .env:**

```bash
cat .env | grep APP_ENV
```

**Тест подключения:**

```bash
node supabase/test-connection.js
```

---

**Подробнее:** [SUPABASE.md](SUPABASE.md)
