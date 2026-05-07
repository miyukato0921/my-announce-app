import { getStripe } from "@/lib/stripe"
import sql from "@/lib/db"
import { sendTemplateEmail } from "@/lib/email"
import ShopSuccessPageClient from "@/components/checkout/ShopSuccessPageClient"
import SuccessQrSection from "@/components/checkout/SuccessQrSection"

async function confirmOrder(sessionId: string) {
  try {
    const stripeClient = await getStripe()
    const session = await stripeClient.checkout.sessions.retrieve(sessionId)
    if (session.payment_status !== "paid") return null

    const { product_id, buyer_name, buyer_email } = session.metadata ?? {}
    if (!product_id) return null

    const productRows = await sql`SELECT * FROM products WHERE id = ${Number(product_id)} LIMIT 1`
    const product = productRows[0]
    if (!product) return null

    // Idempotency: check if order already exists
    const existing = await sql`
      SELECT id, requires_shipping, shipping_name FROM shop_orders
      WHERE stripe_session_id = ${sessionId} LIMIT 1
    `

    let orderId: number
    let isNewOrder = false

    if (existing.length > 0) {
      orderId = existing[0].id
    } else {
      isNewOrder = true
      const inserted = await sql`
        INSERT INTO shop_orders (
          stripe_session_id, stripe_payment_intent_id,
          product_id, product_name, product_price,
          buyer_name, buyer_email, payment_status,
          requires_shipping, shipping_status
        ) VALUES (
          ${sessionId}, ${session.payment_intent as string | null},
          ${product.id}, ${product.name}, ${product.price},
          ${buyer_name ?? null}, ${session.customer_email ?? buyer_email ?? null},
          'completed',
          ${product.requires_shipping ?? true},
          ${product.requires_shipping ? 'waiting' : 'not_required'}
        )
        RETURNING id
      `
      orderId = inserted[0].id

      // Decrement stock
      if (product.stock_count !== null && product.stock_count > 0) {
        await sql`UPDATE products SET stock_count = stock_count - 1 WHERE id = ${product.id} AND stock_count > 0`
      }
    }

    // ─── メール送信（新規注文時のみ） ───
    if (isNewOrder) {
      const emailTo = session.customer_email ?? buyer_email
      if (emailTo) {
        try {
          await sendTemplateEmail("shop_purchase_confirmation", emailTo, {
            buyer_name: buyer_name || "お客様",
            product_name: product.name,
            amount: `¥${product.price.toLocaleString("ja-JP")}`,
            email: emailTo,
          })
        } catch (emailErr) {
          console.error("[shop/success] Email send failed:", emailErr)
        }
      }
    }

    return {
      orderId,
      productName: product.name,
      requiresShipping: product.requires_shipping ?? true,
      shippingAlreadySaved: existing.length > 0 && !!existing[0].shipping_name,
    }
  } catch (err) {
    console.error("[shop/success] Error:", err)
    return null
  }
}

export default async function ShopSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const params = await searchParams
  const sessionId = params.session_id

  const order = sessionId ? await confirmOrder(sessionId) : null

  // QRコード・リンク設定を取得
  let qrSettings: Record<string, string> = {}
  try {
    const rows = await sql`SELECT key, value FROM site_settings WHERE key IN ('success_qr_url', 'success_qr_label', 'success_link_url', 'success_link_label', 'success_redirect_seconds', 'success_message')`
    for (const r of rows) qrSettings[r.key] = r.value
  } catch {}

  return (
    <>
      <ShopSuccessPageClient order={order} />
      <div className="max-w-md mx-auto px-4 pb-12">
        <SuccessQrSection
          qrUrl={qrSettings.success_qr_url}
          qrLabel={qrSettings.success_qr_label}
          linkUrl={qrSettings.success_link_url}
          linkLabel={qrSettings.success_link_label}
          redirectSeconds={qrSettings.success_redirect_seconds ? parseInt(qrSettings.success_redirect_seconds) : undefined}
          message={qrSettings.success_message}
        />
      </div>
    </>
  )
}
