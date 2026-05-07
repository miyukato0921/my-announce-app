import { NextResponse } from "next/server"
import { getAdminSession } from "@/lib/auth"
import sql from "@/lib/db"

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = await sql`
    SELECT
      p.id,
      p.supporter_name,
      p.supporter_email,
      p.amount,
      p.payment_status,
      p.is_anonymous,
      p.message,
      p.shipping_status,
      p.shipping_name,
      p.shipping_postal_code,
      p.shipping_address,
      p.shipping_phone,
      rt.title  AS reward_title,
      c.title   AS campaign_title,
      p.created_at
    FROM pledges p
    LEFT JOIN reward_tiers rt ON rt.id = p.reward_tier_id
    LEFT JOIN campaigns    c  ON c.id  = p.campaign_id
    ORDER BY p.created_at DESC
  `

  const headers = [
    "ID", "支援者名", "メールアドレス", "支援額(円)", "支払いステータス",
    "匿名", "メッセージ", "発送ステータス", "発送先氏名", "郵便番号",
    "住所", "電話番号", "リターン", "キャンペーン", "支援日時",
  ]

  const escape = (v: unknown) => {
    if (v === null || v === undefined) return ""
    const s = String(v)
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  const lines = [
    headers.join(","),
    ...rows.map((r: any) =>
      [
        r.id,
        r.supporter_name,
        r.supporter_email,
        r.amount ? Math.round(r.amount / 100) : 0,
        r.payment_status,
        r.is_anonymous ? "はい" : "いいえ",
        r.message,
        r.shipping_status ?? "",
        r.shipping_name ?? "",
        r.shipping_postal_code ?? "",
        r.shipping_address ?? "",
        r.shipping_phone ?? "",
        r.reward_title ?? "",
        r.campaign_title ?? "",
        r.created_at ? new Date(r.created_at).toLocaleString("ja-JP") : "",
      ].map(escape).join(",")
    ),
  ]

  const csv = "\uFEFF" + lines.join("\r\n") // BOM付きUTF-8 (Excelで文字化けしない)
  const filename = `pledges_${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
