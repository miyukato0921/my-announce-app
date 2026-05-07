-- shortlink_clicksテーブル再作成（既存データ保持）
CREATE TABLE IF NOT EXISTS shortlink_clicks (
  id SERIAL PRIMARY KEY,
  shortlink_id INTEGER NOT NULL REFERENCES shortlinks(id) ON DELETE CASCADE,
  user_agent TEXT,
  detected_platform TEXT,
  referer TEXT,
  ip_hash TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shortlink_clicks_link ON shortlink_clicks(shortlink_id);
CREATE INDEX IF NOT EXISTS idx_shortlink_clicks_time ON shortlink_clicks(clicked_at);

-- shortlinksテーブルに足りないカラムを追加
ALTER TABLE shortlinks ADD COLUMN IF NOT EXISTS url_ios TEXT;
ALTER TABLE shortlinks ADD COLUMN IF NOT EXISTS url_android TEXT;
ALTER TABLE shortlinks ADD COLUMN IF NOT EXISTS url_chrome TEXT;
ALTER TABLE shortlinks ADD COLUMN IF NOT EXISTS url_pc TEXT;
ALTER TABLE shortlinks ADD COLUMN IF NOT EXISTS total_clicks INTEGER DEFAULT 0;
