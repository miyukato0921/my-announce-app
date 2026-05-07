"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, Trash2, ExternalLink, Smartphone, Globe, MessageCircle, Chrome, Monitor, Pencil, Eye, EyeOff, BarChart3 } from "lucide-react"

interface Shortlink {
  id: number
  slug: string
  title: string
  url_default: string
  url_line: string | null
  url_ios: string | null
  url_android: string | null
  url_chrome: string | null
  url_pc: string | null
  is_active: boolean
  click_count: number
  clicks_24h: number
  stats?: Record<string, number>
  created_at: string
}

interface Props {
  initialLinks: Shortlink[]
}

export default function ShortlinksManagement({ initialLinks }: Props) {
  const [links, setLinks] = useState<Shortlink[]>(initialLinks)
  const [slug, setSlug] = useState("")
  const [title, setTitle] = useState("")
  const [urlDefault, setUrlDefault] = useState("")
  const [urlLine, setUrlLine] = useState("")
  const [urlPc, setUrlPc] = useState("")
  const [urlChrome, setUrlChrome] = useState("")
  const [urlIos, setUrlIos] = useState("")
  const [urlAndroid, setUrlAndroid] = useState("")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  const [editId, setEditId] = useState<number | null>(null)
  const [statsId, setStatsId] = useState<number | null>(null)
  const [statsData, setStatsData] = useState<any>(null)

  const reload = async () => {
    const res = await fetch("/api/admin/shortlinks")
    if (res.ok) setLinks(await res.json())
  }

  const resetForm = () => {
    setEditId(null)
    setSlug("")
    setTitle("")
    setUrlDefault("")
    setUrlLine("")
    setUrlPc("")
    setUrlChrome("")
    setUrlIos("")
    setUrlAndroid("")
    setError("")
  }

  const openEdit = (link: Shortlink) => {
    setEditId(link.id)
    setSlug(link.slug)
    setTitle(link.title)
    setUrlDefault(link.url_default)
    setUrlLine(link.url_line ?? "")
    setUrlPc(link.url_pc ?? "")
    setUrlChrome(link.url_chrome ?? "")
    setUrlIos(link.url_ios ?? "")
    setUrlAndroid(link.url_android ?? "")
  }

  const handleCreate = () => {
    setError("")
    if (!urlDefault.trim()) { setError("デフォルトURLは必須です"); return }

    startTransition(async () => {
      const res = await fetch("/api/admin/shortlinks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slug.trim() || undefined,
          title: title.trim(),
          url_default: urlDefault,
          url_line: urlLine.trim() || null,
          url_pc: urlPc.trim() || null,
          url_chrome: urlChrome.trim() || null,
          url_ios: urlIos.trim() || null,
          url_android: urlAndroid.trim() || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error)
        return
      }
      resetForm()
      await reload()
    })
  }

  const handleUpdate = () => {
    if (!editId || !urlDefault.trim()) return
    startTransition(async () => {
      await fetch(`/api/admin/shortlinks/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, url_default: urlDefault,
          url_line: urlLine || null, url_pc: urlPc || null,
          url_chrome: urlChrome || null, url_ios: urlIos || null,
          url_android: urlAndroid || null, is_active: true,
        }),
      })
      resetForm()
      await reload()
    })
  }

  const handleDelete = (id: number) => {
    if (!confirm("このリンクを削除しますか？")) return
    startTransition(async () => {
      await fetch(`/api/admin/shortlinks/${id}`, { method: "DELETE" })
      await reload()
    })
  }

  const handleToggle = (link: Shortlink) => {
    startTransition(async () => {
      await fetch(`/api/admin/shortlinks/${link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...link, is_active: !link.is_active }),
      })
      await reload()
    })
  }

  const openStats = async (link: Shortlink) => {
    setStatsId(link.id)
    const res = await fetch(`/api/admin/shortlinks/${link.id}`)
    if (res.ok) setStatsData(await res.json())
  }

  const copyToClipboard = (slug: string) => {
    const fullUrl = `${window.location.origin}/go/${slug}`
    navigator.clipboard.writeText(fullUrl)
    setCopied(links.find(l => l.slug === slug)?.id || null)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-lg mb-3">新しいリンクを作成</h3>
        <div className="space-y-3 p-4 border border-border rounded-lg bg-card">
          <div>
            <Label htmlFor="slug" className="text-sm font-bold">Slug（オプション）</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="自動生成される場合はここは空にしておきます"
              className="font-mono text-sm mt-1"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground mt-1">指定しない場合は自動生成されます</p>
          </div>

          <div>
            <Label htmlFor="title" className="text-sm font-bold">タイトル（オプション）</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: LINE公式アカウント"
              className="text-sm mt-1"
              disabled={isPending}
            />
          </div>

          <div>
            <Label htmlFor="url_default" className="text-sm font-bold">Default URL（必須）</Label>
            <Input
              id="url_default"
              value={urlDefault}
              onChange={(e) => setUrlDefault(e.target.value)}
              placeholder="https://..."
              className="text-sm mt-1"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground mt-1">すべてのアクセスのデフォルトURL</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="url_pc" className="text-sm font-bold">PC URL</Label>
              <Input
                id="url_pc"
                value={urlPc}
                onChange={(e) => setUrlPc(e.target.value)}
                placeholder="https://..."
                className="text-sm mt-1"
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="url_line" className="text-sm font-bold">LINE URL</Label>
              <Input
                id="url_line"
                value={urlLine}
                onChange={(e) => setUrlLine(e.target.value)}
                placeholder="https://..."
                className="text-sm mt-1"
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="url_chrome" className="text-sm font-bold">Chrome URL</Label>
              <Input
                id="url_chrome"
                value={urlChrome}
                onChange={(e) => setUrlChrome(e.target.value)}
                placeholder="https://..."
                className="text-sm mt-1"
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="url_ios" className="text-sm font-bold">iOS URL</Label>
              <Input
                id="url_ios"
                value={urlIos}
                onChange={(e) => setUrlIos(e.target.value)}
                placeholder="https://..."
                className="text-sm mt-1"
                disabled={isPending}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="url_android" className="text-sm font-bold">Android URL</Label>
              <Input
                id="url_android"
                value={urlAndroid}
                onChange={(e) => setUrlAndroid(e.target.value)}
                placeholder="https://..."
                className="text-sm mt-1"
                disabled={isPending}
              />
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
              {error}
            </div>
          )}

          <Button
            onClick={editId ? handleUpdate : handleCreate}
            disabled={isPending}
            className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-bold"
          >
            {isPending ? "処理中..." : editId ? "更新する" : "リンク作成"}
          </Button>
          {editId && (
            <Button variant="outline" onClick={resetForm} className="w-full">キャンセル</Button>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg">リンク一覧</h3>
          <button
            onClick={reload}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            disabled={isPending}
          >
            更新
          </button>
        </div>
        <div className="space-y-2 border border-border rounded-lg divide-y divide-border">
          {links.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">リンクがまだ作成されていません</p>
          ) : (
            links.map((link) => (
              <div key={link.id} className="p-3.5 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <code className="text-xs font-mono bg-muted px-2 py-1 rounded text-brand-green truncate">
                        /go/{link.slug}
                      </code>
                      <button
                        onClick={() => copyToClipboard(link.slug)}
                        className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                        title="Copy full URL"
                      >
                        {copied === link.id ? (
                          <Check className="w-3.5 h-3.5 text-brand-green" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => openStats(link)}
                        className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                        title="統計"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEdit(link)}
                        className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                        title="編集"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggle(link)}
                        className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                        title={link.is_active ? "無効化" : "有効化"}
                      >
                        {link.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <a
                        href={`/go/${link.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                        title="Open link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    {link.title && <p className="text-xs text-muted-foreground mb-1">{link.title}</p>}
                    <p className="text-xs text-muted-foreground truncate">{link.url_default}</p>
                    {(link.url_line || link.url_pc || link.url_chrome || link.url_ios || link.url_android) && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {link.url_pc && <Badge className="text-[10px] bg-slate-100 text-slate-700 border-0"><Monitor className="w-2.5 h-2.5 mr-0.5" />PC</Badge>}
                        {link.url_line && <Badge className="text-[10px] bg-green-100 text-green-700 border-0"><MessageCircle className="w-2.5 h-2.5 mr-0.5" />LINE</Badge>}
                        {link.url_chrome && <Badge className="text-[10px] bg-yellow-100 text-yellow-700 border-0"><Chrome className="w-2.5 h-2.5 mr-0.5" />Chrome</Badge>}
                        {link.url_ios && <Badge className="text-[10px] bg-gray-100 text-gray-700 border-0"><Smartphone className="w-2.5 h-2.5 mr-0.5" />iOS</Badge>}
                        {link.url_android && <Badge className="text-[10px] bg-blue-100 text-blue-700 border-0"><Smartphone className="w-2.5 h-2.5 mr-0.5" />Android</Badge>}
                      </div>
                    )}
                    <div className="flex gap-3 mt-1.5 text-[10px] text-muted-foreground/50">
                      <span>Total: {link.click_count}</span>
                      <span>24h: {link.clicks_24h}</span>
                      <span>{new Date(link.created_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(link.id)}
                    className="text-muted-foreground hover:text-destructive shrink-0 transition-colors"
                    disabled={isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {statsId && statsData && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg">クリック統計</h3>
            <button onClick={() => { setStatsId(null); setStatsData(null) }} className="text-muted-foreground hover:text-foreground text-sm">閉じる</button>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="text-center">
              <p className="text-4xl font-black text-brand-green">{statsData.link?.click_count ?? 0}</p>
              <p className="text-sm text-muted-foreground">総クリック数</p>
            </div>
            <div className="space-y-2">
              {statsData.stats?.map((s: any) => (
                <div key={s.detected_platform} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                  <span className="text-sm font-medium">{s.detected_platform}</span>
                  <span className="font-bold text-sm">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
