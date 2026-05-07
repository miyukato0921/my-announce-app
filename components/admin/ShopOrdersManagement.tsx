"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Pencil, Trash2, Truck, Search, ShoppingBag, Download, Loader2 } from "lucide-react"
import { formatYen } from "@/lib/utils"

const shippingStatusConfig: Record<string, { label: string; className: string }> = {
  not_required: { label: "配送不要", className: "bg-gray-100 text-gray-600 border-gray-200" },
  waiting:      { label: "発送待ち", className: "bg-orange-100 text-orange-800 border-orange-200" },
  shipped:      { label: "発送済み", className: "bg-blue-100 text-blue-800 border-blue-200" },
  delivered:    { label: "配達完了", className: "bg-green-100 text-green-800 border-green-200" },
}

const paymentStatusConfig: Record<string, { label: string; className: string }> = {
  completed: { label: "完了", className: "bg-green-100 text-green-800 border-green-200" },
  pending:   { label: "保留中", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  failed:    { label: "失敗", className: "bg-red-100 text-red-800 border-red-200" },
}

function formatDate(d: string) {
  const dt = new Date(d)
  return `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDate()} ${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`
}

interface Order {
  id: number
  product_name: string
  product_price: number
  buyer_name: string | null
  buyer_email: string | null
  payment_status: string
  requires_shipping: boolean
  shipping_status: string | null
  shipping_name: string | null
  shipping_postal_code: string | null
  shipping_address: string | null
  shipping_phone: string | null
  shipped_at: string | null
  created_at: string
}

interface Stats {
  count_completed: number
  count_waiting: number
  count_shipped: number
  total_sales: number
}

interface Props {
  orders: Order[]
  stats: Stats
}

export default function ShopOrdersManagement({ orders: initialOrders, stats }: Props) {
  const [orders, setOrders] = useState(initialOrders)
  const [search, setSearch] = useState("")
  const [editOrder, setEditOrder] = useState<Order | null>(null)
  const [shippingOrder, setShippingOrder] = useState<Order | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch("/api/admin/shop-orders/export")
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const cd = res.headers.get("Content-Disposition") ?? ""
      const match = cd.match(/filename="(.+?)"/)
      a.download = match?.[1] ?? "shop_orders.csv"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      alert("CSVエクスポートに失敗しました")
    } finally {
      setExporting(false)
    }
  }

  const [editPaymentStatus, setEditPaymentStatus] = useState("")
  const [editShippingStatus, setEditShippingStatus] = useState("")
  const [shipName, setShipName] = useState("")
  const [shipPostal, setShipPostal] = useState("")
  const [shipAddress, setShipAddress] = useState("")
  const [shipPhone, setShipPhone] = useState("")

  const filtered = orders.filter(o => {
    const q = search.toLowerCase()
    return !q ||
      (o.buyer_name ?? "").toLowerCase().includes(q) ||
      (o.buyer_email ?? "").toLowerCase().includes(q) ||
      o.product_name.toLowerCase().includes(q) ||
      String(o.id).includes(q)
  })

  const openEdit = (o: Order) => {
    setEditOrder(o)
    setEditPaymentStatus(o.payment_status)
    setEditShippingStatus(o.shipping_status ?? "")
  }

  const openShipping = (o: Order) => {
    setShippingOrder(o)
    setShipName(o.shipping_name ?? "")
    setShipPostal(o.shipping_postal_code ?? "")
    setShipAddress(o.shipping_address ?? "")
    setShipPhone(o.shipping_phone ?? "")
  }

  const handleUpdateStatus = async () => {
    if (!editOrder) return
    setLoading(true)
    try {
      await fetch(`/api/admin/shop-orders/${editOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status: editPaymentStatus }),
      })
      if (editShippingStatus && editOrder.requires_shipping) {
        await fetch(`/api/admin/shop-orders/${editOrder.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shipping_status: editShippingStatus }),
        })
      }
      setOrders(prev => prev.map(o =>
        o.id === editOrder.id
          ? { ...o, payment_status: editPaymentStatus, shipping_status: editShippingStatus || o.shipping_status }
          : o
      ))
      setEditOrder(null)
    } finally {
      setLoading(false)
    }
  }

  const handleShippingSave = async () => {
    if (!shippingOrder) return
    setLoading(true)
    try {
      await fetch(`/api/admin/shop-orders/${shippingOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipping_name: shipName,
          shipping_postal_code: shipPostal,
          shipping_address: shipAddress,
          shipping_phone: shipPhone,
        }),
      })
      setOrders(prev => prev.map(o =>
        o.id === shippingOrder.id
          ? { ...o, shipping_name: shipName, shipping_postal_code: shipPostal, shipping_address: shipAddress, shipping_phone: shipPhone }
          : o
      ))
      setShippingOrder(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setLoading(true)
    try {
      await fetch(`/api/admin/shop-orders/${deleteId}`, { method: "DELETE" })
      setOrders(prev => prev.filter(o => o.id !== deleteId))
      setDeleteId(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-2xl border border-border p-5 text-center">
          <p className="text-2xl font-black text-brand-green">{formatYen(Number(stats.total_sales))}</p>
          <p className="text-xs text-muted-foreground mt-1">累計売上</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 text-center">
          <p className="text-2xl font-black text-foreground">{stats.count_completed}件</p>
          <p className="text-xs text-muted-foreground mt-1">完了注文</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 text-center">
          <p className="text-2xl font-black text-orange-600">{stats.count_waiting}件</p>
          <p className="text-xs text-muted-foreground mt-1">発送待ち</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 text-center">
          <p className="text-2xl font-black text-blue-600">{stats.count_shipped}件</p>
          <p className="text-xs text-muted-foreground mt-1">発送済み</p>
        </div>
      </div>

      {/* Search + Export */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="購入者名・メール・商品名・IDで検索..."
            className="pl-9 rounded-xl"
          />
        </div>
        <Button
          variant="outline"
          className="rounded-xl gap-2 shrink-0"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          CSVエクスポート
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">ID</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">商品</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">購入者</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">金額</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">決済</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">発送</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">発送先</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">日時</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => {
                const ps = paymentStatusConfig[order.payment_status] ?? { label: order.payment_status, className: "bg-gray-100 text-gray-700" }
                const ss = order.shipping_status ? shippingStatusConfig[order.shipping_status] : null
                return (
                  <tr key={order.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 text-muted-foreground text-xs">#{order.id}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-muted-foreground shrink-0" />
                        <p className="font-medium text-foreground truncate max-w-[140px]">{order.product_name}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-foreground truncate max-w-[120px]">{order.buyer_name ?? "未設定"}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[120px]">{order.buyer_email}</p>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-brand-green">{formatYen(order.product_price)}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge className={`text-xs border ${ps.className}`}>{ps.label}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {ss ? (
                        <Badge className={`text-xs border ${ss.className}`}>{ss.label}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {order.shipping_name ? (
                        <div>
                          <p className="text-xs font-medium text-foreground">{order.shipping_name}</p>
                          <p className="text-xs text-muted-foreground">{order.shipping_postal_code} {order.shipping_address}</p>
                        </div>
                      ) : order.requires_shipping ? (
                        <span className="text-xs text-orange-600 font-medium">未登録</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="icon" variant="ghost" className="w-7 h-7 rounded-lg" onClick={() => openEdit(order)} title="ステータス編集">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        {order.requires_shipping && (
                          <Button
                            size="icon" variant="ghost"
                            className="w-7 h-7 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => openShipping(order)} title="発送先編集"
                          >
                            <Truck className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          size="icon" variant="ghost"
                          className="w-7 h-7 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteId(order.id)} title="削除"
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
            <p className="text-center py-10 text-muted-foreground">注文データがありません。</p>
          )}
        </div>
      </div>

      {/* Edit status dialog */}
      <Dialog open={!!editOrder} onOpenChange={v => !v && setEditOrder(null)}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader><DialogTitle>注文 #{editOrder?.id} のステータス編集</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium">決済ステータス</Label>
              <Select value={editPaymentStatus} onValueChange={setEditPaymentStatus}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">保留中</SelectItem>
                  <SelectItem value="completed">完了</SelectItem>
                  <SelectItem value="failed">失敗</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editOrder?.requires_shipping && (
              <div>
                <Label className="text-sm font-medium">発送ステータス</Label>
                <Select value={editShippingStatus} onValueChange={setEditShippingStatus}>
                  <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="選択..." /></SelectTrigger>
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
            <Button variant="outline" onClick={() => setEditOrder(null)} className="rounded-xl">キャンセル</Button>
            <Button onClick={handleUpdateStatus} disabled={loading} className="rounded-xl bg-brand-green hover:bg-brand-green/90 text-white">保存する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shipping address dialog */}
      <Dialog open={!!shippingOrder} onOpenChange={v => !v && setShippingOrder(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle>発送先情報 — 注文 #{shippingOrder?.id}</DialogTitle></DialogHeader>
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
            <Button variant="outline" onClick={() => setShippingOrder(null)} className="rounded-xl">キャンセル</Button>
            <Button onClick={handleShippingSave} disabled={loading} className="rounded-xl bg-brand-green hover:bg-brand-green/90 text-white">保存する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>注文 #{deleteId} を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>この操作は取り消せません。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading} className="rounded-xl bg-destructive hover:bg-destructive/90 text-white">
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
