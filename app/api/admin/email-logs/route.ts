import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const logs = await sql`
    SELECT id, template_slug, to_address, subject, body, status, error_message, created_at
    FROM email_logs
    ORDER BY created_at DESC
    LIMIT 100
  `
  return NextResponse.json(logs)
}
