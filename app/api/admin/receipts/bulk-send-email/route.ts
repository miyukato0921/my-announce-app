import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"
import { sendRawEmail } from "@/lib/email"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { receipt_ids } = await req.json()
  if (!Array.isArray(receipt_ids) || receipt_ids.length === 0) {
    return NextResponse.json({ error: "receipt_ids is required" }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  let sent = 0
  let failed = 0

  for (const receiptId of receipt_ids) {
    try {
      const rows = await sql`
        SELECT r.*, p.supporter_email
        FROM receipts r
        LEFT JOIN pledges p ON p.id = r.pledge_id
        WHERE r.id = ${receiptId}
      `
      const receipt = rows[0] as any
      if (!receipt || !receipt.supporter_email) { failed++; continue }

      const receiptUrl = `${baseUrl}/receipt/${receipt.download_token}`

      await sendRawEmail({
        to: receipt.supporter_email,
        subject: `領収書（${receipt.receipt_number}）`,
        text: `${receipt.supporter_name} 様\n\n領収書をお届けいたします。\n\n領収書番号: ${receipt.receipt_number}\n金額: ¥${Number(receipt.amount).toLocaleString()}\n\n以下のリンクから領収書を表示・印刷できます:\n${receiptUrl}\n\n${receipt.issuer_name}`,
        html: `<p>${receipt.supporter_name} 様</p><p>領収書をお届けいたします。</p><p><a href="${receiptUrl}" style="display:inline-block;background:#2D6A4F;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">領収書を表示・印刷</a></p><p style="font-size:12px;color:#666">※ このリンクから何度でもアクセスできます。</p><p>${receipt.issuer_name}</p>`,
      })

      await sql`UPDATE receipts SET email_sent = true, email_sent_at = NOW() WHERE id = ${receiptId}`
      sent++
    } catch (err) {
      console.error(`[receipts/bulk-send-email] Failed for receipt ${receiptId}:`, err)
      failed++
    }
  }

  return NextResponse.json({ sent, failed })
}
