import { redirect } from "next/navigation"
import sql from "@/lib/db"
import CampaignForm from "@/components/admin/CampaignForm"

export default function NewCampaignPage() {
  async function createCampaign(formData: FormData) {
    "use server"
    const title = formData.get("title") as string
    const short_description = formData.get("short_description") as string
    // description はフォームに入力欄がないため空文字列をセット（NOT NULL制約対応）
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
    const page_blocks_json = parseBlocksField(formData.get("page_blocks"))
    const page_blocks_en   = parseBlocksField(formData.get("page_blocks_en"))
    const page_blocks_ko   = parseBlocksField(formData.get("page_blocks_ko"))
    const page_blocks_zh   = parseBlocksField(formData.get("page_blocks_zh"))

    await sql`
      INSERT INTO campaigns (
        title, short_description, description, goal_amount,
        start_date, end_date, status, hero_image_url,
        event_date, event_venue,
        title_en, short_description_en,
        title_ko, short_description_ko,
        title_zh, short_description_zh,
        page_blocks, page_blocks_en, page_blocks_ko, page_blocks_zh
      ) VALUES (
        ${title}, ${short_description}, ${''}, ${goal_amount},
        ${start_date}, ${end_date}, ${status}, ${hero_image_url},
        ${event_date || null}, ${event_venue || null},
        ${title_en || null}, ${short_description_en || null},
        ${title_ko || null}, ${short_description_ko || null},
        ${title_zh || null}, ${short_description_zh || null},
        ${JSON.stringify(page_blocks_json)}::jsonb,
        ${JSON.stringify(page_blocks_en)}::jsonb,
        ${JSON.stringify(page_blocks_ko)}::jsonb,
        ${JSON.stringify(page_blocks_zh)}::jsonb
      )
    `
    redirect("/admin/campaigns")
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-foreground">新規キャンペーン作成</h1>
        <p className="text-muted-foreground mt-1">クラウドファンディングキャンペーンを新しく作成します。</p>
      </div>
      <CampaignForm action={createCampaign} />
    </div>
  )
}
