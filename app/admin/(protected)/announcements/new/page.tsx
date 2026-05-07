import { redirect } from "next/navigation"
import sql from "@/lib/db"
import AnnouncementForm from "@/components/admin/AnnouncementForm"

export default function NewAnnouncementPage() {
  async function createAnnouncement(formData: FormData) {
    "use server"
    const title = formData.get("title") as string
    const body = formData.get("content") as string
    const published = formData.get("is_published") === "on"

    await sql`
      INSERT INTO announcements (title, body, published)
      VALUES (${title}, ${body || null}, ${published})
    `
    redirect("/admin/announcements")
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-foreground">お知らせ新規作成</h1>
        <p className="text-muted-foreground mt-1">サイトに掲載するお知らせを作成します。</p>
      </div>
      <AnnouncementForm action={createAnnouncement} />
    </div>
  )
}
