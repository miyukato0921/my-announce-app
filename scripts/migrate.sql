-- Crowdfunding Platform Schema

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  short_description VARCHAR(500),
  goal_amount INTEGER NOT NULL, -- in JPY (yen)
  current_amount INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- active, completed, cancelled, draft
  hero_image_url VARCHAR(500),
  supporter_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reward tiers table
CREATE TABLE IF NOT EXISTS reward_tiers (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL, -- in JPY
  limit_count INTEGER, -- NULL = unlimited
  claimed_count INTEGER DEFAULT 0,
  image_url VARCHAR(500),
  delivery_date VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supporters / Pledges table
CREATE TABLE IF NOT EXISTS pledges (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id),
  reward_tier_id INTEGER REFERENCES reward_tiers(id),
  supporter_name VARCHAR(255),
  supporter_email VARCHAR(255),
  amount INTEGER NOT NULL, -- in JPY
  stripe_session_id VARCHAR(255) UNIQUE,
  stripe_payment_intent_id VARCHAR(255),
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded
  message TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table (merchandise etc.)
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- in JPY
  stock_count INTEGER,
  image_url VARCHAR(500),
  category VARCHAR(100),
  stripe_price_id VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id SERIAL PRIMARY KEY,
  admin_user_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default campaign
INSERT INTO campaigns (title, description, short_description, goal_amount, start_date, end_date, status, hero_image_url)
VALUES (
  'サンプルキャンペーン',
  '## グリーンアイルランドフェスティバルについて

これはサンプルキャンペーンの説明です。管理画面から実際のコンテンツに変更してください。

詳細は管理画面から設定できます。

## 資金の使い道

- アーティスト招聘費用・出演料：40%
- 会場費・設備費：25%
- 広報・マーケティング：15%
- 食材・飲料仕入れ：15%
- 運営費・その他：5%

## 開催概要

- 日時：2025年3月17日（土）〜18日（日）
- 会場：東京・お台場特設会場
- 来場予定者数：5,000人

皆さまのご支援で、日本とアイルランドの架け橋となる素晴らしいフェスティバルを実現させてください！',
  'クラウドファンディングプロジェクトにご支援ください！',
  5000000,
  NOW(),
  NOW() + INTERVAL '45 days',
  'active',
  '/images/hero-festival.jpg'
) ON CONFLICT DO NOTHING;

-- Seed reward tiers
INSERT INTO reward_tiers (campaign_id, title, description, amount, limit_count, image_url, delivery_date, sort_order)
SELECT 
  c.id,
  'ブロンズサポーター',
  'サンプルリターン（ブロンズ）です。管理画面から内容を変更してください。',
  3000,
  200,
  '/images/reward-bronze.jpg',
  '2025年3月',
  1
FROM campaigns c WHERE c.title = 'サンプルキャンペーン'
ON CONFLICT DO NOTHING;

INSERT INTO reward_tiers (campaign_id, title, description, amount, limit_count, image_url, delivery_date, sort_order)
SELECT 
  c.id,
  'シルバーサポーター',
  'サンプルリターン（シルバー）です。管理画面から内容を変更してください。',
  8000,
  100,
  '/images/reward-silver.jpg',
  '2025年3月',
  2
FROM campaigns c WHERE c.title = 'サンプルキャンペーン'
ON CONFLICT DO NOTHING;

INSERT INTO reward_tiers (campaign_id, title, description, amount, limit_count, image_url, delivery_date, sort_order)
SELECT 
  c.id,
  'ゴールドサポーター',
  'サンプルリターン（ゴールド）です。管理画面から内容を変更してください。',
  30000,
  30,
  '/images/reward-gold.jpg',
  '2025年3月',
  3
FROM campaigns c WHERE c.title = 'サンプルキャンペーン'
ON CONFLICT DO NOTHING;

-- Seed admin user (password: Admin1234! - bcrypt hash)
INSERT INTO admin_users (email, password_hash, name, role)
VALUES (
  'admin@example.com',
  '$2b$10$rOzJqo5W1JrAOW2oZRkfZuGXSJhZL5C5A6KqZ5V9.V.A8UMFrLY.6',
  '管理者',
  'super_admin'
) ON CONFLICT (email) DO NOTHING;
