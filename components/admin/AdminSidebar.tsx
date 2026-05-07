"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import type { AdminUser } from "@/lib/db"
import {
  LayoutDashboard,
  Megaphone,
  Gift,
  ShoppingBag,
  Users,
  LogOut,
  Leaf,
  ExternalLink,
  CreditCard,
  Images,
  Mic2,
  Store,
  Settings,
  Mail,
  Scale,
  Link as LinkIcon,
  Receipt,
  Bell,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSiteSettings } from "@/components/SiteSettingsProvider"

interface Props {
  admin: AdminUser
}

const navItems = [
  { href: "/admin", label: "ダッシュボード", icon: LayoutDashboard, exact: true },
  { href: "/admin/announcements", label: "お知らせ管理", icon: Bell },
  { href: "/admin/campaigns", label: "クラファン管理", icon: Megaphone },
  { href: "/admin/rewards", label: "リターン管理", icon: Gift },
  { href: "/admin/pledges", label: "支援者管理", icon: CreditCard },
  { href: "/admin/gallery", label: "ギャラリー管理", icon: Images },
  { href: "/admin/performers", label: "出演者管理", icon: Mic2 },
  { href: "/admin/products", label: "商品管理 (ショップ)", icon: ShoppingBag },
  { href: "/admin/shop-orders", label: "ショップ注文管理", icon: Store },
  { href: "/admin/users", label: "管理者ユーザー", icon: Users },
  { href: "/admin/email-templates", label: "メール配信設定", icon: Mail },
  { href: "/admin/receipts", label: "領収書管理", icon: Receipt },
  { href: "/admin/shortlinks", label: "リンクショートカット", icon: LinkIcon },
  { href: "/admin/legal", label: "法的ページ管理", icon: Scale },
  { href: "/admin/settings", label: "共通設定", icon: Settings, superAdminOnly: true },
]

export default function AdminSidebar({ admin }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const { siteTitle } = useSiteSettings()
  const isSuperAdmin = admin.role === "super_admin"

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" })
    router.push("/admin/login")
    router.refresh()
  }

  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  return (
    <aside className="w-64 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col min-h-screen">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-gold rounded-xl flex items-center justify-center">
            <Leaf className="w-5 h-5 text-brand-dark" />
          </div>
          <div>
            <p className="font-black text-sidebar-foreground text-sm truncate">{siteTitle || "クラウドファンディング"}</p>
            <p className="text-sidebar-foreground/50 text-xs">管理画面</p>
            <p className="text-sidebar-foreground/40 text-[11px] font-mono leading-tight mt-1">
              {(() => {
                const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME
                const sha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
                const parts: string[] = []
                if (buildTime) {
                  const d = new Date(buildTime)
                  parts.push(d.toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" }))
                }
                if (sha) parts.push(`#${sha.slice(0, 7)}`)
                return parts.length > 0 ? parts.join(" ") : "dev"
              })()}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.filter(item => !item.superAdminOnly || isSuperAdmin).map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}

        <div className="pt-3 border-t border-sidebar-border mt-3 space-y-1">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            公開ページを見る
          </Link>
          <Link
            href="/shop"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <Store className="w-4 h-4 shrink-0" />
            ショップを見る
          </Link>
        </div>
      </nav>

      {/* User info + logout */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 bg-brand-gold/30 rounded-full flex items-center justify-center text-brand-gold font-bold text-sm">
            {admin.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sidebar-foreground text-sm font-medium truncate">{admin.name}</p>
            <p className="text-sidebar-foreground/50 text-xs truncate">{admin.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-red-500/20 hover:text-red-400 transition-colors w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          ログアウト
        </button>
      </div>
    </aside>
  )
}
