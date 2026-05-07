# クラウドファンディングプラットフォーム セットアップガイド

Next.js + Neon PostgreSQL + Stripe + Vercel による汎用クラウドファンディングサイトの立ち上げ手順です。

---

## 必要なアカウント

| サービス | 用途 | URL |
|---|---|---|
| GitHub | コード管理 | https://github.com |
| Neon | PostgreSQL データベース（無料枠あり） | https://neon.tech |
| Vercel | ホスティング（無料枠あり） | https://vercel.com |
| Stripe | 決済（テストモードは無料） | https://stripe.com/jp |

---

## 手順

### 1. リポジトリをクローン

```bash
git clone https://github.com/yuichikubo/crowdfunding-platform.git
cd crowdfunding-platform
pnpm install
```

> pnpm が未インストールの場合: `npm install -g pnpm`

---

### 2. Neon でデータベースを作成

1. https://neon.tech にサインアップ
2. 「New Project」を作成（プロジェクト名は任意）
3. ダッシュボードの「Connection string」をコピー
   ```
   postgresql://username:password@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

---

### 3. マイグレーション（テーブル作成）

Neon ダッシュボードの **SQL Editor** を開き、以下のファイルを **順番に** コピー＆ペーストして「Run」を実行してください。

| 順番 | ファイル | 内容 |
|---|---|---|
| 1 | `scripts/migrate.sql` | メインテーブル定義 + サンプルデータ |
| 2 | `scripts/add-site-settings.sql` | サイト設定テーブル |
| 3 | `scripts/add-email-templates.sql` | メールテンプレートテーブル |
| 4 | `scripts/add-receipts.sql` | 領収書テーブル |
| 5 | 下記SQL | ギャラリー・出演者テーブル |

**手順5（SQL Editor に貼り付けて実行）:**

```sql
CREATE TABLE IF NOT EXISTS gallery_photos (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  caption VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS performers (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255),
  bio TEXT,
  image_url VARCHAR(500),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### 4. Vercel にデプロイ

#### 4-1. Vercel CLI をインストール・ログイン

```bash
npm install -g vercel
vercel login
```

#### 4-2. GitHub リポジトリを作成してプッシュ（fork/clone した場合）

```bash
git remote set-url origin https://github.com/<あなたのユーザー名>/<リポジトリ名>.git
git push origin main
```

#### 4-3. Vercel プロジェクトを作成してリンク

```bash
vercel link --yes --scope <スコープ名>
```

#### 4-4. 環境変数を設定

```bash
vercel env add DATABASE_URL production
# → Neon の接続文字列を貼り付けてEnter

vercel env add NEXT_PUBLIC_BASE_URL production
# → デプロイ後のURL（例: https://your-project.vercel.app）

# Stripe を使う場合
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

#### 4-5. デプロイ実行

```bash
vercel deploy --prod --yes
```

デプロイが完了するとURLが表示されます。

---

### 5. 管理画面にログイン

デプロイ後、以下のデフォルト管理者アカウントでログインできます。

- **URL**: `https://あなたのドメイン/admin`
- **メール**: `admin@example.com`
- **パスワード**: `Admin1234!`

> **本番環境では必ずパスワードを変更してください。**
> 管理画面 → 管理ユーザー → パスワード変更

---

### 6. 初期設定

管理画面にログイン後、以下を設定してください。

| 設定箇所 | 内容 |
|---|---|
| 共通設定 | サイト名・ロゴ・メール設定・Stripeキー |
| キャンペーン編集 | タイトル・説明文・目標金額・期間・ヒーロー画像 |
| リターン管理 | リターン内容・金額・枚数制限 |
| 法的ページ編集 | 特定商取引法・プライバシーポリシー・利用規約 |

---

## ローカル開発

```bash
# .env.local を作成
cp .env.local.example .env.local  # ※ファイルがない場合は手動で作成

# 以下の内容を .env.local に記述
DATABASE_URL=postgresql://...（Neonの接続文字列）
NEXT_PUBLIC_BASE_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# 開発サーバー起動
pnpm dev
```

ブラウザで http://localhost:3000 を開いてください。

---

## 技術スタック

| 技術 | バージョン | 用途 |
|---|---|---|
| Next.js | 16 (App Router) | フロントエンド・API |
| React | 19 | UI |
| TypeScript | 5 | 型安全 |
| Tailwind CSS | 4 | スタイリング |
| shadcn/ui | - | UIコンポーネント |
| Neon PostgreSQL | - | データベース |
| Stripe | - | 決済処理 |
| Vercel | - | ホスティング |
| Vercel Blob | - | 画像アップロード |
| Nodemailer | - | メール送信 |

---

## フォルダ構成

```
.
├── app/
│   ├── page.tsx              # トップページ（キャンペーン表示）
│   ├── admin/                # 管理画面
│   ├── api/                  # APIルート
│   ├── checkout/             # 支援決済フロー
│   ├── shop/                 # ショップ
│   └── legal/                # 法的ページ
├── components/
│   ├── admin/                # 管理画面コンポーネント
│   ├── campaign/             # キャンペーン表示
│   ├── checkout/             # 決済フロー
│   └── ui/                   # shadcn/ui プリミティブ
├── lib/
│   ├── db.ts                 # DB接続
│   ├── email.ts              # メール送信
│   ├── stripe.ts             # Stripe設定
│   └── i18n.ts               # 多言語対応（ja/en/ko/zh）
└── scripts/                  # SQLマイグレーションファイル
```
