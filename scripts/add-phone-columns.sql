ALTER TABLE pledges
  ADD COLUMN IF NOT EXISTS supporter_mobile TEXT,
  ADD COLUMN IF NOT EXISTS supporter_phone  TEXT;
