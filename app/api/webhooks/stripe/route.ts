import { NextRequest, NextResponse } from "next/server"
import { getStripeConfig } from "@/lib/stripe"
import sql from "@/lib/db"
import type Stripe from "stripe"
import { sendTemplateEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")

  // モードに応じた stripe インスタンスと Webhook シークレットを取得
  const { stripe: stripeClient, webhookSecret } = await getStripeConfig()

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripeClient.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session

    // JPY はゼロデシマル通貨のため amount_total は既に円単位（/100 不要）
    const amount = session.amount_total ?? 0
    const amountFormatted = `¥${amount.toLocaleString("ja-JP")}`

    // ─── ショップ注文 ───
    if (session.metadata?.type === "shop_product") {
      try {
        const productId = parseInt(session.metadata.product_id ?? "0")
        const buyerName = session.metadata.buyer_name ?? ""
        const buyerEmail = session.metadata.buyer_email ?? ""
        const product = (await sql`SELECT * FROM products WHERE id = ${productId} LIMIT 1`)[0]

        await sql`
          INSERT INTO shop_orders (
            stripe_session_id, stripe_payment_intent_id,
            product_id, product_name, product_price,
            buyer_name, buyer_email, payment_status,
            requires_shipping, shipping_status
          ) VALUES (
            ${session.id},
            ${session.payment_intent as string ?? null},
            ${productId},
            ${product?.name ?? "不明な商品"},
            ${amount},
            ${buyerName || null},
            ${buyerEmail || null},
            'completed',
            ${product?.requires_shipping ?? true},
            ${product?.requires_shipping ? 'pending' : 'not_required'}
          )
          ON CONFLICT (stripe_session_id) DO UPDATE SET
            payment_status = 'completed',
            updated_at = NOW()
        `

        // 在庫を1つ減らす
        if (product?.stock_count !== null) {
          await sql`
            UPDATE products SET stock_count = stock_count - 1
            WHERE id = ${productId} AND stock_count > 0
          `
        }

        // 購入完了メール送信（成功ページで送信済みならスキップ）
        if (buyerEmail) {
          try {
            const alreadySent = await sql`
              SELECT id FROM email_logs
              WHERE template_slug = 'shop_purchase_confirmation'
                AND to_address = ${buyerEmail}
                AND status = 'sent'
                AND created_at > NOW() - INTERVAL '10 minutes'
              LIMIT 1
            `
            if (alreadySent.length === 0) {
              await sendTemplateEmail("shop_purchase_confirmation", buyerEmail, {
                buyer_name: buyerName || "お客様",
                product_name: product?.name ?? "商品",
                amount: amountFormatted,
                email: buyerEmail,
              })
            }
          } catch (emailErr) {
            console.error("[webhook] Shop email send failed:", emailErr)
          }
        }
      } catch (shopErr) {
        console.error("[webhook] Shop order processing failed:", shopErr)
      }

    // ─── クラウドファンディング支援（既存ロジック） ───
    } else {
      const {
        campaign_id,
        reward_tier_id,
        is_anonymous,
      } = session.metadata ?? {}

      const campaignId = parseInt(campaign_id ?? "0")
      const rewardTierId = reward_tier_id ? parseInt(reward_tier_id) : null

      try {
        await sql`
          UPDATE pledges
          SET
            payment_status = 'completed',
            stripe_payment_intent_id = ${session.payment_intent as string ?? null},
            updated_at = NOW()
          WHERE stripe_session_id = ${session.id}
        `

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

        // 確認メール送信（成功ページで送信済みならスキップ）
        try {
          const pledgeRows = await sql`
            SELECT p.supporter_name, p.supporter_email, rt.title as reward_title
            FROM pledges p
            LEFT JOIN reward_tiers rt ON rt.id = p.reward_tier_id
            WHERE p.stripe_session_id = ${session.id}
            LIMIT 1
          `
          if (pledgeRows.length > 0 && pledgeRows[0].supporter_email) {
            const { supporter_name, supporter_email, reward_title } = pledgeRows[0]
            const alreadySent = await sql`
              SELECT id FROM email_logs
              WHERE template_slug = 'pledge_confirmation'
                AND to_address = ${supporter_email}
                AND status = 'sent'
                AND created_at > NOW() - INTERVAL '10 minutes'
              LIMIT 1
            `
            if (alreadySent.length === 0) {
              await sendTemplateEmail("pledge_confirmation", supporter_email, {
                supporter_name: supporter_name ?? "サポーター",
                reward_title: reward_title ?? "カスタム支援",
                amount: amountFormatted,
                email: supporter_email,
              })
            }
          }
        } catch (emailErr) {
          console.error("[webhook] Email send failed:", emailErr)
        }
      } catch (dbErr) {
        console.error("[webhook] DB update failed:", dbErr)
        return NextResponse.json({ error: "DB error" }, { status: 500 })
      }
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session
    await sql`
      UPDATE pledges SET payment_status = 'failed', updated_at = NOW()
      WHERE stripe_session_id = ${session.id} AND payment_status = 'pending'
    `
  }

  return NextResponse.json({ received: true })
}
