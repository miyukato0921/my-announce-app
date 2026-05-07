import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const link = await sql`SELECT * FROM shortlinks WHERE id = ${Number(id)}`
  if (!link[0]) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const stats = await sql`
    SELECT detected_platform, COUNT(*)::int as count
    FROM shortlink_clicks WHERE shortlink_id = ${Number(id)}
    GROUP BY detected_platform ORDER BY count DESC
  `
  const recent = await sql`
    SELECT detected_platform, clicked_at
    FROM shortlink_clicks WHERE shortlink_id = ${Number(id)}
    ORDER BY clicked_at DESC LIMIT 50
  `
  return NextResponse.json({ link: link[0], stats, recent })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  await sql`
    UPDATE shortlinks SET
      title = ${body.title ?? ""},
      url_default = ${body.url_default},
      url_line = ${body.url_line || null},
      url_ios = ${body.url_ios || null},
      url_android = ${body.url_android || null},
      url_chrome = ${body.url_chrome || null},
      url_pc = ${body.url_pc || null},
      is_active = ${body.is_active ?? true},
      updated_at = NOW()
    WHERE id = ${Number(id)}
  `
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await sql`DELETE FROM shortlinks WHERE id = ${Number(id)}`
  return NextResponse.json({ success: true })
}
