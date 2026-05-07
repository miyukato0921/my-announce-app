# Recipe: メール通知システム

イベント発生時（決済完了・購入完了など）に、DBテンプレートを使って自動メールを送信する仕組み。
nodemailer + Neon PostgreSQL + Stripe Webhook で実装。

---

## 全体フロー

```
外部イベント（Stripe Webhook など）
    ↓
API Route でイベント受信・DB更新
    ↓
sendTemplateEmail(slug, to, vars)
    ↓
email_templates テーブルから slug でテンプレート取得
    ↓
{{変数}} を実際の値に置換
    ↓
nodemailer で SMTP 送信
    ↓
email_logs に送信結果（sent / failed / skipped）を記録
```

---

## 要点まとめ

### 1. テンプレートは DB で管理する

- `email_templates` テーブルに `slug`（識別子）・`subject`・`body` を保存
- 本文中に `{{変数名}}` を埋め込み → 送信時に実値へ置換
- `is_active = false` にするだけで無効化できる（コード変更不要）
- 管理画面から非エンジニアでも編集可能にできる

```sql
CREATE TABLE IF NOT EXISTS email_templates (
  id         SERIAL PRIMARY KEY,
  slug       VARCHAR(100) UNIQUE NOT NULL,
  name       VARCHAR(255) NOT NULL,
  subject    VARCHAR(255) NOT NULL,
  body       TEXT NOT NULL,
  description TEXT,
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. SMTP 設定は DB 優先・環境変数フォールバック

```
DB (site_settings) に smtp_host 等があれば使用
    ↓ なければ
環境変数 SMTP_HOST / SMTP_USER / SMTP_PASS を使用
```

- 本番環境では管理画面から変更できる
- ローカルや CI では .env で差し替えられる

### 3. 重複送信を email_logs で防ぐ

同じイベントが複数経路（Webhook・成功ページなど）から来る場合、
10分以内に同テンプレート・同アドレスへの送信済み記録があればスキップ。

```ts
const alreadySent = await sql`
  SELECT id FROM email_logs
  WHERE template_slug = ${slug}
    AND to_address = ${email}
    AND status = 'sent'
    AND created_at > NOW() - INTERVAL '10 minutes'
  LIMIT 1
`
if (alreadySent.length === 0) {
  await sendTemplateEmail(slug, email, vars)
}
```

### 4. 送信結果を必ず記録する

`email_logs` テーブルに `sent` / `failed` / `skipped` を記録。
SMTP 未設定時も `skipped` として残るため、無音で失敗しない。

```sql
CREATE TABLE IF NOT EXISTS email_logs (
  id             SERIAL PRIMARY KEY,
  template_slug  TEXT,
  to_address     TEXT NOT NULL,
  subject        TEXT NOT NULL,
  body           TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'sent', -- sent | failed | skipped
  error_message  TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. sendTemplateEmail の責務を1つに絞る

- テンプレート取得・変数置換・送信・ログ記録をすべて内包
- 呼び出し側は slug・宛先・変数を渡すだけ

```ts
await sendTemplateEmail("pledge_confirmation", email, {
  supporter_name: "山田 太郎",
  reward_title:   "スタンダードプラン",
  amount:         "¥3,000",
  email:          "taro@example.com",
})
```

---

## 最小実装コード

### lib/email.ts（抜粋）

```ts
import nodemailer from "nodemailer"
import sql from "@/lib/db"

function renderTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "")
}

export async function sendTemplateEmail(
  slug: string,
  to: string,
  vars: Record<string, string>
): Promise<void> {
  // テンプレート取得
  const rows = await sql`
    SELECT subject, body FROM email_templates
    WHERE slug = ${slug} AND is_active = true LIMIT 1
  `
  if (!rows.length) {
    await logEmail(slug, to, "", "", "skipped", "テンプレートが見つかりません")
    return
  }

  const subject = renderTemplate(rows[0].subject, vars)
  const body    = renderTemplate(rows[0].body, vars)

  // SMTP 設定取得（DB優先 → 環境変数フォールバック）
  const creds = await getSmtpCredentials()
  if (!creds) {
    await logEmail(slug, to, subject, body, "failed", "SMTP未設定")
    return
  }

  const transporter = nodemailer.createTransport({
    host: creds.host,
    port: creds.port,
    secure: creds.port === 465,
    auth: { user: creds.user, pass: creds.pass },
  })

  try {
    await transporter.sendMail({ from: creds.from, to, subject, text: body })
    await logEmail(slug, to, subject, body, "sent", null)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await logEmail(slug, to, subject, body, "failed", message)
  }
}
```

### Webhook での呼び出し例

```ts
// app/api/webhooks/stripe/route.ts
if (event.type === "checkout.session.completed") {
  const session = event.data.object

  // DB更新処理 ...

  // メール送信（重複チェック付き）
  const alreadySent = await sql`
    SELECT id FROM email_logs
    WHERE template_slug = 'pledge_confirmation'
      AND to_address = ${email}
      AND status = 'sent'
      AND created_at > NOW() - INTERVAL '10 minutes'
    LIMIT 1
  `
  if (alreadySent.length === 0) {
    await sendTemplateEmail("pledge_confirmation", email, {
      supporter_name,
      reward_title,
      amount: `¥${session.amount_total?.toLocaleString("ja-JP")}`,
      email,
    })
  }
}
```

---

## 初期データ（SQL）

```sql
INSERT INTO email_templates (slug, name, subject, body, description) VALUES
  ('pledge_confirmation', '支援完了通知', 'ご支援ありがとうございます',
   E'{{supporter_name}} 様\n\nご支援いただき、ありがとうございます。\n\nリターン: {{reward_title}}\n金額: {{amount}}\n\n運営事務局',
   '利用可能な変数: {{supporter_name}}, {{reward_title}}, {{amount}}, {{email}}')
ON CONFLICT (slug) DO NOTHING;
```

---

## 転用プロンプト

新しいアプリにこのパターンを組み込む際は、以下をそのままAIに渡してください。

```
以下の仕様でメール通知システムを実装してください。

【使用技術】
- Next.js App Router（API Route）
- nodemailer（SMTP送信）
- PostgreSQL（Neon / @neondatabase/serverless）

【DB テーブル】
- email_templates: slug, subject, body（{{変数名}}形式）, is_active
- email_logs: template_slug, to_address, subject, body, status（sent/failed/skipped）, error_message

【sendTemplateEmail 関数の仕様】
- 引数: slug（テンプレートID）, to（宛先）, vars（変数マップ）
- テンプレートを DB から取得 → {{変数}} を置換 → SMTP 送信 → email_logs に記録
- SMTP 設定は site_settings テーブル優先、なければ環境変数（SMTP_HOST / SMTP_USER / SMTP_PASS）
- テンプレート未存在・SMTP未設定の場合は skipped / failed として記録し例外を投げない

【重複送信防止】
- 送信前に email_logs を確認し、10分以内に同テンプレート・同アドレスへ送信済みならスキップ

【呼び出しタイミング】
- {イベント名}（例: Stripe checkout.session.completed）の処理後に呼び出す
- 変数: {使いたい変数リスト}（例: user_name, order_id, amount）

上記をベースに lib/email.ts と、呼び出し側の API Route を実装してください。
```

---

## 注意点

- Gmail を使う場合はアプリパスワードが必要（2段階認証を有効化したうえで発行）
- JPY は Stripe のゼロデシマル通貨のため `amount_total` を `/100` しない
- `nodemailer.createTransport` はリクエストごとに生成してよい（コネクションプールは不要）
- HTML メールを送る場合は `sendRawEmail` 関数を使い `html` フィールドを渡す
