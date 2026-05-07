import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const campaign_id = searchParams.get("campaign_id")
  const rows = await sql`SELECT * FROM performers WHERE campaign_id = ${Number(campaign_id)} ORDER BY sort_order`
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { campaign_id, name, role, bio, image_url, sort_order,
    name_en, role_en, bio_en, name_ko, role_ko, bio_ko, name_zh, role_zh, bio_zh } = await request.json()
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 })
  await sql`
    INSERT INTO performers (campaign_id, name, role, bio, image_url, sort_order, is_active,
      name_en, role_en, bio_en, name_ko, role_ko, bio_ko, name_zh, role_zh, bio_zh)
    VALUES (${campaign_id}, ${name}, ${role || ""}, ${bio || ""}, ${image_url || null}, ${sort_order ?? 0}, true,
      ${name_en || null}, ${role_en || null}, ${bio_en || null},
      ${name_ko || null}, ${role_ko || null}, ${bio_ko || null},
      ${name_zh || null}, ${role_zh || null}, ${bio_zh || null})
  `
  revalidatePath("/")
  return NextResponse.json({ success: true })
}

// 並び替え一括更新: body = [{ id, sort_order }, ...]
export async function PUT(request: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const items: { id: number; sort_order: number }[] = await request.json()
  await Promise.all(
    items.map(({ id, sort_order }) =>
      sql`UPDATE performers SET sort_order = ${sort_order}, updated_at = NOW() WHERE id = ${id}`
    )
  )
  revalidatePath("/")
  return NextResponse.json({ success: true })
}
