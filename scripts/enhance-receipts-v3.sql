-- 領収書機能拡張 v3

ALTER TABLE receipts ADD COLUMN IF NOT EXISTS reissued BOOLEAN DEFAULT FALSE;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS reissue_of INTEGER REFERENCES receipts(id);

-- 領収書送付通知テンプレート
INSERT INTO email_templates (slug, name, subject, body, description, is_active)
SELECT
  'receipt_notification',
  '領収書送付通知',
  '領収書（{{receipt_number}}）',
  '{{supporter_name}} 様

ご支援ありがとうございます。
領収書をお届けいたします。

領収書番号: {{receipt_number}}
金額: {{amount}}

以下のリンクから領収書を表示・印刷できます：
{{receipt_url}}

※ このリンクから何度でもアクセスできます。

{{issuer_name}}',
  '領収書発行時に支援者に送信される通知メール。変数: {{supporter_name}}, {{amount}}, {{receipt_number}}, {{receipt_url}}',
  true
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE slug = 'receipt_notification');
