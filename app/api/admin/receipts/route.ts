import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const receipts = await sql`
    SELECT r.*, p.supporter_email, p.supporter_name as pledge_supporter_name
    FROM receipts r
    LEFT JOIN pledges p ON p.id = r.pledge_id
    ORDER BY r.created_at DESC
  `
  return NextResponse.json(receipts)
}

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { pledge_id, supporter_name, amount, proviso, issued_date, notes } = body

  if (!supporter_name || !amount) {
    return NextResponse.json({ error: "宛名と金額は必須です" }, { status: 400 })
  }

  // テンプレート取得
  const templates = await sql`SELECT * FROM receipt_templates ORDER BY is_default DESC, id ASC LIMIT 1`
  const tpl = templates[0] as any
  if (!tpl) return NextResponse.json({ error: "テンプレートが未設定です" }, { status: 400 })

  // 連番生成
  const receiptNumber = `${tpl.prefix}-${String(tpl.next_number).padStart(6, "0")}`
  const downloadToken = crypto.randomBytes(32).toString("hex")

  const result = await sql`
    INSERT INTO receipts (receipt_number, pledge_id, template_id, supporter_name, amount, proviso, issued_date, issuer_name, issuer_address, download_token, notes)
    VALUES (
      ${receiptNumber}, ${pledge_id || null}, ${tpl.id},
      ${supporter_name}, ${Number(amount)},
      ${proviso || tpl.default_proviso},
      ${issued_date || new Date().toISOString().slice(0, 10)},
      ${tpl.issuer_name}, ${tpl.issuer_address || null},
      ${downloadToken}, ${notes || null}
    ) RETURNING *
  `

  // 連番+1
  await sql`UPDATE receipt_templates SET next_number = next_number + 1, updated_at = NOW() WHERE id = ${tpl.id}`

  return NextResponse.json(result[0])
}
