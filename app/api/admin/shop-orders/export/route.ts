import { NextResponse } from "next/server"
import { getAdminSession } from "@/lib/auth"
import sql from "@/lib/db"

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = await sql`
    SELECT
      so.id,
      so.product_name,
      so.product_price,
      so.buyer_name,
      so.buyer_email,
      so.payment_status,
      so.requires_shipping,
      so.shipping_status,
      so.shipping_name,
      so.shipping_postal_code,
      so.shipping_address,
      so.shipping_phone,
      so.shipped_at,
      so.message,
      so.created_at
    FROM shop_orders so
    ORDER BY so.created_at DESC
  `

  const headers = [
    "ID", "商品名", "金額(円)", "購入者名", "メールアドレス",
    "支払いステータス", "配送要否", "発送ステータス",
    "配送先氏名", "郵便番号", "住所", "電話番号",
    "発送日", "メッセージ", "注文日時",
  ]

  const escape = (v: unknown) => {
    if (v === null || v === undefined) return ""
    const s = String(v)
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  const toJST = (d: string) => {
    const ms = new Date(d).getTime()
    const jst = new Date(ms + 9 * 60 * 60 * 1000)
    return `${jst.getUTCFullYear()}/${jst.getUTCMonth() + 1}/${jst.getUTCDate()} ${String(jst.getUTCHours()).padStart(2, "0")}:${String(jst.getUTCMinutes()).padStart(2, "0")}`
  }

  const lines = [
    headers.join(","),
    ...rows.map((r: any) =>
      [
        r.id,
        r.product_name,
        r.product_price,
        r.buyer_name,
        r.buyer_email,
        r.payment_status,
        r.requires_shipping ? "はい" : "いいえ",
        r.shipping_status ?? "",
        r.shipping_name ?? "",
        r.shipping_postal_code ?? "",
        r.shipping_address ?? "",
        r.shipping_phone ?? "",
        r.shipped_at ? toJST(r.shipped_at) : "",
        r.message ?? "",
        r.created_at ? toJST(r.created_at) : "",
      ].map(escape).join(",")
    ),
  ]

  const csv = "\uFEFF" + lines.join("\r\n")
  const filename = `shop_orders_${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
