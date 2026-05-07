-- pledge_id, template_id, downloaded_at カラム追加
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS pledge_id INTEGER;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS template_id INTEGER;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS downloaded_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_receipts_pledge ON receipts(pledge_id);
