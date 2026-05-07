import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rows = await sql`
    UPDATE announcements
    SET likes = likes + 1
    WHERE id = ${id} AND published = true
    RETURNING likes
  `
  if (!rows[0]) return NextResponse.json({ error: "not found" }, { status: 404 })
  return NextResponse.json({ likes: rows[0].likes })
}
