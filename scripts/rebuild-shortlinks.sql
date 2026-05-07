-- リンクショートカット機能 全面作り直し
-- 既存テーブルを削除して再作成

DROP TABLE IF EXISTS shortlink_clicks;
DROP TABLE IF EXISTS shortlinks;

CREATE TABLE shortlinks (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  url_default TEXT NOT NULL,
  url_line TEXT,
  url_ios TEXT,
  url_android TEXT,
  url_chrome TEXT,
  url_pc TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  total_clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shortlink_clicks (
  id SERIAL PRIMARY KEY,
  shortlink_id INTEGER NOT NULL REFERENCES shortlinks(id) ON DELETE CASCADE,
  user_agent TEXT,
  detected_platform TEXT,
  referer TEXT,
  ip_hash TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shortlink_clicks_link ON shortlink_clicks(shortlink_id);
CREATE INDEX idx_shortlink_clicks_time ON shortlink_clicks(clicked_at);
