import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/auth"
import sql from "@/lib/db"

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const templates = await sql`SELECT * FROM email_templates ORDER BY id ASC`
  return NextResponse.json(templates)
}
