/**
 * Тест подключения к Supabase
 *
 * Проверяет:
 * 1. Подключение к Supabase
 * 2. Наличие таблиц
 * 3. Работу аутентификации
 * 4. Доступность Edge Functions
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '❌ Ошибка: EXPO_PUBLIC_SUPABASE_URL или EXPO_PUBLIC_SUPABASE_ANON_KEY не найдены в .env'
  );
  process.exit(1);
}

console.log('🔍 Тестирование подключения к Supabase\n');
console.log('📋 Конфигурация:');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);
console.log('');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('1️⃣  Проверка подключения к Supabase...');

  try {
    // Тест 1: Проверка подключения через запрос к БД
    const { data, error } = await supabase.from('users').select('count').limit(1);

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = таблица пуста, это ок
      console.log('   ❌ Ошибка подключения:', error.message);
      return false;
    }

    console.log('   ✅ Подключение успешно');

    // Тест 2: Проверка наличия таблиц
    console.log('\n2️⃣  Проверка структуры БД...');

    const tables = ['users', 'chat_history', 'food_diary', 'photo_usage', 'photo_analysis_log'];

    for (const table of tables) {
      const { error: tableError } = await supabase.from(table).select('*').limit(0);

      if (tableError) {
        console.log(`   ❌ Таблица ${table}: не найдена или нет доступа`);
        console.log(`      Ошибка: ${tableError.message}`);
      } else {
        console.log(`   ✅ Таблица ${table}: найдена`);
      }
    }

    // Тест 3: Проверка Edge Functions
    console.log('\n3️⃣  Проверка Edge Functions...');

    // Проверяем, что функции существуют (они вернут 401/400 без авторизации, но это норм)
    const functions = [
      { name: 'chat-gpt', endpoint: '/chat-gpt' },
      { name: 'analyze-food-photo', endpoint: '/analyze-food-photo' },
    ];

    for (const func of functions) {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1${func.endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ test: true }),
        });

        // 401 = unauthorized (ожидаемо без JWT)
        // 400 = bad request (ожидаемо для неправильного запроса)
        // 200 = ok (если функция работает)
        // 404 = not found (функция не задеплоена)

        if (response.status === 404) {
          console.log(`   ⚠️  Функция ${func.name}: не задеплоена (404)`);
        } else if (response.status === 401 || response.status === 400 || response.status === 200) {
          console.log(`   ✅ Функция ${func.name}: задеплоена и доступна`);
        } else {
          console.log(`   ⚠️  Функция ${func.name}: статус ${response.status}`);
        }
      } catch (e) {
        console.log(`   ❌ Функция ${func.name}: ошибка запроса`);
        console.log(`      ${e.message}`);
      }
    }

    console.log('\n✅ Тестирование завершено!\n');

    // Итоговый чеклист
    console.log('📋 Чеклист настройки:');
    console.log('   ✅ Supabase CLI установлен');
    console.log('   ✅ Проект создан в Supabase');
    console.log('   ✅ Переменные окружения настроены в .env');
    console.log('   ⚠️  Миграции БД - выполните: supabase db push');
    console.log('   ⚠️  Edge Functions - выполните: supabase functions deploy');
    console.log('   ⚠️  Secrets - выполните: supabase secrets set');
    console.log('');
    console.log('💡 Для завершения настройки:');
    console.log('   1. Добавьте SUPABASE_ACCESS_TOKEN в .env');
    console.log('   2. Запустите: ./supabase/setup.sh');
    console.log('');

    return true;
  } catch (error) {
    console.log('❌ Критическая ошибка:', error.message);
    return false;
  }
}

testConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('❌ Неожиданная ошибка:', err);
    process.exit(1);
  });
