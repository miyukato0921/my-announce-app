"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Pencil, Trash2, Truck, MapPin, Package, Search, Mail, Receipt } from "lucide-react"
import { formatYen } from "@/lib/utils"

const paymentStatusConfig: Record<string, { label: string; className: string }> = {
  completed: { label: "完了", className: "bg-green-100 text-green-800 border-green-200" },
  pending:   { label: "保留中", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  failed:    { label: "失敗", className: "bg-red-100 text-red-800 border-red-200" },
  refunded:  { label: "返金済", className: "bg-gray-100 text-gray-700 border-gray-200" },
}

const shippingStatusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  waiting:  { label: "発送待ち", className: "bg-orange-100 text-orange-800 border-orange-200", icon: <Package className="w-3 h-3" /> },
  shipped:  { label: "発送済み", className: "bg-blue-100 text-blue-800 border-blue-200", icon: <Truck className="w-3 h-3" /> },
  delivered:{ label: "配達完了", className: "bg-green-100 text-green-800 border-green-200", icon: <MapPin className="w-3 h-3" /> },
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

interface Pledge {
  id: number
  supporter_name: string | null
  supporter_email: string | null
  is_anonymous: boolean
  amount: number
  payment_status: string
  reward_title: string | null
  requires_shipping: boolean
  shipping_status: string | null
  shipping_name: string | null
  shipping_postal_code: string | null
  shipping_address: string | null
  shipping_phone: string | null
  created_at: string
}

interface Props {
  pledges: Pledge[]
  stats: { total_completed: number; count_completed: number; count_pending: number; count_shipping: number }
}

export default function PledgesManagement({ pledges: initialPledges, stats }: Props) {
  const [pledges, setPledges] = useState(initialPledges)
  const [search, setSearch] = useState("")
  const [editPledge, setEditPledge] = useState<Pledge | null>(null)
  const [shippingPledge, setShippingPledge] = useState<Pledge | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  // edit form state
  const [editPaymentStatus, setEditPaymentStatus] = useState("")
  const [editShippingStatus, setEditShippingStatus] = useState("")

  // shipping form state
  const [shipName, setShipName] = useState("")
  const [shipPostal, setShipPostal] = useState("")
  const [shipAddress, setShipAddress] = useState("")
  const [shipPhone, setShipPhone] = useState("")

  // 一括選択
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false)
  const [bulkSubject, setBulkSubject] = useState("")
  const [bulkBody, setBulkBody] = useState("")
  const [bulkSending, setBulkSending] = useState(false)

  // 領収書発行
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false)
  const [receiptSendEmail, setReceiptSendEmail] = useState(true)
  const [receiptIssuing, setReceiptIssuing] = useState(false)

  const filtered = pledges.filter(p => {
    const q = search.toLowerCase()
    return (
      !q ||
      (p.supporter_name ?? "").toLowerCase().includes(q) ||
      (p.supporter_email ?? "").toLowerCase().includes(q) ||
      (p.reward_title ?? "").toLowerCase().includes(q) ||
      String(p.id).includes(q)
    )
  })

  const openEdit = (p: Pledge) => {
    setEditPledge(p)
    setEditPaymentStatus(p.payment_status)
    setEditShippingStatus(p.shipping_status ?? "")
  }

  const openShipping = (p: Pledge) => {
    setShippingPledge(p)
    setShipName(p.shipping_name ?? "")
    setShipPostal(p.shipping_postal_code ?? "")
    setShipAddress(p.shipping_address ?? "")
    setShipPhone(p.shipping_phone ?? "")
  }

  const handleUpdate = async () => {
    if (!editPledge) return
    setLoading(true)
    try {
      const body: Record<string, string> = { payment_status: editPaymentStatus }
      if (editShippingStatus) body.shipping_status = editShippingStatus
      const res = await fetch(`/api/admin/pledges/${editPledge.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("更新失敗")
      setPledges(prev => prev.map(p =>
        p.id === editPledge.id
          ? { ...p, payment_status: editPaymentStatus, shipping_status: editShippingStatus || p.shipping_status }
          : p
      ))
      setEditPledge(null)
    } finally {
      setLoading(false)
    }
  }

  const handleShippingSave = async () => {
    if (!shippingPledge) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/pledges/${shippingPledge.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipping_name: shipName,
          shipping_postal_code: shipPostal,
          shipping_address: shipAddress,
          shipping_phone: shipPhone,
        }),
      })
      if (!res.ok) throw new Error("更新失敗")
      setPledges(prev => prev.map(p =>
        p.id === shippingPledge.id
          ? { ...p, shipping_name: shipName, shipping_postal_code: shipPostal, shipping_address: shipAddress, shipping_phone: shipPhone }
          : p
      ))
      setShippingPledge(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/pledges/${deleteId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("削除失敗")
      setPledges(prev => prev.filter(p => p.id !== deleteId))
      setDeleteId(null)
    } finally {
      setLoading(false)
    }
  }

  // 全選択/解除
  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(p => p.id)))
    }
  }

  // 個別選択
  const toggleOne = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // 一括メール送信
  const handleBulkEmail = async () => {
    if (!bulkSubject.trim() || !bulkBody.trim()) { alert("件名と本文を入力してください"); return }
    setBulkSending(true)
    try {
      const res = await fetch("/api/admin/pledges/bulk-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pledge_ids: Array.from(selectedIds), subject: bulkSubject, body: bulkBody }),
      })
      const data = await res.json()
      alert(`送信完了: ${data.sent}件成功, ${data.failed}件失敗`)
      setBulkEmailOpen(false)
      setBulkSubject("")
      setBulkBody("")
      setSelectedIds(new Set())
    } catch {
      alert("送信に失敗しました")
    } finally {
      setBulkSending(false)
    }
  }

  // 一括削除
  const handleBulkDelete = async () => {
    if (!confirm(`${selectedIds.size}件の支援を削除しますか？この操作は取り消せません。`)) return
    setLoading(true)
    try {
      await fetch("/api/admin/pledges/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pledge_ids: Array.from(selectedIds) }),
      })
      setPledges(prev => prev.filter(p => !selectedIds.has(p.id)))
      setSelectedIds(new Set())
    } catch {
      alert("削除に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  // 一括領収書発行
  const handleBulkReceipt = async () => {
    setReceiptIssuing(true)
    try {
      const res = await fetch("/api/admin/receipts/bulk-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pledge_ids: Array.from(selectedIds),
          send_email: receiptSendEmail,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "発行に失敗しました")
      const msgs = [`領収書発行完了: ${data.created}件作成`]
      if (receiptSendEmail && data.emailed > 0) msgs.push(`${data.emailed}件メール送信`)
      if (data.skipped > 0) msgs.push(`${data.skipped}件スキップ（発行済みまたは未完了）`)
      alert(msgs.join("、"))
      setReceiptDialogOpen(false)
      setSelectedIds(new Set())
    } catch (err) {
      alert(err instanceof Error ? err.message : "領収書の発行に失敗しました")
    } finally {
      setReceiptIssuing(false)
    }
  }

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-2xl border border-border p-5 text-center">
          <p className="text-2xl font-black text-brand-green">{formatYen(Number(stats.total_completed))}</p>
          <p className="text-xs text-muted-foreground mt-1">完了済み総額</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 text-center">
          <p className="text-2xl font-black text-foreground">{stats.count_completed}件</p>
          <p className="text-xs text-muted-foreground mt-1">完了件数</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 text-center">
          <p className="text-2xl font-black text-yellow-600">{stats.count_pending}件</p>
          <p className="text-xs text-muted-foreground mt-1">保留中</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 text-center">
          <p className="text-2xl font-black text-orange-600">{stats.count_shipping}件</p>
          <p className="text-xs text-muted-foreground mt-1">発送待ち</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="名前・メール・リターン名・IDで検索..."
          className="pl-9 rounded-xl"
        />
      </div>

      {/* 一括操作バー */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 bg-brand-green/10 border border-brand-green/20 rounded-xl px-4 py-3">
          <span className="text-sm font-bold text-foreground">{selectedIds.size}件選択中</span>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="outline"
            className="border-amber-600 text-amber-600 hover:bg-amber-50 rounded-lg"
            onClick={() => setReceiptDialogOpen(true)}
          >
            <Receipt className="w-3.5 h-3.5 mr-1.5" />
            領収書発行
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-brand-green text-brand-green hover:bg-brand-green/10 rounded-lg"
            onClick={() => setBulkEmailOpen(true)}
          >
            <Mail className="w-3.5 h-3.5 mr-1.5" />
            メール配信
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10 rounded-lg"
            onClick={handleBulkDelete}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            一括削除
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground rounded-lg"
            onClick={() => setSelectedIds(new Set())}
          >
            選択解除
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="py-3 px-3 w-10">
                  <Checkbox
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">ID</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">支援者</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">リターン</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">金額</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">決済</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">発送</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">日時</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(pledge => {
                const ps = paymentStatusConfig[pledge.payment_status] ?? { label: pledge.payment_status, className: "bg-gray-100 text-gray-700" }
                const ss = pledge.shipping_status ? shippingStatusConfig[pledge.shipping_status] : null
                return (
                  <tr key={pledge.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-3">
                      <Checkbox
                        checked={selectedIds.has(pledge.id)}
                        onCheckedChange={() => toggleOne(pledge.id)}
                      />
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">#{pledge.id}</td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-foreground truncate max-w-[120px]">
                        {pledge.is_anonymous ? "匿名" : (pledge.supporter_name || "未設定")}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[120px]">{pledge.supporter_email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-xs text-muted-foreground truncate max-w-[140px]">{pledge.reward_title ?? "応援支援"}</p>
                      {pledge.requires_shipping && pledge.shipping_name && (
                        <p className="text-xs text-blue-600 truncate max-w-[140px]">
                          {pledge.shipping_postal_code} {pledge.shipping_address}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-brand-green">{formatYen(pledge.amount)}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge className={`text-xs border ${ps.className}`}>{ps.label}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {pledge.requires_shipping ? (
                        ss ? (
                          <Badge className={`text-xs border flex items-center gap-1 w-fit mx-auto ${ss.className}`}>
                            {ss.icon}{ss.label}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">未登録</span>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(pledge.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-7 h-7 rounded-lg"
                          onClick={() => openEdit(pledge)}
                          title="ステータス編集"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        {pledge.requires_shipping && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-7 h-7 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => openShipping(pledge)}
                            title="発送先編集"
                          >
                            <Truck className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-7 h-7 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteId(pledge.id)}
                          title="削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center py-10 text-muted-foreground">該当する支援データがありません。</p>
          )}
        </div>
      </div>

      {/* Edit status dialog */}
      <Dialog open={!!editPledge} onOpenChange={v => !v && setEditPledge(null)}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>支援 #{editPledge?.id} を編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium">決済ステータス</Label>
              <Select value={editPaymentStatus} onValueChange={setEditPaymentStatus}>
                <SelectTrigger className="mt-1 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">保留中</SelectItem>
                  <SelectItem value="completed">完了</SelectItem>
                  <SelectItem value="failed">失敗</SelectItem>
                  <SelectItem value="refunded">返金済</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editPledge?.requires_shipping && (
              <div>
                <Label className="text-sm font-medium">発送ステータス</Label>
                <Select value={editShippingStatus} onValueChange={setEditShippingStatus}>
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue placeholder="選択..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="waiting">発送待ち</SelectItem>
                    <SelectItem value="shipped">発送済み</SelectItem>
                    <SelectItem value="delivered">配達完了</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPledge(null)} className="rounded-xl">キャンセル</Button>
            <Button onClick={handleUpdate} disabled={loading} className="rounded-xl bg-brand-green hover:bg-brand-green/90 text-white">
              保存する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shipping address dialog */}
      <Dialog open={!!shippingPledge} onOpenChange={v => !v && setShippingPledge(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>発��先情報 — 支援 #{shippingPledge?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium">お名前</Label>
              <Input value={shipName} onChange={e => setShipName(e.target.value)} className="mt-1 rounded-xl" placeholder="山田 太郎" />
            </div>
            <div>
              <Label className="text-sm font-medium">郵便番号</Label>
              <Input value={shipPostal} onChange={e => setShipPostal(e.target.value)} className="mt-1 rounded-xl" placeholder="123-4567" />
            </div>
            <div>
              <Label className="text-sm font-medium">住所</Label>
              <Input value={shipAddress} onChange={e => setShipAddress(e.target.value)} className="mt-1 rounded-xl" placeholder="東京都渋谷区..." />
            </div>
            <div>
              <Label className="text-sm font-medium">電話番号</Label>
              <Input value={shipPhone} onChange={e => setShipPhone(e.target.value)} className="mt-1 rounded-xl" placeholder="090-1234-5678" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShippingPledge(null)} className="rounded-xl">キャンセル</Button>
            <Button onClick={handleShippingSave} disabled={loading} className="rounded-xl bg-brand-green hover:bg-brand-green/90 text-white">
              保存する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>支援 #{deleteId} を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              削除すると、キャンペーンの集計金額・支援者数も自動的に差し引かれます。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-white"
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 一括メール送信ダイアログ */}
      <Dialog open={bulkEmailOpen} onOpenChange={setBulkEmailOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>一括メール配信（{selectedIds.size}件）</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              選択した{selectedIds.size}件の支援者にメールを送信します。
              本文に <code className="bg-muted px-1 rounded">{"{{supporter_name}}"}</code> <code className="bg-muted px-1 rounded">{"{{amount}}"}</code> を使うと自動置換されます。
            </p>
            <div className="space-y-2">
              <Label>件名</Label>
              <Input
                value={bulkSubject}
                onChange={e => setBulkSubject(e.target.value)}
                placeholder="【プロジェクト名】お知らせ"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>本文</Label>
              <Textarea
                value={bulkBody}
                onChange={e => setBulkBody(e.target.value)}
                placeholder={"{{supporter_name}} 様\n\nご支援ありがとうございます。\n\n..."}
                rows={8}
                className="resize-none font-mono text-sm rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkEmailOpen(false)} className="rounded-xl">キャンセル</Button>
            <Button
              onClick={handleBulkEmail}
              disabled={bulkSending || !bulkSubject.trim() || !bulkBody.trim()}
              className="bg-brand-green hover:bg-brand-green/90 text-white rounded-xl"
            >
              {bulkSending ? "送信中..." : `${selectedIds.size}件に送信`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 領収書発行確認ダイアログ */}
      <AlertDialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>領収書を発行しますか？</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>選択した {selectedIds.size} 件の支援者に領収書を発行します。</p>
                <p className="text-xs text-muted-foreground">※ 決済完了済みの支援のみ対象となります。既に領収書が発行済みの支援はスキップされます。</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={receiptSendEmail}
                    onCheckedChange={(v) => setReceiptSendEmail(!!v)}
                  />
                  <span className="text-sm font-medium text-foreground">同時にメールで領収書リンクを通知する</span>
                </label>
                {receiptSendEmail && (
                  <p className="text-xs text-muted-foreground pl-6">
                    メール文面は「メール配信設定 → テンプレート管理」の「領収書送付通知」から変更できます。
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={receiptIssuing}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleBulkReceipt() }}
              disabled={receiptIssuing}
              className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
            >
              {receiptIssuing ? "発行中..." : "発行する"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
