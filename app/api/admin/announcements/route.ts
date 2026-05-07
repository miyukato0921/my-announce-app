import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = await sql`SELECT * FROM announcements ORDER BY created_at DESC`
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()

    if (!body.title) {
      return NextResponse.json({ error: "タイトルは必須です。" }, { status: 400 })
    }

    const is_published = body.is_published ?? false
    const published_at = is_published ? new Date().toISOString() : null

    const rows = await sql`
      INSERT INTO announcements (title, content, is_published, published_at)
      VALUES (${body.title}, ${body.content || null}, ${is_published}, ${published_at})
      RETURNING *
    `
    return NextResponse.json(rows[0], { status: 201 })
  } catch (err) {
    console.error("[announcements POST]", err)
    return NextResponse.json({ error: "サーバーエラーが発生しました。" }, { status: 500 })
  }
}
