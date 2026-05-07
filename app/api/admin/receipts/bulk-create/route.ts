import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"
import { sendRawEmail } from "@/lib/email"
import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { pledge_ids, send_email } = await req.json()
  if (!Array.isArray(pledge_ids) || pledge_ids.length === 0) {
    return NextResponse.json({ error: "pledge_ids is required" }, { status: 400 })
  }

  // Get default template
  const templates = await sql`SELECT * FROM receipt_templates ORDER BY is_default DESC, id ASC LIMIT 1`
  const tpl = templates[0] as any
  if (!tpl) return NextResponse.json({ error: "領収書テンプレートが未設定です" }, { status: 400 })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  let created = 0
  let emailed = 0
  let skipped = 0

  for (const pledgeId of pledge_ids) {
    // Fetch pledge
    const pledges = await sql`
      SELECT id, supporter_name, supporter_email, amount
      FROM pledges WHERE id = ${pledgeId} AND payment_status = 'completed'
    `
    const pledge = pledges[0] as any
    if (!pledge) { skipped++; continue }

    // Check if receipt already exists
    const existing = await sql`SELECT id FROM receipts WHERE pledge_id = ${pledgeId} LIMIT 1`
    if (existing.length > 0) { skipped++; continue }

    // Atomically get and increment next_number
    const updated = await sql`
      UPDATE receipt_templates SET next_number = next_number + 1, updated_at = NOW()
      WHERE id = ${tpl.id} RETURNING next_number - 1 AS current_number
    `
    const currentNumber = (updated[0] as any).current_number
    const receiptNumber = `${tpl.prefix}-${String(currentNumber).padStart(6, "0")}`
    const downloadToken = crypto.randomBytes(32).toString("hex")

    await sql`
      INSERT INTO receipts (receipt_number, pledge_id, template_id, supporter_name, amount, proviso, issued_date, issuer_name, issuer_address, download_token)
      VALUES (
        ${receiptNumber}, ${pledgeId}, ${tpl.id},
        ${pledge.supporter_name || "支援者"}, ${Number(pledge.amount)},
        ${tpl.default_proviso || "クラウドファンディング支援金として"},
        ${new Date().toISOString().slice(0, 10)},
        ${tpl.issuer_name}, ${tpl.issuer_address || null},
        ${downloadToken}
      )
    `
    created++

    // Send email if requested
    if (send_email && pledge.supporter_email) {
      try {
        const supporterName = pledge.supporter_name || "支援者"
        const receiptUrl = `${baseUrl}/receipt/${downloadToken}`
        await sendRawEmail({
          to: pledge.supporter_email,
          subject: `領収書（${receiptNumber}）`,
          text: `${supporterName} 様\n\n領収書をお届けいたします。\n\n領収書番号: ${receiptNumber}\n金額: ¥${Number(pledge.amount).toLocaleString()}\n\n以下のリンクから領収書を表示・印刷できます:\n${receiptUrl}\n\n${tpl.issuer_name}`,
          html: `<p>${supporterName} 様</p><p>領収書をお届けいたします。</p><p><a href="${receiptUrl}" style="display:inline-block;background:#2D6A4F;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">領収書を表示・印刷</a></p><p style="font-size:12px;color:#666">※ このリンクから何度でもアクセスできます。</p><p>${tpl.issuer_name}</p>`,
        })
        await sql`UPDATE receipts SET email_sent = true, email_sent_at = NOW() WHERE download_token = ${downloadToken}`
        emailed++
      } catch (err) {
        console.error(`[receipts/bulk-create] Email failed for pledge ${pledgeId}:`, err)
      }
    }
  }

  return NextResponse.json({ created, emailed, skipped })
}
