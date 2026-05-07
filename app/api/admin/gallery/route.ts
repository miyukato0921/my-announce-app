import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const campaign_id = searchParams.get("campaign_id")
  const photos = await sql`SELECT * FROM gallery_photos WHERE campaign_id = ${Number(campaign_id)} ORDER BY sort_order`
  return NextResponse.json(photos)
}

export async function POST(request: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { campaign_id, image_url, caption, sort_order } = await request.json()
  if (!image_url) return NextResponse.json({ error: "image_url required" }, { status: 400 })
  await sql`
    INSERT INTO gallery_photos (campaign_id, image_url, caption, sort_order, is_active)
    VALUES (${campaign_id}, ${image_url}, ${caption || ""}, ${sort_order ?? 0}, true)
  `
  revalidatePath("/", "layout")
  revalidatePath("/", "page")
  return NextResponse.json({ success: true })
}

// 一括 sort_order 更新: body = [{ id, sort_order }, ...]
export async function PUT(request: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const items: { id: number; sort_order: number }[] = await request.json()
  await Promise.all(
    items.map(({ id, sort_order }) =>
      sql`UPDATE gallery_photos SET sort_order = ${sort_order} WHERE id = ${id}`
    )
  )
  revalidatePath("/", "layout")
  revalidatePath("/", "page")
  return NextResponse.json({ success: true })
}
