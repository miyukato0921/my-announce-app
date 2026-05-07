import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import sql from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { session_id } = await req.json()
    if (!session_id) {
      return NextResponse.json({ error: "session_id is required" }, { status: 400 })
    }

    // Verify payment with Stripe
    const stripeClient = await getStripe()
    const session = await stripeClient.checkout.sessions.retrieve(session_id)
    if (session.payment_status !== "paid") {
      return NextResponse.json({ status: "pending" })
    }

    const { campaign_id, reward_tier_id } = session.metadata ?? {}
    const amount = session.amount_total ?? 0
    const campaignId = parseInt(campaign_id ?? "0")
    const rewardTierId = reward_tier_id ? parseInt(reward_tier_id) : null

    // Check if already processed (idempotency guard)
    const existing = await sql`
      SELECT payment_status FROM pledges
      WHERE stripe_session_id = ${session_id}
      LIMIT 1
    `

    if (existing[0]?.payment_status !== "completed") {
      // Mark pledge as completed
      await sql`
        UPDATE pledges
        SET
          payment_status = 'completed',
          stripe_payment_intent_id = ${session.payment_intent as string | null},
          updated_at = NOW()
        WHERE stripe_session_id = ${session_id}
          AND payment_status != 'completed'
      `

      // Update campaign totals only if pledge was successfully updated
      const updated = await sql`
        SELECT id FROM pledges
        WHERE stripe_session_id = ${session_id} AND payment_status = 'completed'
        LIMIT 1
      `
      if (updated[0]) {
        await sql`
          UPDATE campaigns
          SET
            current_amount = current_amount + ${amount},
            supporter_count = supporter_count + 1,
            updated_at = NOW()
          WHERE id = ${campaignId}
        `

        if (rewardTierId) {
          await sql`
            UPDATE reward_tiers
            SET claimed_count = claimed_count + 1, updated_at = NOW()
            WHERE id = ${rewardTierId}
          `
        }
      }
    }

    // Return latest campaign stats
    const stats = await sql`
      SELECT current_amount, supporter_count FROM campaigns WHERE id = ${campaignId} LIMIT 1
    `

    return NextResponse.json({ status: "confirmed", stats: stats[0] })
  } catch (err) {
    console.error("[checkout/confirm]", err)
    return NextResponse.json({ error: "確認処理に失敗しました。" }, { status: 500 })
  }
}
