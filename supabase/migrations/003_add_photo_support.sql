-- =====================================================
-- Migration: Add Photo Recognition Support
-- Version: 1.0.0
-- Date: 2026-02-06
-- Description: Adds photo URL, AI confidence, and usage tracking for killer feature
-- =====================================================

-- 1. Расширение таблицы food_diary для фото
ALTER TABLE public.food_diary
  ADD COLUMN photo_url TEXT,
  ADD COLUMN ai_confidence FLOAT CHECK (ai_confidence IS NULL OR (ai_confidence >= 0 AND ai_confidence <= 1)),
  ADD COLUMN ai_reasoning TEXT;

COMMENT ON COLUMN public.food_diary.photo_url IS 'Supabase Storage URL of food photo';
COMMENT ON COLUMN public.food_diary.ai_confidence IS 'AI confidence score (0-1) from Claude Vision';
COMMENT ON COLUMN public.food_diary.ai_reasoning IS 'AI explanation of nutrition estimation';

-- Индекс для поиска записей с фото
CREATE INDEX idx_food_diary_photo ON public.food_diary(user_id, photo_url)
  WHERE photo_url IS NOT NULL;

-- 2. Таблица для отслеживания лимитов фото
CREATE TABLE public.photo_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, usage_date)
);

COMMENT ON TABLE public.photo_usage IS 'Daily photo analysis usage tracking for free/premium limits';
COMMENT ON COLUMN public.photo_usage.count IS 'Number of photos analyzed on this date';

-- Индексы для performance
CREATE INDEX idx_photo_usage_user_date ON public.photo_usage(user_id, usage_date DESC);
CREATE INDEX idx_photo_usage_date ON public.photo_usage(usage_date);

-- 3. Таблица для аналитики распознавания (опционально, для мониторинга качества)
CREATE TABLE public.photo_analysis_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dish_name TEXT NOT NULL,
  confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  calories INTEGER NOT NULL,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.photo_analysis_log IS 'Analytics log for photo recognition quality monitoring';

CREATE INDEX idx_photo_log_user ON public.photo_analysis_log(user_id, analyzed_at DESC);
CREATE INDEX idx_photo_log_confidence ON public.photo_analysis_log(confidence);

-- 4. RLS Policies для photo_usage
ALTER TABLE public.photo_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own photo usage"
  ON public.photo_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Система может управлять usage (через Edge Function с service role key)
CREATE POLICY "Service role can manage photo usage"
  ON public.photo_usage FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. RLS Policies для photo_analysis_log
ALTER TABLE public.photo_analysis_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own photo logs"
  ON public.photo_analysis_log FOR SELECT
  USING (auth.uid() = user_id);

-- Система может писать логи
CREATE POLICY "Service role can write photo logs"
  ON public.photo_analysis_log FOR INSERT
  WITH CHECK (true);

-- 6. PostgreSQL Function для атомарного увеличения счетчика
CREATE OR REPLACE FUNCTION public.increment_photo_usage(
  p_user_id UUID,
  p_date DATE
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.photo_usage (user_id, usage_date, count)
  VALUES (p_user_id, p_date, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET
    count = photo_usage.count + 1,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.increment_photo_usage IS
  'Atomically increment photo usage counter for a user on a specific date';

-- 7. Function для получения статистики фото за период
CREATE OR REPLACE FUNCTION public.get_photo_stats(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_photos INTEGER,
  avg_confidence FLOAT,
  low_confidence_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_photos,
    AVG(confidence)::FLOAT as avg_confidence,
    COUNT(CASE WHEN confidence < 0.7 THEN 1 END)::INTEGER as low_confidence_count
  FROM public.photo_analysis_log
  WHERE user_id = p_user_id
    AND analyzed_at::DATE BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_photo_stats IS
  'Get photo recognition statistics for a user within date range';

-- 8. Function для получения current photo usage за сегодня
CREATE OR REPLACE FUNCTION public.get_current_photo_usage(
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT count INTO v_count
  FROM public.photo_usage
  WHERE user_id = p_user_id
    AND usage_date = CURRENT_DATE;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_current_photo_usage IS
  'Get current photo usage count for today for a specific user';

-- 9. Триггер для auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_photo_usage_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER photo_usage_updated_at
  BEFORE UPDATE ON public.photo_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_photo_usage_timestamp();

-- 10. Grants для authenticated users
GRANT ALL ON public.photo_usage TO authenticated;
GRANT ALL ON public.photo_analysis_log TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_photo_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_photo_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_photo_usage TO authenticated;

-- 11. Cleanup function (для удаления старых записей usage через 90 дней)
CREATE OR REPLACE FUNCTION public.cleanup_old_photo_usage()
RETURNS void AS $$
BEGIN
  DELETE FROM public.photo_usage
  WHERE usage_date < CURRENT_DATE - INTERVAL '90 days';

  DELETE FROM public.photo_analysis_log
  WHERE analyzed_at < now() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_old_photo_usage IS
  'Delete photo usage records older than 90 days (run monthly via cron)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration 003_add_photo_support completed successfully!';
  RAISE NOTICE 'Photo recognition support has been added to food_diary table';
  RAISE NOTICE 'Created photo_usage and photo_analysis_log tables with RLS policies';
  RAISE NOTICE 'Created helper functions: increment_photo_usage, get_photo_stats, get_current_photo_usage';
END $$;
