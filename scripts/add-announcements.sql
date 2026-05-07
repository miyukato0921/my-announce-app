CREATE TABLE IF NOT EXISTS announcements (
  id           SERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  content      TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
