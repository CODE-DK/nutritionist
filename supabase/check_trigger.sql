-- Check if trigger and function exist
SELECT
  'Trigger exists' as check_type,
  tgname as name,
  tgrelid::regclass as table_name,
  CASE tgenabled
    WHEN 'O' THEN 'enabled'
    WHEN 'D' THEN 'disabled'
    ELSE 'unknown'
  END as status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- Check if function exists
SELECT
  'Function exists' as check_type,
  proname as name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Check for users in auth.users without matching record in public.users
SELECT
  'Users without profile' as check_type,
  au.id,
  au.email,
  au.created_at,
  au.email_confirmed_at,
  CASE WHEN pu.id IS NULL THEN 'MISSING' ELSE 'EXISTS' END as profile_status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC
LIMIT 10;
