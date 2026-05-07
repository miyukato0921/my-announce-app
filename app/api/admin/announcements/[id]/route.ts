import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()

    if (!body.title) {
      return NextResponse.json({ error: "タイトルは必須です。" }, { status: 400 })
    }

    const existing = await sql`SELECT published_at FROM announcements WHERE id = ${Number(id)} LIMIT 1`
    if (!existing[0]) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const is_published = body.is_published ?? false
    const published_at = is_published && !existing[0].published_at
      ? new Date().toISOString()
      : existing[0].published_at

    const rows = await sql`
      UPDATE announcements SET
        title        = ${body.title},
        content      = ${body.content || null},
        is_published = ${is_published},
        published_at = ${published_at},
        updated_at   = NOW()
      WHERE id = ${Number(id)}
      RETURNING *
    `
    return NextResponse.json(rows[0])
  } catch (err) {
    console.error("[announcements PATCH]", err)
    return NextResponse.json({ error: "サーバーエラーが発生しました。" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params

    const existing = await sql`SELECT id FROM announcements WHERE id = ${Number(id)} LIMIT 1`
    if (!existing[0]) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await sql`DELETE FROM announcements WHERE id = ${Number(id)}`
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[announcements DELETE]", err)
    return NextResponse.json({ error: "サーバーエラーが発生しました。" }, { status: 500 })
  }
}
