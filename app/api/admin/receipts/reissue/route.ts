import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"
import { sendRawEmail } from "@/lib/email"
import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { receipt_id, send_email } = await req.json()
  if (!receipt_id) return NextResponse.json({ error: "receipt_id is required" }, { status: 400 })

  // Fetch original receipt
  const origRows = await sql`
    SELECT r.*, p.supporter_email
    FROM receipts r
    LEFT JOIN pledges p ON p.id = r.pledge_id
    WHERE r.id = ${receipt_id}
  `
  const orig = origRows[0] as any
  if (!orig) return NextResponse.json({ error: "領収書が見つかりません" }, { status: 404 })

  // Get template for numbering
  const templates = await sql`SELECT * FROM receipt_templates ORDER BY is_default DESC, id ASC LIMIT 1`
  const tpl = templates[0] as any
  if (!tpl) return NextResponse.json({ error: "テンプレートが未設定です" }, { status: 400 })

  // Atomically get and increment next_number
  const updated = await sql`
    UPDATE receipt_templates SET next_number = next_number + 1, updated_at = NOW()
    WHERE id = ${tpl.id} RETURNING next_number - 1 AS current_number
  `
  const currentNumber = (updated[0] as any).current_number
  const receiptNumber = `${tpl.prefix}-${String(currentNumber).padStart(6, "0")}`
  const downloadToken = crypto.randomBytes(32).toString("hex")

  // Create reissued receipt
  const result = await sql`
    INSERT INTO receipts (
      receipt_number, pledge_id, template_id, supporter_name, amount, proviso,
      issued_date, issuer_name, issuer_address, download_token, reissued, reissue_of, notes
    ) VALUES (
      ${receiptNumber}, ${orig.pledge_id}, ${tpl.id},
      ${orig.supporter_name}, ${orig.amount}, ${orig.proviso},
      ${new Date().toISOString().slice(0, 10)},
      ${tpl.issuer_name}, ${tpl.issuer_address || null},
      ${downloadToken}, true, ${receipt_id},
      ${"再発行（元: " + orig.receipt_number + "）"}
    ) RETURNING *
  `

  const newReceipt = result[0] as any

  // Send email if requested
  let emailSent = false
  let emailError: string | null = null
  if (send_email) {
    if (!orig.supporter_email) {
      emailError = "メールアドレスが見つかりません（支援と紐づけてください）"
    } else {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
        const receiptUrl = `${baseUrl}/receipt/${downloadToken}`

        await sendRawEmail({
          to: orig.supporter_email,
          subject: `領収書（${receiptNumber}）（再発行）`,
          text: `${orig.supporter_name || "支援者"} 様\n\n領収書（再発行）をお届けいたします。\n\n領収書番号: ${receiptNumber}\n金額: ¥${Number(orig.amount).toLocaleString()}\n\n以下のリンクから領収書を表示・印刷できます:\n${receiptUrl}\n\n${tpl.issuer_name}`,
          html: `<p>${orig.supporter_name || "支援者"} 様</p><p>領収書（再発行）をお届けいたします。</p><p><a href="${receiptUrl}" style="display:inline-block;background:#2D6A4F;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">領収書を表示・印刷</a></p><p style="font-size:12px;color:#666">※ このリンクから何度でもアクセスできます。</p><p>${tpl.issuer_name}</p>`,
        })
        await sql`UPDATE receipts SET email_sent = true, email_sent_at = NOW() WHERE id = ${newReceipt.id}`
        emailSent = true
      } catch (err: any) {
        console.error("[receipts/reissue] Email failed:", err)
        emailError = err?.message || "メール送信に失敗しました"
      }
    }
  }

  return NextResponse.json({ receipt: newReceipt, email_sent: emailSent, email_error: emailError })
}
