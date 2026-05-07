import sql from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const stats = await sql`
    SELECT detected_platform, COUNT(*)::int as count
    FROM shortlink_clicks
    WHERE shortlink_id = ${Number(id)}
    GROUP BY detected_platform
    ORDER BY count DESC
  `

  return NextResponse.json(stats)
}
