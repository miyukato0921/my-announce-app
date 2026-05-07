import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import sql from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { product_id, buyer_name, buyer_email } = await req.json()

    if (!product_id || !buyer_email) {
      return NextResponse.json({ error: "必須項目が不足しています。" }, { status: 400 })
    }

    const rows = await sql`
      SELECT * FROM products WHERE id = ${product_id} AND is_active = true LIMIT 1
    `
    const product = rows[0]
    if (!product) {
      return NextResponse.json({ error: "商品が見つかりません。" }, { status: 404 })
    }
    if (product.stock_count !== null && product.stock_count <= 0) {
      return NextResponse.json({ error: "この商品は在庫切れです。" }, { status: 400 })
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
              name: product.name,
              description: product.description ?? undefined,
            },
            unit_amount: product.price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: buyer_email,
      success_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop/checkout?product_id=${product_id}`,
      metadata: {
        type: "shop_product",
        product_id: String(product_id),
        buyer_name: buyer_name ?? "",
        buyer_email,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("[shop/checkout]", err)
    return NextResponse.json({ error: "決済の作成に失敗しました。" }, { status: 500 })
  }
}
