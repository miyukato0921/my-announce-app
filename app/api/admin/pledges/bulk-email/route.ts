import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"
import { sendRawEmail } from "@/lib/email"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { pledge_ids, subject, body } = await req.json()

  if (!pledge_ids?.length || !subject || !body) {
    return NextResponse.json({ error: "pledge_ids, subject, body は必須です" }, { status: 400 })
  }

  // 対象支援者のメールアドレスを取得
  const pledges = await sql`
    SELECT id, supporter_name, supporter_email, amount
    FROM pledges WHERE id = ANY(${pledge_ids}) AND supporter_email IS NOT NULL
  `

  let sent = 0
  let failed = 0

  for (const p of pledges) {
    try {
      // テンプレート変数を置換
      const rendered = body
        .replace(/\{\{supporter_name\}\}/g, (p as any).supporter_name || "サポーター")
        .replace(/\{\{amount\}\}/g, `¥${Number((p as any).amount).toLocaleString()}`)
        .replace(/\{\{email\}\}/g, (p as any).supporter_email)

      const renderedSubject = subject
        .replace(/\{\{supporter_name\}\}/g, (p as any).supporter_name || "サポーター")

      await sendRawEmail({
        to: (p as any).supporter_email,
        subject: renderedSubject,
        text: rendered,
      })
      sent++
    } catch {
      failed++
    }
  }

  return NextResponse.json({ sent, failed, total: pledges.length })
}
