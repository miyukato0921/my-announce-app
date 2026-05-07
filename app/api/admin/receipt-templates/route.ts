import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const templates = await sql`
    SELECT * FROM receipt_templates ORDER BY is_default DESC, created_at DESC
  `
  return NextResponse.json(templates)
}

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  const result = await sql`
    INSERT INTO receipt_templates (
      name,
      issuer_name,
      issuer_address,
      issuer_tel,
      issuer_email,
      logo_url,
      stamp_url,
      prefix,
      default_proviso,
      footer_note,
      is_default
    ) VALUES (
      ${body.name},
      ${body.issuer_name},
      ${body.issuer_address || null},
      ${body.issuer_tel || null},
      ${body.issuer_email || null},
      ${body.logo_url || null},
      ${body.stamp_url || null},
      ${body.prefix || "CF"},
      ${body.default_proviso || "クラウドファンディング支援金として"},
      ${body.footer_note || null},
      ${body.is_default ?? true}
    )
    RETURNING *
  `

  return NextResponse.json(result[0])
}
