import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  await sql`
    UPDATE receipt_templates SET
      name = COALESCE(${body.name ?? null}, name),
      issuer_name = COALESCE(${body.issuer_name ?? null}, issuer_name),
      issuer_address = ${body.issuer_address ?? null},
      issuer_tel = ${body.issuer_tel ?? null},
      issuer_email = COALESCE(${body.issuer_email ?? null}, issuer_email),
      logo_url = ${body.logo_url ?? null},
      stamp_url = ${body.stamp_url ?? null},
      prefix = COALESCE(${body.prefix ?? null}, prefix),
      default_proviso = COALESCE(${body.default_proviso ?? null}, default_proviso),
      footer_note = ${body.footer_note ?? null},
      updated_at = NOW()
    WHERE id = ${Number(id)}
  `

  return NextResponse.json({ success: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await sql`DELETE FROM receipt_templates WHERE id = ${Number(id)}`

  return NextResponse.json({ success: true })
}
