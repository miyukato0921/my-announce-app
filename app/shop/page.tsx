import sql from "@/lib/db"
import ShopClient from "@/components/shop/ShopClient"

async function getProducts() {
  return sql`SELECT * FROM products WHERE is_active = true ORDER BY id`
}

export default async function ShopPage() {
  const products = await getProducts()
  return <ShopClient products={products as any} />
}
