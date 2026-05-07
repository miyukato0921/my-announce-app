import { redirect } from "next/navigation"
import sql from "@/lib/db"
import type { Announcement } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Edit, Bell, Send } from "lucide-react"

export default async function AnnouncementsPage() {
  async function createAnnouncement(formData: FormData) {
    "use server"
    const title = formData.get("title") as string
    const body = formData.get("body") as string
    const published = formData.get("published") === "on"
    if (!title?.trim()) return
    await sql`
      INSERT INTO announcements (title, body, published)
      VALUES (${title}, ${body || null}, ${published})
    `
    redirect("/admin/announcements")
  }

  const announcements = await sql<Announcement[]>`
    SELECT * FROM announcements ORDER BY created_at DESC
  `

  const publishedCount = announcements.filter((a) => a.published).length
  const draftCount = announcements.filter((a) => !a.published).length

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-foreground">お知らせ管理</h1>
        <p className="text-muted-foreground mt-1">サイトに掲載するお知らせの管理</p>
      </div>

      {/* 投稿フォーム */}
      <div className="bg-card rounded-2xl border border-border p-6 mb-6">
        <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <Send className="w-4 h-4 text-brand-green" />
          新しいお知らせを投稿
        </h2>
        <form action={createAnnouncement} className="space-y-4">
          <input
            name="title"
            required
            placeholder="タイトル"
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
          />
          <textarea
            name="body"
            placeholder="本文（任意）"
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 resize-none"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input type="checkbox" name="published" className="rounded" />
              すぐに公開する
            </label>
            <Button type="submit" className="bg-brand-green hover:bg-brand-green/90 text-white rounded-xl px-6">
              投稿する
            </Button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-black text-foreground">{announcements.length}</p>
          <p className="text-xs text-muted-foreground mt-1">総件数</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-black text-brand-green">{publishedCount}</p>
          <p className="text-xs text-muted-foreground mt-1">公開中</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-black text-muted-foreground">{draftCount}</p>
          <p className="text-xs text-muted-foreground mt-1">下書き</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <Bell className="w-5 h-5 text-brand-green" />
          <h2 className="font-bold text-foreground">お知らせ一覧</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">タイトル</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">状態</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">作成日</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map((announcement) => (
                <tr key={announcement.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-medium text-foreground">{announcement.title}</p>
                    {announcement.body && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{announcement.body}</p>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Badge className={announcement.published
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-gray-100 text-gray-700 border-gray-200"
                    }>
                      {announcement.published ? "公開中" : "下書き"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">
                    {new Date(announcement.created_at).toLocaleDateString("ja-JP")}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Button variant="ghost" size="sm" className="rounded-lg" asChild>
                      <Link href={`/admin/announcements/${announcement.id}/edit`}>
                        <Edit className="w-4 h-4" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {announcements.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">お知らせが登録されていません。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
