import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const links = await sql`
    SELECT s.*,
      (SELECT COUNT(*)::int FROM shortlink_clicks WHERE shortlink_id = s.id) as click_count,
      (SELECT COUNT(*)::int FROM shortlink_clicks WHERE shortlink_id = s.id AND clicked_at > NOW() - INTERVAL '24 hours') as clicks_24h
    FROM shortlinks s ORDER BY s.created_at DESC
  `
  return NextResponse.json(links)
}

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  let slug = body.slug?.trim().toLowerCase()

  if (!slug) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
    for (let i = 0; i < 10; i++) {
      slug = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
      const dup = await sql`SELECT id FROM shortlinks WHERE slug = ${slug}`
      if (dup.length === 0) break
    }
  }

  if (!body.url_default) return NextResponse.json({ error: "デフォルトURLは必須です" }, { status: 400 })

  const dup = await sql`SELECT id FROM shortlinks WHERE slug = ${slug}`
  if (dup.length > 0) return NextResponse.json({ error: "このスラグは既に使用されています" }, { status: 409 })

  const result = await sql`
    INSERT INTO shortlinks (slug, title, url_default, url_line, url_ios, url_android, url_chrome, url_pc)
    VALUES (${slug}, ${body.title || ""}, ${body.url_default}, ${body.url_line || null}, ${body.url_ios || null}, ${body.url_android || null}, ${body.url_chrome || null}, ${body.url_pc || null})
    RETURNING *
  `
  return NextResponse.json(result[0])
}
