import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const rows = await sql`SELECT * FROM reward_tiers WHERE id = ${Number(id)} LIMIT 1`
  const src = rows[0]
  if (!src) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await sql`
    INSERT INTO reward_tiers (
      campaign_id, title, description, amount, limit_count,
      image_url, delivery_date, sort_order, is_active,
      title_en, description_en, title_ko, description_ko, title_zh, description_zh
    ) VALUES (
      ${src.campaign_id},
      ${"【複製】" + src.title},
      ${src.description},
      ${src.amount},
      ${src.limit_count},
      ${src.image_url},
      ${src.delivery_date},
      ${src.sort_order + 1},
      false,
      ${src.title_en},
      ${src.description_en},
      ${src.title_ko},
      ${src.description_ko},
      ${src.title_zh},
      ${src.description_zh}
    )
  `

  return NextResponse.json({ success: true })
}
