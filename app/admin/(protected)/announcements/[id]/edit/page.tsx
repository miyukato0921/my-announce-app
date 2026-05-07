import { notFound, redirect } from "next/navigation"
import sql from "@/lib/db"
import type { Announcement } from "@/lib/db"
import AnnouncementForm from "@/components/admin/AnnouncementForm"
import DeleteAnnouncementButton from "@/components/admin/DeleteAnnouncementButton"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditAnnouncementPage({ params }: Props) {
  const { id } = await params
  const rows = await sql<Announcement[]>`
    SELECT * FROM announcements WHERE id = ${id} LIMIT 1
  `
  const announcement = rows[0]
  if (!announcement) notFound()

  async function updateAnnouncement(formData: FormData) {
    "use server"
    const title = formData.get("title") as string
    const body = formData.get("content") as string
    const published = formData.get("is_published") === "on"

    await sql`
      UPDATE announcements SET
        title      = ${title},
        body       = ${body || null},
        published  = ${published},
        updated_at = NOW()
      WHERE id = ${id}
    `
    redirect("/admin/announcements")
  }

  async function deleteAnnouncement() {
    "use server"
    await sql`DELETE FROM announcements WHERE id = ${id}`
    redirect("/admin/announcements")
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-foreground">お知らせ編集</h1>
        <p className="text-muted-foreground mt-1">お知らせの内容を編集します。</p>
      </div>
      <AnnouncementForm action={updateAnnouncement} defaultValues={announcement} />
      <DeleteAnnouncementButton action={deleteAnnouncement} />
    </div>
  )
}
