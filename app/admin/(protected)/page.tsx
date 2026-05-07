import sql from "@/lib/db"
import { Bell, CheckCircle2, EyeOff } from "lucide-react"
import Link from "next/link"
import type { Announcement } from "@/lib/db"

async function getDashboardData() {
  const stats = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE published = true) as published,
      COUNT(*) FILTER (WHERE published = false) as drafts
    FROM announcements
  `
  const recent = await sql<Announcement[]>`
    SELECT * FROM announcements ORDER BY created_at DESC LIMIT 5
  `
  return { stats: stats[0], recent }
}

export default async function AdminDashboard() {
  const { stats, recent } = await getDashboardData()

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-foreground">ダッシュボード</h1>
        <p className="text-muted-foreground mt-1">お知らせ管理システム</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center mb-3">
            <Bell className="w-5 h-5 text-brand-gold" />
          </div>
          <p className="text-2xl font-black text-foreground">{String(stats?.total ?? 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">お知らせ合計</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-black text-foreground">{String(stats?.published ?? 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">公開中</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3">
            <EyeOff className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-2xl font-black text-foreground">{String(stats?.drafts ?? 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">下書き</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-foreground">最近のお知らせ</h2>
          <Link href="/admin/announcements" className="text-sm text-brand-gold hover:underline">
            すべて見る →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-muted-foreground text-sm">まだお知らせがありません。</p>
        ) : (
          <div className="space-y-3">
            {recent.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(item.created_at).toLocaleDateString("ja-JP")}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ml-3 ${
                  item.published
                    ? "bg-green-100 text-green-700"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {item.published ? "公開" : "下書き"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
