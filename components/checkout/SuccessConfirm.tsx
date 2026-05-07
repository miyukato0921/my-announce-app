// Server component: confirms payment with Stripe, updates DB, sends email, returns shipping info
import { getStripe } from "@/lib/stripe"
import sql from "@/lib/db"
import { sendTemplateEmail } from "@/lib/email"
import ShippingFormWithNotify from "./ShippingFormWithNotify"

interface Props {
  sessionId: string
}

export default async function SuccessConfirm({ sessionId }: Props) {
  try {
    const stripeClient = await getStripe()
    const session = await stripeClient.checkout.sessions.retrieve(sessionId)
    if (session.payment_status !== "paid") return null

    const { campaign_id, reward_tier_id } = session.metadata ?? {}
    const amount = session.amount_total ?? 0
    const campaignId = parseInt(campaign_id ?? "0")
    const rewardTierId = reward_tier_id ? parseInt(reward_tier_id) : null

    if (!campaignId) return null

    // Idempotency: only process once
    const existing = await sql`
      SELECT id, payment_status FROM pledges
      WHERE stripe_session_id = ${sessionId}
      LIMIT 1
    `

    if (existing.length === 0 || existing[0].payment_status !== "completed") {
      await sql`
        UPDATE pledges SET
          payment_status = 'completed',
          stripe_payment_intent_id = ${session.payment_intent as string | null},
          updated_at = NOW()
        WHERE stripe_session_id = ${sessionId}
          AND payment_status != 'completed'
      `
      await sql`
        UPDATE campaigns SET
          current_amount  = current_amount + ${amount},
          supporter_count = supporter_count + 1,
          updated_at      = NOW()
        WHERE id = ${campaignId}
      `
      if (rewardTierId) {
        await sql`
          UPDATE reward_tiers SET
            claimed_count = claimed_count + 1,
            updated_at    = NOW()
          WHERE id = ${rewardTierId}
        `
      }

      // ─── メール送信（Webhook に依存せず、ここで確実に送る） ───
      try {
        const pledgeRows = await sql`
          SELECT p.supporter_name, p.supporter_email, rt.title as reward_title
          FROM pledges p
          LEFT JOIN reward_tiers rt ON rt.id = p.reward_tier_id
          WHERE p.stripe_session_id = ${sessionId}
          LIMIT 1
        `
        if (pledgeRows.length > 0 && pledgeRows[0].supporter_email) {
          const { supporter_name, supporter_email, reward_title } = pledgeRows[0]
          await sendTemplateEmail("pledge_confirmation", supporter_email, {
            supporter_name: supporter_name ?? "サポーター",
            reward_title: reward_title ?? "カスタム支援",
            amount: `¥${amount.toLocaleString("ja-JP")}`,
            email: supporter_email,
          })
        }
      } catch (emailErr) {
        console.error("[SuccessConfirm] Email send failed:", emailErr)
        // メール送信失敗はページ表示に影響させない
      }
    }

    // Check if this reward requires shipping
    if (!rewardTierId) return null

    const rewardRows = await sql`
      SELECT rt.requires_shipping, rt.title, p.id as pledge_id, p.shipping_name
      FROM reward_tiers rt
      JOIN pledges p ON p.stripe_session_id = ${sessionId}
      WHERE rt.id = ${rewardTierId}
      LIMIT 1
    `
    const reward = rewardRows[0] as any
    if (!reward?.requires_shipping) return null

    // Already has shipping address saved
    if (reward.shipping_name) return null

    return (
      <div className="mb-8">
        <ShippingFormWithNotify pledgeId={reward.pledge_id} rewardTitle={reward.title} />
      </div>
    )
  } catch (err) {
    console.error("[SuccessConfirm] Error:", err)
    return null
  }
}
