import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"
import { sendRawEmail } from "@/lib/email"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const rows = await sql`
    SELECT r.*, p.supporter_email
    FROM receipts r
    LEFT JOIN pledges p ON p.id = r.pledge_id
    WHERE r.id = ${Number(id)}
  `
  const receipt = rows[0] as any
  if (!receipt) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const email = receipt.supporter_email
  if (!email) return NextResponse.json({ error: "メールアドレスが見つかりません（支援と紐づけてください）" }, { status: 400 })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const receiptUrl = `${baseUrl}/receipt/${receipt.download_token}`

  await sendRawEmail({
    to: email,
    subject: `領収書（${receipt.receipt_number}）`,
    text: `${receipt.supporter_name} 様\n\nご支援ありがとうございます。\n領収書をお届けいたします。\n\n領収書番号: ${receipt.receipt_number}\n金額: ¥${Number(receipt.amount).toLocaleString()}\n但し書き: ${receipt.proviso}\n\n以下のリンクから領収書を表示・印刷できます（何度でもアクセス可能）:\n${receiptUrl}\n\n${receipt.issuer_name}`,
    html: `<p>${receipt.supporter_name} 様</p><p>ご支援ありがとうございます。<br>領収書をお届けいたします。</p><table style="border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold">領収書番号</td><td style="padding:8px 12px;border:1px solid #ddd">${receipt.receipt_number}</td></tr><tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold">金額</td><td style="padding:8px 12px;border:1px solid #ddd">¥${Number(receipt.amount).toLocaleString()}</td></tr><tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold">但し書き</td><td style="padding:8px 12px;border:1px solid #ddd">${receipt.proviso}</td></tr></table><p><a href="${receiptUrl}" style="display:inline-block;background:#2D6A4F;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">領収書を表示・印刷</a></p><p style="font-size:12px;color:#666">※ このリンクから何度でもアクセスできます。</p><p>${receipt.issuer_name}</p>`,
  })

  await sql`UPDATE receipts SET email_sent = true, email_sent_at = NOW() WHERE id = ${Number(id)}`
  return NextResponse.json({ success: true })
}
