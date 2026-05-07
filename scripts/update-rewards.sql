-- 外部キー制約を回避するため、先にpledgesのreward_tier_idをNULLに設定
UPDATE pledges SET reward_tier_id = NULL WHERE campaign_id = 1;

-- 既存のリターンを削除
DELETE FROM reward_tiers WHERE campaign_id = 1;

-- ①ステージで一緒に踊れる権利（3/13 12:00までの支援が必要）
INSERT INTO reward_tiers (campaign_id, title, description, amount, limit_count, claimed_count, delivery_date, image_url, sort_order, is_active)
VALUES (
  1,
  '【一緒に！アイリッシュ盆踊りコース】',
  'グリーン アイルランド フェスティバル 2026 のステージで一緒に踊れる権利。グリーン アイルランド フェスティバル当日（3/15）に会場内ステージで一緒に盆踊りを踊れます。御礼メッセージ付き。※3/13（金）12:00までのご支援が必要です。',
  20000,
  NULL,
  0,
  '2026年03月',
  '/images/reward-stage-dance.jpg',
  1,
  true
);

-- ②プロジェクト報告パーティー（数量限定50名）
INSERT INTO reward_tiers (campaign_id, title, description, amount, limit_count, claimed_count, delivery_date, image_url, sort_order, is_active)
VALUES (
  1,
  '【アイリッシュ盆踊りの打ち上げ参加！】',
  'プロジェクト報告パーティーへご招待。アイリッシュ盆踊りの活動報告会兼打ち上げに参加できます。日時は確定次第メールにてお知らせします。グリーン アイルランド フェスティバル2026オリジナルステッカー付き。※数量限定：50名',
  20000,
  50,
  0,
  '2026年05月',
  '/images/reward-party.jpg',
  2,
  true
);

-- ③孝藤右近のアイリッシュ盆踊りレッスン
INSERT INTO reward_tiers (campaign_id, title, description, amount, limit_count, claimed_count, delivery_date, image_url, sort_order, is_active)
VALUES (
  1,
  '【アイリッシュ盆踊り稽古会】',
  '孝藤右近によるアイリッシュ盆踊りレッスン 1時間。約100年続く創作日本舞踊孝藤流二代目・剣舞右近流家元・東京大学舞踊講師の孝藤右近から直接レッスンを受けられます。御礼メッセージ付き。',
  20000,
  30,
  0,
  '2026年05月',
  '/images/reward-lesson-dance.jpg',
  3,
  true
);

-- ③小松大のフィドル体験レッスン
INSERT INTO reward_tiers (campaign_id, title, description, amount, limit_count, claimed_count, delivery_date, image_url, sort_order, is_active)
VALUES (
  1,
  '【フィドル体験！】',
  '小松大のフィドル体験レッスン30分（都内）。「アイリッシュ盆踊り」で計1000万再生を超える話題を呼んだ日本を代表するフィドル奏者・小松大から直接フィドルを体験できます。御礼メッセージ付き。',
  20000,
  30,
  0,
  '2026年05月',
  '/images/reward-lesson-fiddle.jpg',
  4,
  true
);

-- ③グリーン アイルランド フェスティバル 2026 Tシャツ
INSERT INTO reward_tiers (campaign_id, title, description, amount, limit_count, claimed_count, delivery_date, image_url, sort_order, is_active)
VALUES (
  1,
  '【アイリッシュ盆踊り応援コースC】',
  'グリーン アイルランド フェスティバル2026オリジナルTシャツ＋オリジナルステッカー。日本×アイルランドの文化融合をデザインしたオリジナルグッズセットです。御礼メッセージ付き。',
  10000,
  NULL,
  0,
  '2026年04月',
  '/images/reward-tshirt.jpg',
  5,
  true
);

-- ④ステッカー＆バッジ
INSERT INTO reward_tiers (campaign_id, title, description, amount, limit_count, claimed_count, delivery_date, image_url, sort_order, is_active)
VALUES (
  1,
  '【アイリッシュ盆踊り応援コースB】',
  'グリーン アイルランド フェスティバル2026オリジナルステッカー＆缶バッジ。オリジナルステッカー：φ60mm。御礼メッセージ付き。',
  5000,
  NULL,
  0,
  '2026年04月',
  '/images/reward-sticker-badge.jpg',
  6,
  true
);

-- ⑤御礼メール
INSERT INTO reward_tiers (campaign_id, title, description, amount, limit_count, claimed_count, delivery_date, image_url, sort_order, is_active)
VALUES (
  1,
  '【アイリッシュ盆踊り応援コースA】',
  '御礼メールをお送りします。皆さまのご支援が、アイリッシュ盆踊りを日本中・世界へ広げる力となります。気持ちだけでも応援していただけると大変励みになります。',
  2000,
  NULL,
  0,
  '2026年04月',
  '/images/reward-thankyou.jpg',
  7,
  true
);

-- キャンペーン情報を更新
UPDATE campaigns
SET
  hero_image_url = '/images/hero-irish-bon-odori.jpg',
  title = '【アイリッシュ盆踊り】日本×アイルランド"踊りの輪"を全国・世界へ繋げたい！',
  short_description = 'アイルランドの音楽と日本舞踊を融合した「アイリッシュ盆踊り」を全国・世界へ。グリーン アイルランド フェスティバル2026を一緒につくりましょう！'
WHERE id = 1;
