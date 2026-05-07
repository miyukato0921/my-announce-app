import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import sql from "@/lib/db"

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_session")?.value

  if (token) {
    await sql`DELETE FROM admin_sessions WHERE token = ${token}`
  }

  const response = NextResponse.json({ success: true })
  response.cookies.delete("admin_session")
  return response
}
