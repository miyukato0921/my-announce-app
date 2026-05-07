-- pledgesテーブルに発送関連カラムを追加
ALTER TABLE pledges
  ADD COLUMN IF NOT EXISTS shipping_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS shipping_postal_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS shipping_prefecture VARCHAR(100),
  ADD COLUMN IF NOT EXISTS shipping_address TEXT,
  ADD COLUMN IF NOT EXISTS shipping_phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS shipping_status VARCHAR(50) DEFAULT 'not_required',
  -- not_required / pending / shipped
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE;

-- reward_tiersテーブルに送付要否フラグを追加
ALTER TABLE reward_tiers
  ADD COLUMN IF NOT EXISTS requires_shipping BOOLEAN DEFAULT FALSE;

-- 物品送付が必要なリターンにフラグを立てる（Tシャツ・ステッカー/バッジ）
UPDATE reward_tiers SET requires_shipping = TRUE
WHERE title IN (
  '【アイリッシュ盆踊り応援コースC】',
  '【アイリッシュ盆踊り応援コースB】'
);
