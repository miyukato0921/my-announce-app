"use client"

import { useState, useTransition, useRef, useCallback } from "react"
import Image from "next/image"
import {
  Plus, Trash2, Eye, EyeOff, ImageIcon,
  GripVertical, ChevronUp, ChevronDown,
  Upload, Loader2, Check, X, Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface GalleryPhoto {
  id: number
  image_url: string
  caption: string
  sort_order: number
  is_active: boolean
}

interface Props {
  campaignId: number
  initialPhotos: GalleryPhoto[]
}

// ---- 独立した写真アップロードフック ----
function usePhotoUpload() {
  const [uploading, setUploading] = useState(false)
  const [url, setUrl] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => { setUrl(""); if (fileRef.current) fileRef.current.value = "" }

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) { alert(data.error ?? "アップロード失敗"); return }
      setUrl(data.url)
    } catch {
      alert("アップロードに失敗しました")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }, [])

  return { url, setUrl, uploading, fileRef, handleFile, reset }
}

// ---- 写真選択UI（追加・変更で共用） ----
function PhotoPicker({
  url,
  setUrl,
  uploading,
  fileRef,
  handleFile,
  placeholder = "https://...",
}: {
  url: string
  setUrl: (v: string) => void
  uploading: boolean
  fileRef: React.RefObject<HTMLInputElement | null>
  handleFile: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
}) {
  return (
    <div className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
      {url && (
        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border bg-muted">
          <Image src={url} alt="プレビュー" fill className="object-cover" unoptimized />
        </div>
      )}
      {uploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          アップロード中...
        </div>
      )}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="w-full"
      >
        <Upload className="w-4 h-4 mr-2" />
        {url ? "別の画像を選択" : "画像ファイルを選択"}
      </Button>
      <Input
        placeholder={placeholder}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="text-xs"
      />
    </div>
  )
}

// ---- メインコンポーネント ----
export default function GalleryManagement({ campaignId, initialPhotos }: Props) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>(initialPhotos)
  const [isPending, startTransition] = useTransition()

  // 追加フォーム
  const [addMode, setAddMode] = useState(false)
  const [newCaption, setNewCaption] = useState("")
  const addPicker = usePhotoUpload()

  // キャプション編集
  const [editingCaptionId, setEditingCaptionId] = useState<number | null>(null)
  const [editCaption, setEditCaption] = useState("")

  // 写真変更モード
  const [editingPhotoId, setEditingPhotoId] = useState<number | null>(null)
  const editPicker = usePhotoUpload()

  // ドラッグ
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [dragOverId, setDragOverId] = useState<number | null>(null)
  const dragItem = useRef<number | null>(null)

  const reload = async () => {
    const res = await fetch(`/api/admin/gallery?campaign_id=${campaignId}&_t=${Date.now()}`)
    if (res.ok) setPhotos(await res.json())
  }

  // --- 追加 ---
  const handleAdd = () => {
    if (!addPicker.url) { alert("画像を選択してください"); return }
    startTransition(async () => {
      await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaignId,
          image_url: addPicker.url,
          caption: newCaption,
          sort_order: photos.length,
        }),
      })
      addPicker.reset()
      setNewCaption("")
      setAddMode(false)
      await reload()
    })
  }

  // --- 削除 ---
  const handleDelete = (id: number) => {
    if (!confirm("この写真を削除しますか？")) return
    startTransition(async () => {
      await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" })
      await reload()
    })
  }

  // --- 表示切替 ---
  const handleToggle = (id: number, current: boolean) => {
    startTransition(async () => {
      await fetch(`/api/admin/gallery/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !current }),
      })
      await reload()
    })
  }

  // --- キャプション更新 ---
  const handleEditCaption = (id: number) => {
    startTransition(async () => {
      await fetch(`/api/admin/gallery/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: editCaption }),
      })
      setEditingCaptionId(null)
      await reload()
    })
  }

  // --- 写真URL更新 ---
  const handleUpdatePhoto = (id: number, imageUrl: string) => {
    if (!imageUrl) { alert("新しい画像を選択してください"); return }
    startTransition(async () => {
      const res = await fetch(`/api/admin/gallery/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: imageUrl }),
      })
      if (!res.ok) { alert("画像の更新に失敗しました"); return }
      editPicker.reset()
      setEditingPhotoId(null)
      await reload()
    })
  }

  // --- 並び替え ---
  const saveSortOrder = (ordered: GalleryPhoto[]) => {
    fetch("/api/admin/gallery", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ordered.map((p, i) => ({ id: p.id, sort_order: i }))),
    })
  }

  const movePhoto = (index: number, dir: -1 | 1) => {
    const next = [...photos]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setPhotos(next)
    saveSortOrder(next)
  }

  const onDragStart = (id: number) => { dragItem.current = id; setDraggingId(id) }
  const onDragOver = (e: React.DragEvent, id: number) => { e.preventDefault(); setDragOverId(id) }
  const onDrop = (targetId: number) => {
    const fromId = dragItem.current
    if (fromId == null || fromId === targetId) return
    const next = [...photos]
    const fromIdx = next.findIndex((p) => p.id === fromId)
    const toIdx = next.findIndex((p) => p.id === targetId)
    const [removed] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, removed)
    setPhotos(next)
    saveSortOrder(next)
    setDraggingId(null); setDragOverId(null); dragItem.current = null
  }
  const onDragEnd = () => { setDraggingId(null); setDragOverId(null); dragItem.current = null }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-foreground">フォトギャラリー管理</h1>
          <p className="text-sm text-muted-foreground mt-1">メインページのギャラリーに表示される写真を管理します</p>
          <p className="text-xs text-muted-foreground mt-0.5">ドラッグまたは ↑↓ ボタンで順番を変更できます</p>
        </div>
        <Button onClick={() => setAddMode(true)} disabled={addMode} className="bg-brand-green hover:bg-brand-green/90">
          <Plus className="w-4 h-4 mr-2" />
          写真を追加
        </Button>
      </div>

      {/* 追加フォーム */}
      {addMode && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 space-y-4">
          <h2 className="font-bold text-foreground">新しい写真を追加</h2>
          <div>
            <Label className="text-sm font-medium mb-2 block">写真</Label>
            <PhotoPicker {...addPicker} />
          </div>
          <div>
            <Label htmlFor="caption" className="text-sm font-medium">キャプション（説明文）</Label>
            <Input
              id="caption"
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
              placeholder="写真の説明を入力"
              className="mt-1.5"
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={handleAdd} disabled={!addPicker.url || isPending || addPicker.uploading} className="bg-brand-green hover:bg-brand-green/90">
              追加する
            </Button>
            <Button variant="outline" onClick={() => { setAddMode(false); addPicker.reset(); setNewCaption("") }}>
              キャンセル
            </Button>
          </div>
        </div>
      )}

      {/* 写真一覧 */}
      {photos.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-card rounded-2xl border border-border">
          <p className="font-medium">写真が登録されていません</p>
          <p className="text-sm mt-1">「写真を追加」ボタンから追加してください</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              draggable
              onDragStart={() => onDragStart(photo.id)}
              onDragOver={(e) => onDragOver(e, photo.id)}
              onDrop={() => onDrop(photo.id)}
              onDragEnd={onDragEnd}
              className={`bg-card border rounded-2xl overflow-hidden transition-all cursor-grab active:cursor-grabbing
                ${!photo.is_active ? "opacity-60" : "border-border"}
                ${draggingId === photo.id ? "opacity-40 scale-95 ring-2 ring-brand-green/50" : ""}
                ${dragOverId === photo.id && draggingId !== photo.id ? "ring-2 ring-brand-green border-brand-green" : ""}
              `}
            >
              {/* 写真変更モード */}
              {editingPhotoId === photo.id ? (
                <div className="p-4 space-y-3 border-b border-border" onClick={(e) => e.stopPropagation()}>
                  <p className="text-sm font-bold text-foreground">写真を変更</p>
                  <div className="relative w-full h-28 rounded-xl overflow-hidden border border-border bg-muted mb-2">
                    <Image src={`${photo.image_url}${photo.image_url.includes('?') ? '&' : '?'}v=${photo.id}`} alt="現在の写真" fill className="object-cover" unoptimized />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">現在の写真</span>
                    </div>
                  </div>
                  <PhotoPicker {...editPicker} placeholder="新しい画像のURLを入力..." />
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => handleUpdatePhoto(photo.id, editPicker.url)}
                      disabled={isPending || !editPicker.url || editPicker.uploading}
                      className="bg-brand-green hover:bg-brand-green/90 text-white"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      変更を保存
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setEditingPhotoId(null); editPicker.reset() }}
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      キャンセル
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-44">
                  <Image src={`${photo.image_url}${photo.image_url.includes('?') ? '&' : '?'}v=${photo.id}`} alt={photo.caption || ""} fill className="object-cover" unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-black/50 text-white flex items-center justify-center cursor-grab">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); movePhoto(index, -1) }} disabled={index === 0}
                      className="w-8 h-8 rounded-lg bg-black/50 hover:bg-black/70 text-white flex items-center justify-center disabled:opacity-30">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); movePhoto(index, 1) }} disabled={index === photos.length - 1}
                      className="w-8 h-8 rounded-lg bg-black/50 hover:bg-black/70 text-white flex items-center justify-center disabled:opacity-30">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); editPicker.reset(); setEditingPhotoId(photo.id) }}
                      className="w-8 h-8 rounded-lg bg-black/50 hover:bg-brand-green/80 text-white flex items-center justify-center">
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleToggle(photo.id, photo.is_active) }}
                      className="w-8 h-8 rounded-lg bg-black/50 hover:bg-black/70 text-white flex items-center justify-center">
                      {photo.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(photo.id) }}
                      className="w-8 h-8 rounded-lg bg-black/50 hover:bg-red-500/70 text-white flex items-center justify-center">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${photo.is_active ? "bg-brand-green text-white" : "bg-gray-500 text-white"}`}>
                      {photo.is_active ? "表示中" : "非表示"}
                    </span>
                  </div>
                </div>
              )}

              {/* キャプション */}
              <div className="p-3 space-y-3">
                {editingCaptionId === photo.id ? (
                  <div className="flex gap-2">
                    <Input value={editCaption} onChange={(e) => setEditCaption(e.target.value)} className="text-sm h-8" autoFocus />
                    <button onClick={() => handleEditCaption(photo.id)} className="text-brand-green"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setEditingCaptionId(null)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-foreground flex-1 truncate">{photo.caption || "（キャプションなし）"}</p>
                    <button onClick={() => { setEditingCaptionId(photo.id); setEditCaption(photo.caption) }}
                      className="text-muted-foreground hover:text-foreground shrink-0">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* 写真を変更ボタン */}
                {editingPhotoId !== photo.id && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      editPicker.reset()
                      setEditingPhotoId(photo.id)
                    }}
                  >
                    <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
                    写真を変更
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
