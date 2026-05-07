import { redirect, notFound } from "next/navigation"
import sql from "@/lib/db"
import type { Product } from "@/lib/db"
import ProductForm from "@/components/admin/ProductForm"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rows = await sql<Product[]>`SELECT * FROM products WHERE id = ${Number(id)} LIMIT 1`
  const product = rows[0]
  if (!product) notFound()

  async function updateProduct(formData: FormData) {
    "use server"
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const price = Number(formData.get("price"))
    const stock_count = formData.get("stock_count") ? Number(formData.get("stock_count")) : null
    const image_url = formData.get("image_url") as string
    const category = formData.get("category") as string
    const is_active = formData.get("is_active") === "on"
    const name_en = formData.get("name_en") as string
    const name_ko = formData.get("name_ko") as string
    const name_zh = formData.get("name_zh") as string
    const description_en = formData.get("description_en") as string
    const description_ko = formData.get("description_ko") as string
    const description_zh = formData.get("description_zh") as string

    await sql`
      UPDATE products SET
        name = ${name},
        description = ${description || null},
        price = ${price},
        stock_count = ${stock_count},
        image_url = ${image_url || null},
        category = ${category || null},
        is_active = ${is_active},
        name_en = ${name_en || null},
        name_ko = ${name_ko || null},
        name_zh = ${name_zh || null},
        description_en = ${description_en || null},
        description_ko = ${description_ko || null},
        description_zh = ${description_zh || null},
        updated_at = NOW()
      WHERE id = ${product.id}
    `
    redirect("/admin/products")
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-foreground">商品編集</h1>
        <p className="text-muted-foreground mt-1">{product.name}</p>
      </div>
      <ProductForm action={updateProduct} defaultValues={product} />
    </div>
  )
}
