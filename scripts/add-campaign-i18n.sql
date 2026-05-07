ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS title_ko TEXT,
  ADD COLUMN IF NOT EXISTS title_zh TEXT,
  ADD COLUMN IF NOT EXISTS short_description_en TEXT,
  ADD COLUMN IF NOT EXISTS short_description_ko TEXT,
  ADD COLUMN IF NOT EXISTS short_description_zh TEXT;

ALTER TABLE reward_tiers
  ADD COLUMN IF NOT EXISTS title_zh TEXT,
  ADD COLUMN IF NOT EXISTS description_zh TEXT;
