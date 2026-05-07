---
description: 新しいリソース（例：お知らせ、タグ）の管理ページを保護ルートにするとき、既存の getAdminSession() を使ってセッション認証を実装するパターンを使って実装するときに使う
---

# このSKILLが呼び出されたら、まず以下のカードを表示してください

┌─────────────────────────────────────┐
│  🟣 auth SKILL                       │
│  新しいページを保護ルートにする        │
│  既存の getAdminSession() を使用      │
│                                      │
│  参照: lib/auth.ts                   │
│  パターン: app/admin/(protected)/    │
└─────────────────────────────────────┘

カードを表示したら「では実装を進めます...」と言って実装してください。

## 追加できること

- 管理画面ページへのセッションガード（未認証なら `/admin/login` にリダイレクト）
- ログイン API ルート（bcrypt 検証・セッション発行・Cookie セット）
- ログアウト API ルート（セッション削除・Cookie クリア）
- 新しい管理ユーザーの初期パスワードハッシュ生成

## 使う既存ファイル

- `lib/auth.ts` — `getAdminSession()` の実装（`server-only`、Cookie → DB セッション検証）
- `app/api/admin/login/route.ts` — ログイン API の実装例（bcrypt 検証・自動マイグレーション）
- `lib/db.ts` — `admin_sessions` / `admin_users` テーブルへの直接 SQL

---

## セッション取得（サーバーサイド）

```ts
// lib/auth.ts
import "server-only"
import { cookies } from "next/headers"
import sql from "./db"
import { AdminUser } from "./db"

export async function getAdminSession(): Promise<AdminUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_session")?.value
  if (!token) return null

  const result = await sql`
    SELECT au.id, au.email, au.name, au.role, au.created_at
    FROM admin_sessions s
    JOIN admin_users au ON au.id = s.admin_user_id
    WHERE s.token = ${token} AND s.expires_at > NOW()
    LIMIT 1
  `
  return (result[0] as AdminUser) ?? null
}
```

---

## ログイン API ルート

```ts
// app/api/admin/login/route.ts
import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: "ユーザー名とパスワードを入力してください。" },
        { status: 400 }
      )
    }

    const users = await sql`
      SELECT id, email, password_hash FROM admin_users WHERE email = ${username} LIMIT 1
    `
    const user = users[0]

    if (!user) {
      return NextResponse.json(
        { error: "ユーザー名またはパスワードが正しくありません。" },
        { status: 401 }
      )
    }

    // bcrypt ハッシュ未適用の旧パスワードを自動マイグレーション
    let isValid = false
    if (user.password_hash && user.password_hash.startsWith("$2")) {
      isValid = await bcrypt.compare(password, user.password_hash)
    } else {
      isValid = user.password_hash === password
      if (isValid) {
        const hash = await bcrypt.hash(password, 10)
        await sql`UPDATE admin_users SET password_hash = ${hash} WHERE id = ${user.id}`
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "ユーザー名またはパスワードが正しくありません。" },
        { status: 401 }
      )
    }

    // セッショントークン生成（96文字の hex）・7日間有効
    const token = randomBytes(48).toString("hex")
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)

    await sql`
      INSERT INTO admin_sessions (admin_user_id, token, expires_at)
      VALUES (${user.id}, ${token}, ${expiresAt.toISOString()})
    `

    const response = NextResponse.json({ success: true })
    response.cookies.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    })

    return response
  } catch (err) {
    console.error("[admin/login]", err)
    return NextResponse.json({ error: "サーバーエラーが発生しました。" }, { status: 500 })
  }
}
```

---

## 保護ルート（Server Component）

```ts
// app/(protected)/admin/page.tsx
import { redirect } from "next/navigation"
import { getAdminSession } from "@/lib/auth"

export default async function AdminPage() {
  const session = await getAdminSession()
  if (!session) redirect("/admin/login")

  return <div>管理者: {session.name}</div>
}
```

---

## パターン集

### ログアウト API

```ts
// app/api/admin/logout/route.ts
import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_session")?.value
  if (token) {
    await sql`DELETE FROM admin_sessions WHERE token = ${token}`
  }
  const response = NextResponse.json({ success: true })
  response.cookies.delete("admin_session")
  return response
}
```

### パスワードハッシュ生成（初期セットアップ）

```ts
import bcrypt from "bcryptjs"

const hash = await bcrypt.hash("plaintext-password", 10)
// → admin_users.password_hash に保存
```

---

## 規則

- `getAdminSession()` は `"server-only"` モジュール — クライアントコンポーネントから直接呼ばない
- セッショントークンは `randomBytes(48).toString("hex")` で生成（96文字）
- Cookie は必ず `httpOnly: true` / `secure: production only` / `sameSite: "lax"` を設定
- ログイン失敗時のエラーメッセージはユーザー名・パスワードを区別しない（列挙攻撃対策）
- 平文パスワードが残っている場合はログイン成功時に自動で bcrypt へ移行する
