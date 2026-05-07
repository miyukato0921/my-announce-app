import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/auth"
import sql from "@/lib/db"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await request.json()
  await sql`
    UPDATE email_templates SET
      name = COALESCE(${body.name ?? null}, name),
      subject = COALESCE(${body.subject ?? null}, subject),
      body = COALESCE(${body.body ?? null}, body),
      description = COALESCE(${body.description ?? null}, description),
      is_active = COALESCE(${body.is_active ?? null}, is_active),
      updated_at = NOW()
    WHERE id = ${Number(id)}
  `
  return NextResponse.json({ success: true })
}
