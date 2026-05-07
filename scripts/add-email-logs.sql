CREATE TABLE IF NOT EXISTS email_logs (
  id SERIAL PRIMARY KEY,
  template_slug TEXT,
  to_address TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
