"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
import { Search, Mail, RotateCcw, ExternalLink, Trash2, Pencil } from "lucide-react"

interface Receipt {
  id: number
  receipt_number: string
  pledge_id: number | null
  supporter_name: string
  amount: number
  proviso: string | null
  issued_date: string
  issuer_name: string | null
  email_sent: boolean
  email_sent_at: string | null
  downloaded_at: string | null
  download_token: string
  reissued: boolean
  reissue_of: number | null
  supporter_email: string | null
  created_at: string
}

interface Props {
  receipts: Receipt[]
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

export default function ReceiptManagement({ receipts: initialReceipts }: Props) {
  const [receipts, setReceipts] = useState(initialReceipts)
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkEmailSending, setBulkEmailSending] = useState(false)

  // Edit dialog
  const [editTarget, setEditTarget] = useState<Receipt | null>(null)
  const [editName, setEditName] = useState("")
  const [editSaving, setEditSaving] = useState(false)

  // Reissue dialog
  const [reissueTarget, setReissueTarget] = useState<Receipt | null>(null)
  const [reissueSendEmail, setReissueSendEmail] = useState(true)
  const [reissuing, setReissuing] = useState(false)

  const filtered = receipts.filter((r) => {
    const q = search.toLowerCase()
    return (
      !q ||
      r.receipt_number.toLowerCase().includes(q) ||
      (r.supporter_name ?? "").toLowerCase().includes(q) ||
      (r.supporter_email ?? "").toLowerCase().includes(q)
    )
  })

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((r) => r.id)))
    }
  }

  const toggleOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Bulk email send
  const handleBulkEmail = async () => {
    setBulkEmailSending(true)
    try {
      const res = await fetch("/api/admin/receipts/bulk-send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt_ids: Array.from(selectedIds) }),
      })
      const data = await res.json()
      alert(`メール送信完了: ${data.sent}件成功、${data.failed}件失敗`)
      setReceipts((prev) =>
        prev.map((r) =>
          selectedIds.has(r.id) ? { ...r, email_sent: true, email_sent_at: new Date().toISOString() } : r
        )
      )
      setSelectedIds(new Set())
    } catch {
      alert("メール送信に失敗しました")
    } finally {
      setBulkEmailSending(false)
    }
  }

  // Reissue
  const handleReissue = async () => {
    if (!reissueTarget) return
    setReissuing(true)
    try {
      const res = await fetch("/api/admin/receipts/reissue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt_id: reissueTarget.id, send_email: reissueSendEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "再発行に失敗しました")
      const newReceipt = {
        ...data.receipt,
        supporter_email: reissueTarget.supporter_email,
        email_sent: data.email_sent,
        email_sent_at: data.email_sent ? new Date().toISOString() : null,
      }
      setReceipts((prev) => [newReceipt, ...prev])
      setReissueTarget(null)
      if (data.email_error) {
        alert(`再発行は完了しましたが、メール送信に失敗しました: ${data.email_error}`)
      } else {
        alert(`再発行が完了しました${data.email_sent ? "（メール送信済み）" : ""}`)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "再発行に失敗しました")
    } finally {
      setReissuing(false)
    }
  }

  // Edit supporter name
  const openEdit = (receipt: Receipt) => {
    setEditTarget(receipt)
    setEditName(receipt.supporter_name)
  }

  const handleEditSave = async () => {
    if (!editTarget || !editName.trim()) return
    setEditSaving(true)
    try {
      const res = await fetch(`/api/admin/receipts/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supporter_name: editName.trim() }),
      })
      if (!res.ok) throw new Error()
      setReceipts((prev) =>
        prev.map((r) => (r.id === editTarget.id ? { ...r, supporter_name: editName.trim() } : r))
      )
      setEditTarget(null)
    } catch {
      alert("保存に失敗しました")
    } finally {
      setEditSaving(false)
    }
  }

  // Delete
  const handleDelete = async (id: number) => {
    if (!confirm("この領収書を削除しますか？")) return
    try {
      const res = await fetch(`/api/admin/receipts/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setReceipts((prev) => prev.filter((r) => r.id !== id))
    } catch {
      alert("削除に失敗しました")
    }
  }

  return (
    <>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="領収書番号・宛名・メールで検索..."
          className="pl-9 rounded-xl"
        />
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 bg-brand-green/10 border border-brand-green/20 rounded-xl px-4 py-3">
          <span className="text-sm font-bold text-foreground">{selectedIds.size}件選択中</span>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="outline"
            className="border-brand-green text-brand-green hover:bg-brand-green/10 rounded-lg"
            onClick={handleBulkEmail}
            disabled={bulkEmailSending}
          >
            <Mail className="w-3.5 h-3.5 mr-1.5" />
            {bulkEmailSending ? "送信中..." : "メール送信"}
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

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-black text-foreground">{receipts.length}</p>
          <p className="text-xs text-muted-foreground mt-1">発行済み</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-black text-brand-green">{receipts.filter((r) => r.email_sent).length}</p>
          <p className="text-xs text-muted-foreground mt-1">メール送信済み</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-black text-amber-600">{receipts.filter((r) => !r.email_sent).length}</p>
          <p className="text-xs text-muted-foreground mt-1">未送信</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-black text-blue-600">{receipts.filter((r) => r.reissued).length}</p>
          <p className="text-xs text-muted-foreground mt-1">再発行</p>
        </div>
      </div>

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
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">領収書番号</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">宛名</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">金額</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">発行</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">メール</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">発行日</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((receipt) => (
                <tr key={receipt.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-3">
                    <Checkbox
                      checked={selectedIds.has(receipt.id)}
                      onCheckedChange={() => toggleOne(receipt.id)}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-xs">{receipt.receipt_number}</span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-foreground truncate max-w-[140px]">{receipt.supporter_name}</p>
                    {receipt.supporter_email && (
                      <p className="text-xs text-muted-foreground truncate max-w-[140px]">{receipt.supporter_email}</p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-brand-green">
                    ¥{Number(receipt.amount).toLocaleString("ja-JP")}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {receipt.reissued ? (
                      <Badge className="text-xs border bg-amber-100 text-amber-800 border-amber-200">再発行</Badge>
                    ) : (
                      <Badge className="text-xs border bg-green-100 text-green-800 border-green-200">発行済</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {receipt.email_sent ? (
                      <Badge className="text-xs border bg-green-100 text-green-800 border-green-200">送信済</Badge>
                    ) : (
                      <Badge className="text-xs border bg-gray-100 text-gray-600 border-gray-200">未送信</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{formatDate(receipt.issued_date)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-7 h-7 rounded-lg"
                        onClick={() => openEdit(receipt)}
                        title="宛名編集"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-7 h-7 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => window.open(`/receipt/${receipt.download_token}`, "_blank")}
                        title="領収書を表示"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-7 h-7 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        onClick={() => { setReissueTarget(receipt); setReissueSendEmail(true) }}
                        title="再発行"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-7 h-7 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(receipt.id)}
                        title="削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center py-10 text-muted-foreground">領収書はまだ発行されていません。</p>
          )}
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(v) => !v && setEditTarget(null)}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>宛名を編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium">領収書番号</Label>
              <p className="text-sm text-muted-foreground font-mono">{editTarget?.receipt_number}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_name" className="text-sm font-medium">宛名</Label>
              <Input
                id="edit_name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="宛名を入力"
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)} className="rounded-xl">キャンセル</Button>
            <Button
              onClick={handleEditSave}
              disabled={editSaving || !editName.trim()}
              className="rounded-xl bg-brand-green hover:bg-brand-green/90 text-white"
            >
              {editSaving ? "保存中..." : "保存する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reissue dialog */}
      <AlertDialog open={!!reissueTarget} onOpenChange={(v) => !v && setReissueTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>領収書を再発行しますか？</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  {reissueTarget?.receipt_number}（{reissueTarget?.supporter_name}）の領収書を再発行します。
                  新しい領収書番号で発行され、「再発行」マークが付与されます。
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={reissueSendEmail}
                    onCheckedChange={(v) => setReissueSendEmail(!!v)}
                  />
                  <span className="text-sm font-medium text-foreground">同時にメールで通知する</span>
                </label>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={reissuing}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleReissue() }}
              disabled={reissuing}
              className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
            >
              {reissuing ? "再発行中..." : "再発行する"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
