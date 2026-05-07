import sql from "@/lib/db"
import ShopCheckoutPageClient from "@/components/checkout/ShopCheckoutPageClient"

async function getProduct(id: number) {
  try {
    const rows = await sql`SELECT * FROM products WHERE id = ${id} AND is_active = true LIMIT 1`
    return rows[0] ?? null
  } catch {
    return null
  }
}

export default async function ShopCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ product_id?: string }>
}) {
  const params = await searchParams
  const productId = params.product_id ? parseInt(params.product_id) : null

  if (!productId) {
    return <ShopCheckoutPageClient type="no_product" reason="not_specified" />
  }

  const product = await getProduct(productId)

  if (!product) {
    return <ShopCheckoutPageClient type="no_product" reason="not_found" />
  }

  return <ShopCheckoutPageClient type="checkout" product={product} />
}
