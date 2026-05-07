import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = await sql`
    SELECT r.*, p.supporter_email
    FROM receipts r LEFT JOIN pledges p ON p.id = r.pledge_id
    ORDER BY r.receipt_number ASC
  `

  const headers = ["領収書番号","支援ID","宛名","金額","但し書き","発行日","発行者","メールアドレス","メール送信","ステータス","備考","作成日"]
  const esc = (v: unknown) => {
    if (v == null) return ""
    const s = String(v)
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [
    headers.join(","),
    ...rows.map((r: any) => [
      r.receipt_number, r.pledge_id ?? "", r.supporter_name, r.amount, r.proviso,
      r.issued_date ? new Date(r.issued_date).toISOString().slice(0, 10) : "",
      r.issuer_name, r.supporter_email ?? "",
      r.email_sent ? "送信済" : "未送信", r.status, r.notes ?? "",
      r.created_at ? new Date(r.created_at).toLocaleString("ja-JP") : "",
    ].map(esc).join(","))
  ]

  return new NextResponse("\uFEFF" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="receipts_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
