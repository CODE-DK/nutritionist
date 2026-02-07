#!/bin/bash

# Supabase Setup Script
# Автоматизирует настройку Supabase для проекта Personal Dietitian

set -e  # Остановить при ошибке

echo "🚀 Настройка Supabase для Personal Dietitian"
echo "=============================================="
echo ""

# Проверка наличия .env
if [ ! -f ".env" ]; then
    echo "❌ Файл .env не найден!"
    exit 1
fi

# Загрузка .env
echo "📋 Загрузка переменных из .env..."
export $(cat .env | grep -v '^#' | xargs)

# Проверка SUPABASE_ACCESS_TOKEN
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "❌ SUPABASE_ACCESS_TOKEN не найден в .env"
    echo ""
    echo "Получите токен:"
    echo "1. Откройте https://app.supabase.com/account/tokens"
    echo "2. Создайте новый токен"
    echo "3. Добавьте в .env: SUPABASE_ACCESS_TOKEN=ваш_токен"
    exit 1
fi

# Проверка остальных ключей
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  OPENAI_API_KEY не найден в .env"
fi

if [ -z "$CLAUDE_API_KEY" ]; then
    echo "⚠️  CLAUDE_API_KEY не найден в .env"
fi

# Запрос Project ID
echo ""
echo "📝 Введите Project ID из Supabase:"
echo "   (Найдите в URL: https://app.supabase.com/project/YOUR_PROJECT_ID)"
read -p "Project ID: " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Project ID обязателен!"
    exit 1
fi

echo ""
echo "1️⃣  Авторизация в Supabase CLI..."
supabase login --token "$SUPABASE_ACCESS_TOKEN"

echo ""
echo "2️⃣  Связывание проекта..."
supabase link --project-ref "$PROJECT_ID"

echo ""
echo "3️⃣  Применение миграций к БД..."
supabase db push

echo ""
echo "4️⃣  Установка секретов для Edge Functions..."

if [ ! -z "$OPENAI_API_KEY" ]; then
    echo "   → OPENAI_API_KEY"
    supabase secrets set OPENAI_API_KEY="$OPENAI_API_KEY"
else
    echo "   ⚠️  Пропущен OPENAI_API_KEY (не найден в .env)"
fi

if [ ! -z "$CLAUDE_API_KEY" ]; then
    echo "   → ANTHROPIC_API_KEY"
    supabase secrets set ANTHROPIC_API_KEY="$CLAUDE_API_KEY"
else
    echo "   ⚠️  Пропущен ANTHROPIC_API_KEY (не найден в .env)"
fi

echo ""
echo "5️⃣  Деплой Edge Functions..."
echo "   → chat-gpt"
supabase functions deploy chat-gpt

echo "   → analyze-food-photo"
supabase functions deploy analyze-food-photo

echo ""
echo "6️⃣  Проверка установки..."
echo ""
echo "📦 Edge Functions:"
supabase functions list

echo ""
echo "🔐 Secrets:"
supabase secrets list

echo ""
echo "✅ Настройка завершена!"
echo ""
echo "Полезные команды:"
echo "  supabase functions logs chat-gpt          # Логи функции chat-gpt"
echo "  supabase functions logs analyze-food-photo # Логи функции analyze-food-photo"
echo "  supabase status                            # Статус проекта"
echo ""
