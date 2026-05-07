-- 詳細説明（リッチテキストHTML）
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS description_html TEXT;

-- 資金の使い道（リッチテキストHTML）
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS fund_usage_html TEXT;

-- ページブロック（JSON: ブロックの順序・種類・コンテンツ）
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS page_blocks JSONB DEFAULT '[]'::jsonb;
