import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"

// PATCH: ユーザー情報・パスワード更新
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
  }
  if (session.role !== "super_admin") {
    return NextResponse.json({ error: "スーパー管理者のみ実行できます" }, { status: 403 })
  }

  const { id } = await params
  const userId = Number(id)
  const { name, role, password } = await req.json()

  const allowedRole = role === "super_admin" ? "super_admin" : "admin"

  if (password && password.length > 0) {
    if (password.length < 8) {
      return NextResponse.json({ error: "パスワードは8文字以上にしてください" }, { status: 400 })
    }
    const hash = await bcrypt.hash(password, 12)
    await sql`
      UPDATE admin_users SET name = ${name}, role = ${allowedRole}, password_hash = ${hash}
      WHERE id = ${userId}
    `
  } else {
    await sql`
      UPDATE admin_users SET name = ${name}, role = ${allowedRole}
      WHERE id = ${userId}
    `
  }

  return NextResponse.json({ success: true })
}

// DELETE: ユーザー削除
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
  }
  if (session.role !== "super_admin") {
    return NextResponse.json({ error: "スーパー管理者のみ実行できます" }, { status: 403 })
  }

  const { id } = await params
  const userId = Number(id)

  // 自分自身は削除不可
  if (userId === session.id) {
    return NextResponse.json({ error: "自分自身は削除できません" }, { status: 400 })
  }

  await sql`DELETE FROM admin_sessions WHERE admin_user_id = ${userId}`
  await sql`DELETE FROM admin_users WHERE id = ${userId}`

  return NextResponse.json({ success: true })
}
