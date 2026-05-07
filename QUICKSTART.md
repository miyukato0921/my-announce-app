# QUICKSTART

ゼロからローカル開発 → Vercel 本番デプロイまでの最短手順。

---

## 必要なアカウント

| サービス | 用途 | 無料枠 |
|---|---|---|
| [GitHub](https://github.com) | コード管理 | あり |
| [Neon](https://neon.tech) | PostgreSQL DB | あり（0.5GB） |
| [Vercel](https://vercel.com) | ホスティング | あり |
| [Stripe](https://stripe.com/jp) | 決済 | テストモード無料 |

---

## Step 1 — Clone & Install

```bash
git clone https://github.com/<your-username>/crowdfunding-platform.git
cd crowdfunding-platform
pnpm install
```

> pnpm が未インストールの場合: `npm install -g pnpm`

---

## Step 2 — Neon でデータベース作成

1. https://neon.tech にサインアップ
2. 「New Project」を作成（リージョン: ap-southeast-1 推奨）
3. ダッシュボードの **Connection string** をコピー

```
postgresql://username:password@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

---

## Step 3 — マイグレーション（テーブル作成）

Neon ダッシュボードの **SQL Editor** を開き、以下を**上から順に**コピー＆ペーストして「Run」を実行。

| # | ファイル | 内容 |
|---|---|---|
| 1 | `scripts/migrate.sql` | コアテーブル + サンプルデータ + 初期管理者 |
| 2 | `scripts/add-site-settings.sql` | サイト設定テーブル |
| 3 | `scripts/add-gallery-performers.sql` | ギャラリー・出演者テーブル |
| 4 | `scripts/add-email-templates.sql` | メールテンプレート |
| 5 | `scripts/add-email-logs.sql` | メール送信ログ |
| 6 | `scripts/add-shop-orders.sql` | ショップ注文テーブル |
| 7 | `scripts/add-receipts.sql` | 領収書テーブル |
| 8 | `scripts/add-receipts-v2.sql` | 領収書カラム追加 |
| 9 | `scripts/add-receipts-columns.sql` | 領収書カラム追加 v3 |
| 10 | `scripts/enhance-receipts-v3.sql` | 領収書拡張 |
| 11 | `scripts/add-shortlinks.sql` | 短縮URLテーブル |
| 12 | `scripts/add-shipping.sql` | 配送先テーブル |
| 13 | `scripts/add-pledges.sql` | 支援者カラム追加 |
| 14 | `scripts/add-phone-columns.sql` | 電話番号カラム追加 |
| 15 | `scripts/add-event-info.sql` | イベント情報カラム |
| 16 | `scripts/add-campaign-rich-content.sql` | リッチコンテンツカラム |
| 17 | `scripts/add-campaign-i18n.sql` | キャンペーン多言語カラム |
| 18 | `scripts/add-reward-i18n.sql` | リターン多言語カラム |
| 19 | `scripts/add-performers-i18n.sql` | 出演者多言語カラム |
| 20 | `scripts/add-products-i18n.sql` | 商品多言語カラム |
| 21 | `scripts/add-page-blocks-i18n.sql` | ページブロック多言語カラム |

> `check-*.sql` / `fix-*.sql` / `rebuild-*.sql` / `seed-*.sql` はここでは実行不要。

---

## Step 4 — ローカル環境変数の設定

プロジェクトルートに `.env.local` を作成：

```bash
# 必須
DATABASE_URL=postgresql://...（Neon の接続文字列）
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Stripe（テストキーで可）
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# メール送信（任意。未設定でも動作する）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=アプリパスワード
EMAIL_FROM=your@gmail.com

# ファイルアップロード（任意。Vercel Blob）
BLOB_READ_WRITE_TOKEN=vercel_blob_...
```

---

## Step 5 — 管理者アカウントを作成

```bash
node --env-file=.env.local scripts/seed-admin.mjs
```

デフォルト認証情報（後で必ず変更）:

| 項目 | 値 |
|---|---|
| メール | `admin@example.com` |
| パスワード | `Admin1234!` |

別のメール・パスワードにしたい場合:

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=MyPass123! node --env-file=.env.local scripts/seed-admin.mjs
```

---

## Step 6 — ローカル動作確認

```bash
pnpm dev
```

| URL | 内容 |
|---|---|
| http://localhost:3000 | キャンペーントップ |
| http://localhost:3000/admin | 管理画面 |

---

## Step 7 — GitHub にプッシュ

```bash
git remote set-url origin https://github.com/<your-username>/<repo-name>.git
git push origin main
```

---

## Step 8 — Vercel にデプロイ

### 8-1. Vercel CLI をインストール・ログイン

```bash
npm install -g vercel
vercel login
```

### 8-2. プロジェクトをリンク

```bash
vercel link
```

プロンプトに従いプロジェクト名を設定する。

### 8-3. 環境変数を登録

```bash
vercel env add DATABASE_URL production
# → Neon の接続文字列を貼り付けて Enter

vercel env add NEXT_PUBLIC_BASE_URL production
# → https://your-project.vercel.app

vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_PUBLISHABLE_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production

# メール送信を使う場合
vercel env add SMTP_HOST production
vercel env add SMTP_PORT production
vercel env add SMTP_USER production
vercel env add SMTP_PASS production
vercel env add EMAIL_FROM production
```

### 8-4. デプロイ実行

```bash
vercel deploy --prod
```

デプロイ完了後に本番URLが表示される。

---

## Step 9 — Stripe Webhook の設定

Stripe ダッシュボード → Developers → Webhooks → 「Add endpoint」

| 項目 | 値 |
|---|---|
| Endpoint URL | `https://your-project.vercel.app/api/webhooks/stripe` |
| Events | `checkout.session.completed` / `checkout.session.expired` |

「Signing secret」をコピーして Vercel の `STRIPE_WEBHOOK_SECRET` に設定し、再デプロイ：

```bash
vercel env rm STRIPE_WEBHOOK_SECRET production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel deploy --prod
```

---

## Step 10 — 初期設定（管理画面）

本番URLの `/admin` にログインして以下を設定する：

| 設定箇所 | 内容 |
|---|---|
| 共通設定 | サイト名・ロゴ・Stripe キー・SMTP |
| キャンペーン編集 | タイトル・説明・目標金額・終了日・ヒーロー画像 |
| リターン管理 | リターン内容・金額・定員数 |
| メールテンプレート | 支援完了メールの文面 |
| 法的ページ | 特定商取引法・プライバシーポリシー・利用規約 |

> **本番環境ではパスワードを必ず変更してください。**
> 管理画面 → 管理ユーザー → パスワード変更

---

## トラブルシューティング

**`DATABASE_URL` エラー**
→ `.env.local` の接続文字列末尾に `?sslmode=require` が付いているか確認

**ログインできない**
→ `node --env-file=.env.local scripts/seed-admin.mjs` を再実行してパスワードをリセット

**Stripe Webhook が届かない**
→ ローカルテストは `stripe listen --forward-to localhost:3000/api/webhooks/stripe` を使う（Stripe CLI が必要）

**メールが届かない**
→ 管理画面 → 共通設定 → メール設定の SMTP 情報を確認。Gmail はアプリパスワードが必要
