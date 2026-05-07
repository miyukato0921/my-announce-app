---
description: 新しいリソース（例：お知らせ、タグ）のテーブルクエリを追加するとき、既存テーブルに新しいカラムを追加してデータを取得するパターンを使って実装するときに使う
---

## 追加できること

- テーブルの一覧・1件・条件付き取得クエリ
- INSERT / UPDATE / DELETE クエリ（`RETURNING *` 対応）
- 多言語カラム（`title` / `title_en` / `title_ko` / `title_zh`）の読み書き
- API ルートへの DB クエリ組み込み

## 使う既存ファイル

- `lib/db.ts` — `sql` プロキシクライアントと型定義（`Campaign`, `RewardTier`, `Pledge`, `AdminUser`, `Product`）
- `DATABASE_URL` 環境変数（Neon PostgreSQL 接続文字列）

---

## クライアント初期化

```ts
// lib/db.ts からデフォルトエクスポートをインポートするだけで使える
import sql from "@/lib/db"
```

`sql` は遅延初期化プロキシ。`DATABASE_URL` 環境変数が必須。

---

## 基本クエリパターン

### 全件取得

```ts
const rows = await sql`SELECT * FROM campaigns ORDER BY created_at DESC`
```

### 1件取得

```ts
const rows = await sql`SELECT * FROM campaigns WHERE id = ${id} LIMIT 1`
const campaign = rows[0] ?? null
```

### 条件付き検索

```ts
const rows = await sql`
  SELECT * FROM campaigns
  WHERE status = ${'active'}
  ORDER BY created_at DESC
`
```

### INSERT（戻り値あり）

```ts
const rows = await sql`
  INSERT INTO campaigns (title, goal_amount, status)
  VALUES (${title}, ${goalAmount}, ${'draft'})
  RETURNING *
`
const created = rows[0]
```

### UPDATE

```ts
await sql`
  UPDATE campaigns
  SET title = ${title}, updated_at = NOW()
  WHERE id = ${id}
`
```

### DELETE

```ts
await sql`DELETE FROM campaigns WHERE id = ${id}`
```

---

## 型定義（lib/db.ts からエクスポート）

| 型名 | 対応テーブル |
|------|------------|
| `Campaign` | `campaigns` |
| `RewardTier` | `reward_tiers` |
| `Pledge` | `pledges` |
| `AdminUser` | `admin_users` |
| `Product` | `products` |

```ts
import sql, { type Campaign } from "@/lib/db"

const rows = await sql`SELECT * FROM campaigns WHERE id = ${id} LIMIT 1`
const campaign = rows[0] as Campaign ?? null
```

---

## 多言語カラムパターン

日本語がプライマリ（サフィックスなし）、他言語はサフィックス付き。

```ts
// 取得
const rows = await sql`SELECT title, title_en, title_ko, title_zh FROM campaigns`

// 保存
await sql`
  UPDATE campaigns
  SET title = ${ja}, title_en = ${en}, title_ko = ${ko}, title_zh = ${zh}
  WHERE id = ${id}
`
```

---

## API ルートでの使用例

```ts
// app/api/admin/campaigns/route.ts
import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import { type Campaign } from "@/lib/db"

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM campaigns ORDER BY created_at DESC`
    return NextResponse.json(rows as Campaign[])
  } catch (err) {
    console.error("[campaigns GET]", err)
    return NextResponse.json({ error: "サーバーエラーが発生しました。" }, { status: 500 })
  }
}
```

---

## 規則

- ORM は使わない — `sql` テンプレートリテラルで直接 SQL を書く
- 変数は必ずテンプレートリテラルの補間（`${}`）で渡す — 文字列結合は SQL インジェクションの原因になる
- 1件取得は `LIMIT 1` を付け、`rows[0] ?? null` で受ける
- INSERT で作成したレコードが必要な場合は `RETURNING *` を使う
- エラーは `console.error("[route名]", err)` でログを残し、クライアントには汎用メッセージを返す
