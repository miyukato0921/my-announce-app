-- reward_tiersに多言語カラムを追加
ALTER TABLE reward_tiers
  ADD COLUMN IF NOT EXISTS title_en TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS title_ko TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_en TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_ko TEXT DEFAULT '';
