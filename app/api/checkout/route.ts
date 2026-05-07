import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import sql from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      campaign_id,
      reward_tier_id,
      amount,
      supporter_name,
      supporter_email,
      supporter_phone,
      message,
      is_anonymous,
    } = body

    if (!campaign_id || !amount || amount < 50) {
      return NextResponse.json({ error: "無効なリクエストです。" }, { status: 400 })
    }
    if (!supporter_email) {
      return NextResponse.json({ error: "メールアドレスが必要です。" }, { status: 400 })
    }
    if (!supporter_phone) {
      return NextResponse.json({ error: "電話番号が必要です。" }, { status: 400 })
    }

    // Validate campaign exists and is active
    const campaigns = await sql`
      SELECT id, title FROM campaigns WHERE id = ${campaign_id} AND status = 'active' LIMIT 1
    `
    if (!campaigns[0]) {
      return NextResponse.json({ error: "キャンペーンが見つかりません。" }, { status: 404 })
    }

    // If a reward tier is specified, validate it
    if (reward_tier_id) {
      const tiers = await sql`
        SELECT id, amount, limit_count, claimed_count FROM reward_tiers
        WHERE id = ${reward_tier_id} AND campaign_id = ${campaign_id} AND is_active = true LIMIT 1
      `
      const tier = tiers[0]
      if (!tier) {
        return NextResponse.json({ error: "リターンが見つかりません。" }, { status: 404 })
      }
      if (tier.limit_count !== null && tier.claimed_count >= tier.limit_count) {
        return NextResponse.json({ error: "このリターンは完売しています。" }, { status: 400 })
      }
    }

    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
    const stripeClient = await getStripe()

    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: {
              name: reward_tier_id
                ? `クラウドファンディング - リターン支援`
                : `クラウドファンディング - 応援支援`,
              description: reward_tier_id
                ? "リターン付き支援"
                : "応援支援（リターンなし）",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: supporter_email,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?campaign_id=${campaign_id}${reward_tier_id ? `&reward_id=${reward_tier_id}` : ""}`,
      metadata: {
        campaign_id: String(campaign_id),
        reward_tier_id: reward_tier_id ? String(reward_tier_id) : "",
        supporter_name: supporter_name ?? "",
        supporter_email,
        message: message ?? "",
        is_anonymous: is_anonymous ? "true" : "false",
      },
    })

    // Create pending pledge record
    await sql`
      INSERT INTO pledges (
        campaign_id, reward_tier_id, supporter_name, supporter_email,
        supporter_phone,
        amount, stripe_session_id, payment_status, message, is_anonymous
      ) VALUES (
        ${campaign_id},
        ${reward_tier_id ?? null},
        ${supporter_name ?? null},
        ${supporter_email},
        ${supporter_phone ?? null},
        ${amount},
        ${session.id},
        'pending',
        ${message ?? null},
        ${is_anonymous ?? false}
      )
    `

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error("[checkout]", err?.message || err)
    return NextResponse.json({ error: err?.message || "決済の作成に失敗しました。" }, { status: 500 })
  }
}
