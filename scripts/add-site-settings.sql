CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO site_settings (key, value) VALUES
  ('site_title', 'クラウドファンディング'),
  ('site_subtitle', ''),
  ('logo_url', '')
ON CONFLICT (key) DO NOTHING;
