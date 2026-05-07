import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { shipping_name, shipping_postal_code, shipping_address, shipping_phone } = body

  if (!shipping_name || !shipping_postal_code || !shipping_address) {
    return NextResponse.json({ error: "必須項目が入力されていません" }, { status: 400 })
  }

  // pledge が存在し completed かつ requires_shipping のリターンか確認
  const rows = await sql`
    SELECT p.id, p.payment_status, rt.requires_shipping
    FROM pledges p
    LEFT JOIN reward_tiers rt ON rt.id = p.reward_tier_id
    WHERE p.id = ${id}
    LIMIT 1
  `
  const pledge = rows[0] as any
  if (!pledge) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (pledge.payment_status !== "completed") {
    return NextResponse.json({ error: "決済が完了していません" }, { status: 400 })
  }

  await sql`
    UPDATE pledges SET
      shipping_name        = ${shipping_name},
      shipping_postal_code = ${shipping_postal_code},
      shipping_address     = ${shipping_address},
      shipping_phone       = ${shipping_phone ?? null},
      shipping_status      = 'waiting',
      updated_at           = NOW()
    WHERE id = ${id}
  `

  return NextResponse.json({ success: true })
}
