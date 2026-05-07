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
