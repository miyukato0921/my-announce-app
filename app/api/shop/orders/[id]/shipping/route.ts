import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const orderId = parseInt(id)
    const { shipping_name, shipping_postal_code, shipping_address, shipping_phone } = await request.json()

    if (!shipping_name || !shipping_postal_code || !shipping_address) {
      return NextResponse.json({ error: "お名前・郵便番号・住所は必須です" }, { status: 400 })
    }

    await sql`
      UPDATE shop_orders SET
        shipping_name         = ${shipping_name},
        shipping_postal_code  = ${shipping_postal_code},
        shipping_address      = ${shipping_address},
        shipping_phone        = ${shipping_phone || null},
        shipping_status       = 'waiting',
        updated_at            = NOW()
      WHERE id = ${orderId}
    `

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[shop/orders/shipping]", err)
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 })
  }
}
