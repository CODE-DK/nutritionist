-- =====================================================
-- Migration: Initial schema with user physical parameters
-- Version: 1.1.0
-- Date: 2026-02-06
-- =====================================================

-- =====================================================
-- TABLE: public.users
-- =====================================================
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

COMMENT ON TABLE public.users IS 'User profiles with subscription, limits and physical parameters';
COMMENT ON COLUMN public.users.id IS 'References auth.users, email stored in auth schema only';
COMMENT ON COLUMN public.users.daily_ai_requests IS 'Resets automatically when last_request_date < CURRENT_DATE';
COMMENT ON COLUMN public.users.height IS 'Height in cm';
COMMENT ON COLUMN public.users.weight IS 'Current weight in kg';
COMMENT ON COLUMN public.users.target_calories IS 'Daily calorie goal';

-- =====================================================
-- TABLE: public.chat_history
-- =====================================================
CREATE TABLE public.chat_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message text NOT NULL
    CHECK (length(message) > 0 AND length(message) <= 5000),
  response text NOT NULL
    CHECK (length(response) > 0 AND length(response) <= 10000),
  tokens_used integer
    CHECK (tokens_used >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.chat_history IS 'AI dietitian chat history';
COMMENT ON COLUMN public.chat_history.message IS 'User question, max 5000 chars';
COMMENT ON COLUMN public.chat_history.response IS 'AI response, max 10000 chars';

-- =====================================================
-- TABLE: public.food_diary
-- =====================================================
CREATE TABLE public.food_diary (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  meal_type text NOT NULL
    CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name varchar(500) NOT NULL
    CHECK (length(food_name) > 0),
  calories integer
    CHECK (calories >= 0 AND calories <= 10000),
  protein numeric(6,2)
    CHECK (protein >= 0 AND protein <= 1000),
  carbs numeric(6,2)
    CHECK (carbs >= 0 AND carbs <= 1000),
  fats numeric(6,2)
    CHECK (fats >= 0 AND fats <= 1000),
  meal_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.food_diary IS 'Food diary entries';
COMMENT ON COLUMN public.food_diary.calories IS 'Calories in kcal (0-10000)';
COMMENT ON COLUMN public.food_diary.protein IS 'Protein in grams (0-1000)';

-- =====================================================
-- INDEXES
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_stripe ON users(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_users_subscription_limits ON users(subscription_tier, daily_ai_requests);

-- Chat history indexes
CREATE INDEX idx_chat_history_user_date ON chat_history(user_id, created_at DESC);
CREATE INDEX idx_chat_tokens ON chat_history(user_id, tokens_used)
  WHERE tokens_used IS NOT NULL;

-- Food diary indexes
CREATE INDEX idx_food_diary_user_date ON food_diary(user_id, meal_date DESC);
CREATE INDEX idx_food_diary_user_type_date ON food_diary(user_id, meal_type, meal_date);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_diary ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Chat history policies
CREATE POLICY "Users can read own chat history"
  ON chat_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat history"
  ON chat_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Food diary policies
CREATE POLICY "Users can manage own food diary"
  ON food_diary FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function: Create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id)
  VALUES (new.id);
  RETURN new;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, ignore
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Reset daily limits for all users
CREATE OR REPLACE FUNCTION public.reset_daily_limits()
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET daily_ai_requests = 0
  WHERE last_request_date < CURRENT_DATE
    AND last_request_date IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check and increment AI request limit
CREATE OR REPLACE FUNCTION public.check_and_increment_limit(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_tier text;
  v_current_requests integer;
  v_last_date date;
  v_limit integer;
BEGIN
  -- Get user data
  SELECT subscription_tier, daily_ai_requests, last_request_date
  INTO v_tier, v_current_requests, v_last_date
  FROM public.users
  WHERE id = p_user_id;

  -- Check if user exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Determine limit based on tier
  v_limit := CASE v_tier
    WHEN 'premium' THEN 100
    ELSE 10
  END;

  -- Reset counter if new day
  IF v_last_date IS NULL OR v_last_date < CURRENT_DATE THEN
    UPDATE public.users
    SET daily_ai_requests = 1,
        last_request_date = CURRENT_DATE
    WHERE id = p_user_id;
    RETURN true;
  END IF;

  -- Check if limit exceeded
  IF v_current_requests >= v_limit THEN
    RETURN false;
  END IF;

  -- Increment counter
  UPDATE public.users
  SET daily_ai_requests = daily_ai_requests + 1,
      last_request_date = CURRENT_DATE
  WHERE id = p_user_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_and_increment_limit IS
  'Check if user has requests remaining, auto-reset on new day, increment counter';

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- GRANTS (for authenticated users)
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.chat_history TO authenticated;
GRANT ALL ON public.food_diary TO authenticated;

-- Allow calling functions
GRANT EXECUTE ON FUNCTION public.check_and_increment_limit TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_daily_limits TO service_role;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Uncomment to verify migration
/*
SELECT
  table_name,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('users', 'chat_history', 'food_diary')
ORDER BY table_name, ordinal_position;
*/
