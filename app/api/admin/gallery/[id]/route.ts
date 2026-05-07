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
  const fields = Object.entries(body)
  if (fields.length === 0) return NextResponse.json({ error: "No fields" }, { status: 400 })

  if ("is_active" in body) {
    await sql`UPDATE gallery_photos SET is_active = ${body.is_active}, updated_at = NOW() WHERE id = ${Number(id)}`
  }
  if ("caption" in body) {
    await sql`UPDATE gallery_photos SET caption = ${body.caption}, updated_at = NOW() WHERE id = ${Number(id)}`
  }
  if ("sort_order" in body) {
    await sql`UPDATE gallery_photos SET sort_order = ${body.sort_order}, updated_at = NOW() WHERE id = ${Number(id)}`
  }
  if ("image_url" in body) {
    await sql`UPDATE gallery_photos SET image_url = ${body.image_url}, updated_at = NOW() WHERE id = ${Number(id)}`
  }
  revalidatePath("/", "layout")
  revalidatePath("/", "page")
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await sql`DELETE FROM gallery_photos WHERE id = ${Number(id)}`
  revalidatePath("/", "layout")
  revalidatePath("/", "page")
  return NextResponse.json({ success: true })
}
