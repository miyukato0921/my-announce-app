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
    UPDATE receipts SET
      supporter_name = COALESCE(${body.supporter_name ?? null}, supporter_name),
      amount = COALESCE(${body.amount ?? null}, amount),
      proviso = COALESCE(${body.proviso ?? null}, proviso),
      issued_date = COALESCE(${body.issued_date ?? null}, issued_date),
      issuer_name = COALESCE(${body.issuer_name ?? null}, issuer_name),
      issuer_address = COALESCE(${body.issuer_address ?? null}, issuer_address),
      notes = COALESCE(${body.notes ?? null}, notes),
      email_sent = COALESCE(${body.email_sent ?? null}, email_sent),
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
  await sql`DELETE FROM receipts WHERE id = ${Number(id)}`

  return NextResponse.json({ success: true })
}
