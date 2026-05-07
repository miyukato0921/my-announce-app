import { redirect, notFound } from "next/navigation"
import sql from "@/lib/db"
import type { Campaign, RewardTier } from "@/lib/db"
import RewardForm from "@/components/admin/RewardForm"

export default async function EditRewardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rows = await sql<RewardTier[]>`SELECT * FROM reward_tiers WHERE id = ${Number(id)} LIMIT 1`
  const reward = rows[0]
  if (!reward) notFound()

  const campaigns = await sql<Campaign[]>`SELECT id, title FROM campaigns ORDER BY id`

  async function updateReward(formData: FormData) {
    "use server"
    const campaign_id = Number(formData.get("campaign_id"))
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const amount = Number(formData.get("amount"))
    const limit_count = formData.get("limit_count") ? Number(formData.get("limit_count")) : null
    const image_url = formData.get("image_url") as string
    const delivery_date = formData.get("delivery_date") as string
    const sort_order = Number(formData.get("sort_order") ?? 0)
    const is_active = formData.get("is_active") === "on"
    const title_en = formData.get("title_en") as string
    const description_en = formData.get("description_en") as string
    const title_ko = formData.get("title_ko") as string
    const description_ko = formData.get("description_ko") as string
    const title_zh = formData.get("title_zh") as string
    const description_zh = formData.get("description_zh") as string
    const requires_shipping = formData.get("requires_shipping") === "on"

    await sql`
      UPDATE reward_tiers SET
        campaign_id = ${campaign_id},
        title = ${title},
        description = ${description},
        amount = ${amount},
        limit_count = ${limit_count},
        image_url = ${image_url || null},
        delivery_date = ${delivery_date || ""},
        sort_order = ${sort_order},
        is_active = ${is_active},
        title_en = ${title_en || null},
        description_en = ${description_en || null},
        title_ko = ${title_ko || null},
        description_ko = ${description_ko || null},
        title_zh = ${title_zh || null},
        description_zh = ${description_zh || null},
        requires_shipping = ${requires_shipping}
      WHERE id = ${reward.id}
    `
    redirect("/admin/rewards")
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-foreground">リターン編集</h1>
        <p className="text-muted-foreground mt-1 line-clamp-1">{reward.title}</p>
      </div>
      <RewardForm action={updateReward} campaigns={campaigns} defaultValues={reward} />
    </div>
  )
}
