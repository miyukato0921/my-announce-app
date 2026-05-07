import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const orderId = parseInt(id)
  const body = await request.json()

  const fields: string[] = []
  const values: any[] = []

  if (body.shipping_status !== undefined) {
    await sql`
      UPDATE shop_orders SET
        shipping_status = ${body.shipping_status},
        shipped_at = ${body.shipping_status === "shipped" ? new Date().toISOString() : null},
        updated_at = NOW()
      WHERE id = ${orderId}
    `
  } else if (body.shipping_name !== undefined) {
    await sql`
      UPDATE shop_orders SET
        shipping_name        = ${body.shipping_name},
        shipping_postal_code = ${body.shipping_postal_code ?? null},
        shipping_address     = ${body.shipping_address ?? null},
        shipping_phone       = ${body.shipping_phone ?? null},
        updated_at           = NOW()
      WHERE id = ${orderId}
    `
  } else if (body.payment_status !== undefined) {
    await sql`
      UPDATE shop_orders SET payment_status = ${body.payment_status}, updated_at = NOW()
      WHERE id = ${orderId}
    `
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await sql`DELETE FROM shop_orders WHERE id = ${parseInt(id)}`
  return NextResponse.json({ success: true })
}
