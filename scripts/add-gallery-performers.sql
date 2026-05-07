-- フォトギャラリーテーブル
CREATE TABLE IF NOT EXISTS gallery_photos (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  caption VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 出演者テーブル
CREATE TABLE IF NOT EXISTS performers (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255),
  bio TEXT,
  image_url VARCHAR(500),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 初期ギャラリーデータ
INSERT INTO gallery_photos (campaign_id, image_url, caption, sort_order)
SELECT id, '/images/hero-irish-bon-odori.jpg', 'アイリッシュ盆踊りステージパフォーマンス', 1 FROM campaigns WHERE id = 1;
INSERT INTO gallery_photos (campaign_id, image_url, caption, sort_order)
SELECT id, '/images/gallery-bonodori.jpg', '盆踊りの輪 — 日本とアイルランドの融合', 2 FROM campaigns WHERE id = 1;
INSERT INTO gallery_photos (campaign_id, image_url, caption, sort_order)
SELECT id, '/images/festival-crowd.jpg', 'フェスティバルを楽しむ観衆', 3 FROM campaigns WHERE id = 1;
INSERT INTO gallery_photos (campaign_id, image_url, caption, sort_order)
SELECT id, '/images/gallery-food.jpg', 'アイルランドの食文化ブース', 4 FROM campaigns WHERE id = 1;
INSERT INTO gallery_photos (campaign_id, image_url, caption, sort_order)
SELECT id, '/images/gallery-sns.jpg', 'SNS累計1,000万再生を突破', 5 FROM campaigns WHERE id = 1;
INSERT INTO gallery_photos (campaign_id, image_url, caption, sort_order)
SELECT id, '/images/reward-stage-dance.jpg', 'ステージ共演の様子', 6 FROM campaigns WHERE id = 1;

-- 初期出演者データ
INSERT INTO performers (campaign_id, name, role, bio, image_url, sort_order)
SELECT id, '孝藤右近', '日本舞踊', '創作日本舞踊孝藤流二代目・剣舞右近流家元・東京大学舞踊講師。約100年続く伝統を受け継ぎながら、アイリッシュ盆踊りを世界に発信する振付家・舞踊家。', '/images/performer-ukon.jpg', 1
FROM campaigns WHERE id = 1;
INSERT INTO performers (campaign_id, name, role, bio, image_url, sort_order)
SELECT id, '小松大', 'フィドル', '日本を代表するフィドル奏者。「アイリッシュ盆踊り」の楽曲で累計1,000万再生を達成。アイルランド音楽と日本文化の橋渡し役として活躍中。', '/images/performer-komatsu.jpg', 2
FROM campaigns WHERE id = 1;
