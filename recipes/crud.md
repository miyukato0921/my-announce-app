# CRUD API Route Recipe

このプロジェクトの実装パターンをベースにした汎用 Next.js API Route テンプレート。
テーブル名・カラム名を差し替えるだけで使える。

---

## ファイル構成

```
app/api/admin/
  items/
    route.ts        ← GET（一覧）/ POST（新規作成）
    [id]/
      route.ts      ← GET（1件）/ PATCH（更新）/ DELETE（削除）
```

---

## route.ts（一覧・新規作成）

```ts
import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"

// GET /api/admin/items — 一覧取得
export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = await sql`
    SELECT * FROM items ORDER BY created_at DESC
  `
  return NextResponse.json(rows)
}

// POST /api/admin/items — 新規作成
export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  // バリデーション
  if (!body.title) {
    return NextResponse.json({ error: "title は必須です" }, { status: 400 })
  }

  const result = await sql`
    INSERT INTO items (title, description)
    VALUES (${body.title}, ${body.description || null})
    RETURNING *
  `
  return NextResponse.json(result[0])
}
```

---

## [id]/route.ts（1件操作）

```ts
import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"

// GET /api/admin/items/[id] — 1件取得
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const rows = await sql`SELECT * FROM items WHERE id = ${Number(id)}`
  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(rows[0])
}

// PATCH /api/admin/items/[id] — 部分更新
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  await sql`
    UPDATE items SET
      title       = ${body.title},
      description = ${body.description || null},
      updated_at  = NOW()
    WHERE id = ${Number(id)}
  `
  return NextResponse.json({ success: true })
}

// DELETE /api/admin/items/[id] — 削除
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await sql`DELETE FROM items WHERE id = ${Number(id)}`
  return NextResponse.json({ success: true })
}
```

---

## パターン集

### Upsert（INSERT または UPDATE）

`site_settings` のように「キーが存在すれば更新、なければ追加」したい場合。
`key` カラムに UNIQUE 制約が必要。

```ts
await sql`
  INSERT INTO site_settings (key, value)
  VALUES (${key}, ${value})
  ON CONFLICT (key) DO UPDATE SET
    value      = ${value},
    updated_at = NOW()
`
```

複数キーをまとめて保存するときはループで1件ずつ投げる（件数が少ない場合）：

```ts
for (const [key, value] of Object.entries(body)) {
  await sql`
    INSERT INTO site_settings (key, value)
    VALUES (${key}, ${value})
    ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = NOW()
  `
}
```

### クエリパラメータでフィルタ

```ts
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const campaignId = searchParams.get("campaign_id")

  const rows = await sql`
    SELECT * FROM gallery_photos
    WHERE campaign_id = ${Number(campaignId)}
    ORDER BY sort_order
  `
  return NextResponse.json(rows)
}
```

### 一括更新（PUT）

```ts
export async function PUT(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const items: { id: number; sort_order: number }[] = await req.json()

  await Promise.all(
    items.map(({ id, sort_order }) =>
      sql`UPDATE items SET sort_order = ${sort_order} WHERE id = ${id}`
    )
  )
  return NextResponse.json({ success: true })
}
```

### 重複チェック（UNIQUE 制約前の事前確認）

```ts
const dup = await sql`SELECT id FROM items WHERE slug = ${slug}`
if (dup.length > 0) {
  return NextResponse.json({ error: "このスラグは既に使用されています" }, { status: 409 })
}
```

### revalidatePath（公開ページのキャッシュを更新）

書き込み後に公開ページへ反映させたい場合に追加する。

```ts
import { revalidatePath } from "next/cache"

// POST / PATCH / DELETE の最後に
revalidatePath("/", "layout")
revalidatePath("/campaigns", "page")
```

---

## 規則

- 認証は全ハンドラの先頭で `getAdminSession()` を呼ぶ（GET も保護する場合は忘れずに）
- `params` は `Promise<{ id: string }>` — 必ず `await params` してから使う（Next.js 15 以降）
- ID は URL から文字列で来るため `Number(id)` でキャストしてからクエリに渡す
- エラーレスポンスは `{ error: "メッセージ" }` に統一し、適切な HTTP ステータスを返す
  - 400: バリデーションエラー
  - 401: 未認証
  - 404: レコードなし
  - 409: 重複
  - 500: サーバーエラー（try/catch で catch する）
- `RETURNING *` を使うと INSERT 結果をそのまま返せる
