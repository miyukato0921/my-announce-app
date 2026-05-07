import { redirect, notFound } from "next/navigation"
import sql from "@/lib/db"
import type { Campaign } from "@/lib/db"
import CampaignForm from "@/components/admin/CampaignForm"

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rows = await sql<Campaign[]>`SELECT * FROM campaigns WHERE id = ${Number(id)} LIMIT 1`
  const campaign = rows[0]
  if (!campaign) notFound()

  async function updateCampaign(formData: FormData) {
    "use server"
    const title = formData.get("title") as string
    const short_description = formData.get("short_description") as string
    // description はフォームに入力欄がないため更新対象から除外（既存値を維持）
    const goal_amount = Number(formData.get("goal_amount"))
    const start_date = formData.get("start_date") as string
    const end_date = formData.get("end_date") as string
    const status = formData.get("status") as string
    const hero_image_url = formData.get("hero_image_url") as string
    const event_date = formData.get("event_date") as string
    const event_venue = formData.get("event_venue") as string
    const title_en = formData.get("title_en") as string
    const short_description_en = formData.get("short_description_en") as string
    const title_ko = formData.get("title_ko") as string
    const short_description_ko = formData.get("short_description_ko") as string
    const title_zh = formData.get("title_zh") as string
    const short_description_zh = formData.get("short_description_zh") as string
    const parseBlocksField = (raw: FormDataEntryValue | null): unknown => {
      try { return JSON.parse((raw as string) || "[]") } catch { return [] }
    }
    const page_blocks_json   = parseBlocksField(formData.get("page_blocks"))
    const page_blocks_en     = parseBlocksField(formData.get("page_blocks_en"))
    const page_blocks_ko     = parseBlocksField(formData.get("page_blocks_ko"))
    const page_blocks_zh     = parseBlocksField(formData.get("page_blocks_zh"))

    await sql`
      UPDATE campaigns SET
        title = ${title},
        short_description = ${short_description},
        goal_amount = ${goal_amount},
        start_date = ${start_date},
        end_date = ${end_date},
        status = ${status},
        hero_image_url = ${hero_image_url},
        event_date = ${event_date || null},
        event_venue = ${event_venue || null},
        title_en = ${title_en || null},
        short_description_en = ${short_description_en || null},
        title_ko = ${title_ko || null},
        short_description_ko = ${short_description_ko || null},
        title_zh = ${title_zh || null},
        short_description_zh = ${short_description_zh || null},
        page_blocks    = ${JSON.stringify(page_blocks_json)}::jsonb,
        page_blocks_en = ${JSON.stringify(page_blocks_en)}::jsonb,
        page_blocks_ko = ${JSON.stringify(page_blocks_ko)}::jsonb,
        page_blocks_zh = ${JSON.stringify(page_blocks_zh)}::jsonb,
        updated_at = NOW()
      WHERE id = ${campaign.id}
    `
    redirect("/admin/campaigns")
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-foreground">キャンペーン編集</h1>
        <p className="text-muted-foreground mt-1 line-clamp-1">{campaign.title}</p>
      </div>
      <CampaignForm action={updateCampaign} defaultValues={campaign} />
    </div>
  )
}
