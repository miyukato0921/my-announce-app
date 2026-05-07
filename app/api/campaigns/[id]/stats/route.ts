import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const campaignId = parseInt(id)
  if (isNaN(campaignId)) {
    return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 })
  }

  const result = await sql`
    SELECT
      c.goal_amount,
      COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status = 'completed'), 0) AS current_amount,
      COUNT(p.id) FILTER (WHERE p.payment_status = 'completed') AS supporter_count
    FROM campaigns c
    LEFT JOIN pledges p ON p.campaign_id = c.id
    WHERE c.id = ${campaignId}
    GROUP BY c.id
  `
  if (!result[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(result[0])
}
