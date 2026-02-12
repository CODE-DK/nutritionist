-- Add diet type and daily tips preferences to users table
-- Migration: 005_add_diet_type
-- Created: 2026-02-07

-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS diet_type TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_daily_tips BOOLEAN DEFAULT true;

-- Create table for tracking shown tips
CREATE TABLE IF NOT EXISTS daily_tips_shown (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tip_id TEXT NOT NULL,
  shown_at TIMESTAMP DEFAULT NOW(),
  dismissed BOOLEAN DEFAULT false
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_tips_shown_user_date ON daily_tips_shown(user_id, shown_at);

-- Add comment for documentation
COMMENT ON COLUMN users.diet_type IS 'User selected diet type: balanced, calorie_deficit, keto, low_carb, high_protein, mediterranean, intermittent_fasting, paleo, vegan, vegetarian';
COMMENT ON COLUMN users.show_daily_tips IS 'Whether to show daily nutrition tips to the user';
COMMENT ON TABLE daily_tips_shown IS 'Tracks which daily tips have been shown to users';
