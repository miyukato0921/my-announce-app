-- campaigns テーブルにイベント開催日・会場カラムを追加
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS event_date TEXT DEFAULT '2026年3月15日（日）',
  ADD COLUMN IF NOT EXISTS event_venue TEXT DEFAULT '東京都内（詳細後日）';

-- 既存レコードに初期値をセット
UPDATE campaigns
SET
  event_date  = '2026年3月15日（日）',
  event_venue = '東京（詳細は支援者にご連絡）'
WHERE id = 1;
