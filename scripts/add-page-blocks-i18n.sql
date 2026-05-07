ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS page_blocks_en JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS page_blocks_ko JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS page_blocks_zh JSONB DEFAULT '[]'::jsonb;
