-- 領収書テンプレート
CREATE TABLE IF NOT EXISTS receipt_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'デフォルト',
  issuer_name TEXT NOT NULL DEFAULT '',
  issuer_address TEXT,
  issuer_tel TEXT,
  issuer_email TEXT DEFAULT NULL,
  logo_url TEXT,
  stamp_url TEXT,
  prefix TEXT NOT NULL DEFAULT 'CF',
  next_number INTEGER NOT NULL DEFAULT 1,
  default_proviso TEXT NOT NULL DEFAULT 'クラウドファンディング支援金として',
  footer_note TEXT DEFAULT '※ 本領収書は、クラウドファンディングによる支援金の受領を証するものです。',
  is_default BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 発行済み領収書
CREATE TABLE IF NOT EXISTS receipts (
  id SERIAL PRIMARY KEY,
  receipt_number TEXT UNIQUE NOT NULL,
  supporter_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  proviso TEXT NOT NULL DEFAULT 'クラウドファンディング支援金として',
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  issuer_name TEXT NOT NULL,
  issuer_address TEXT,
  download_token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'issued',
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_token ON receipts(download_token);
CREATE INDEX IF NOT EXISTS idx_receipts_number ON receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_receipts_issued_date ON receipts(issued_date);

-- デフォルトテンプレートを挿入
INSERT INTO receipt_templates (name, issuer_name, default_proviso, is_default)
SELECT 'デフォルト', '', 'クラウドファンディング支援金として', TRUE
WHERE NOT EXISTS (SELECT 1 FROM receipt_templates WHERE is_default = TRUE);
