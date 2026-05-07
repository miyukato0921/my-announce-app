import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"

// POST: 新規管理者ユーザー追加
export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
  }
  if (session.role !== "super_admin") {
    return NextResponse.json({ error: "スーパー管理者のみ実行できます" }, { status: 403 })
  }

  const { email, name, password, role } = await req.json()

  if (!email || !name || !password) {
    return NextResponse.json({ error: "メール・名前・パスワードは必須です" }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "パスワードは8文字以上にしてください" }, { status: 400 })
  }

  const existing = await sql`SELECT id FROM admin_users WHERE email = ${email}`
  if (existing.length > 0) {
    return NextResponse.json({ error: "このメールアドレスは既に登録されています" }, { status: 409 })
  }

  const hash = await bcrypt.hash(password, 12)
  const allowedRole = role === "super_admin" ? "super_admin" : "admin"

  const result = await sql`
    INSERT INTO admin_users (email, name, password_hash, role)
    VALUES (${email}, ${name}, ${hash}, ${allowedRole})
    RETURNING id, email, name, role, created_at
  `

  return NextResponse.json({ user: result[0] }, { status: 201 })
}
