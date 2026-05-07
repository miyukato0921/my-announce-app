import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { pledge_ids } = await req.json()
  if (!pledge_ids?.length) return NextResponse.json({ error: "pledge_ids は必須です" }, { status: 400 })

  // 各支援のキャンペーン集計を戻す
  const pledges = await sql`
    SELECT id, campaign_id, amount, reward_tier_id, payment_status
    FROM pledges WHERE id = ANY(${pledge_ids})
  `

  for (const p of pledges) {
    const pledge = p as any
    if (pledge.payment_status === "completed") {
      await sql`
        UPDATE campaigns SET
          current_amount = GREATEST(0, current_amount - ${pledge.amount}),
          supporter_count = GREATEST(0, supporter_count - 1),
          updated_at = NOW()
        WHERE id = ${pledge.campaign_id}
      `
      if (pledge.reward_tier_id) {
        await sql`
          UPDATE reward_tiers SET
            claimed_count = GREATEST(0, claimed_count - 1),
            updated_at = NOW()
          WHERE id = ${pledge.reward_tier_id}
        `
      }
    }
  }

  await sql`DELETE FROM pledges WHERE id = ANY(${pledge_ids})`

  return NextResponse.json({ deleted: pledge_ids.length })
}
