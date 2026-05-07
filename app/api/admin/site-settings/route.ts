import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"

export async function GET() {
  const rows = await sql`SELECT key, value FROM site_settings`
  const settings: Record<string, string> = {}
  for (const row of rows) settings[row.key] = row.value
  return NextResponse.json(settings)
}

export async function POST(request: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body: Record<string, string> = await request.json()
  for (const [key, value] of Object.entries(body)) {
    await sql`
      INSERT INTO site_settings (key, value)
      VALUES (${key}, ${value})
      ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = NOW()
    `
  }
  return NextResponse.json({ success: true })
}
