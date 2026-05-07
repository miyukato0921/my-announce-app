import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await request.json()
  await sql`
    UPDATE performers SET
      name = COALESCE(${body.name ?? null}, name),
      role = COALESCE(${body.role ?? null}, role),
      bio = COALESCE(${body.bio ?? null}, bio),
      image_url = CASE WHEN ${body.image_url !== undefined} THEN ${body.image_url || null} ELSE image_url END,
      is_active = COALESCE(${body.is_active ?? null}, is_active),
      name_en = COALESCE(${body.name_en ?? null}, name_en),
      role_en = COALESCE(${body.role_en ?? null}, role_en),
      bio_en = COALESCE(${body.bio_en ?? null}, bio_en),
      name_ko = COALESCE(${body.name_ko ?? null}, name_ko),
      role_ko = COALESCE(${body.role_ko ?? null}, role_ko),
      bio_ko = COALESCE(${body.bio_ko ?? null}, bio_ko),
      name_zh = COALESCE(${body.name_zh ?? null}, name_zh),
      role_zh = COALESCE(${body.role_zh ?? null}, role_zh),
      bio_zh = COALESCE(${body.bio_zh ?? null}, bio_zh),
      updated_at = NOW()
    WHERE id = ${Number(id)}
  `
  revalidatePath("/")
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await sql`DELETE FROM performers WHERE id = ${Number(id)}`
  revalidatePath("/")
  return NextResponse.json({ success: true })
}
