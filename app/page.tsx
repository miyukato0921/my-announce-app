import sql from "@/lib/db"
import HeartButton from "@/components/HeartButton"
import { Bell } from "lucide-react"

export const dynamic = "force-dynamic"

async function getAnnouncements() {
  const rows = await sql`
    SELECT id, title, body, likes, created_at
    FROM announcements
    WHERE published = true
    ORDER BY created_at DESC
  `
  return rows
}

export default async function Page() {
  const announcements = await getAnnouncements()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <Bell className="w-5 h-5 text-brand-gold" />
          <h1 className="text-lg font-black text-foreground">お知らせ</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {announcements.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">お知らせはまだありません。</p>
        ) : (
          <div className="space-y-4">
            {announcements.map((item: any) => (
              <div key={item.id} className="bg-card border border-border rounded-2xl p-5">
                <p className="text-xs text-muted-foreground mb-2">
                  {new Date(item.created_at).toLocaleDateString("ja-JP")}
                </p>
                <h2 className="font-bold text-foreground mb-2">{item.title}</h2>
                {item.body && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-4">{item.body}</p>
                )}
                <div className="flex justify-end">
                  <HeartButton id={String(item.id)} initialLikes={Number(item.likes)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
