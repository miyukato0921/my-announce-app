-- 支援者管理テーブル (pledges)
CREATE TABLE IF NOT EXISTS pledges (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER,
  reward_tier_id INTEGER,
  supporter_name TEXT NOT NULL,
  supporter_email TEXT,
  supporter_phone TEXT,
  amount INTEGER NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  payment_intent_id TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  message TEXT,
  shipping_name TEXT,
  shipping_postal_code TEXT,
  shipping_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pledges_campaign ON pledges(campaign_id);
CREATE INDEX IF NOT EXISTS idx_pledges_email ON pledges(supporter_email);
CREATE INDEX IF NOT EXISTS idx_pledges_status ON pledges(payment_status);
CREATE INDEX IF NOT EXISTS idx_pledges_created ON pledges(created_at);
