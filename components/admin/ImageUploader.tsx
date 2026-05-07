"use client"

import { useState, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Upload, X, ImageIcon, Loader2 } from "lucide-react"
import Image from "next/image"

interface Props {
  name: string
  label: string
  defaultValue?: string | null
  currentUrl?: string
  required?: boolean
  onUrlChange?: (url: string) => void
}

export default function ImageUploader({ name, label, defaultValue, currentUrl, required, onUrlChange }: Props) {
  const [url, setUrl] = useState<string>(currentUrl ?? defaultValue ?? "")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)



  const setUrlAndNotify = useCallback((newUrl: string) => {
    setUrl(newUrl)
    onUrlChange?.(newUrl)
  }, [onUrlChange])

  const upload = useCallback(async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "アップロード失敗")
      setUrlAndNotify(data.url)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "アップロードに失敗しました")
    } finally {
      setUploading(false)
    }
  }, [setUrlAndNotify])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) upload(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) upload(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = () => setDragging(false)

  const handleRemove = () => {
    setUrlAndNotify("")
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleUrlInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrlAndNotify(e.target.value)
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-bold">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>

      {/* This hidden input carries the value into the FormData on submit */}
      <input type="hidden" name={name} value={url} readOnly />

      {url ? (
        <div className="relative group rounded-xl overflow-hidden border border-border bg-muted">
          <div className="relative w-full h-48">
            <Image
              src={url}
              alt="アップロード済み画像"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="rounded-lg"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-1.5" />
              変更
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="rounded-lg"
              onClick={handleRemove}
            >
              <X className="w-4 h-4 mr-1.5" />
              削除
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center gap-3
            w-full h-40 rounded-xl border-2 border-dashed cursor-pointer transition-colors
            ${dragging
              ? "border-brand-green bg-brand-green/5"
              : "border-border hover:border-brand-green/60 hover:bg-muted/50"
            }
          `}
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
              <span className="text-sm text-muted-foreground">アップロード中...</span>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-brand-green/10 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-brand-green" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">クリックまたはドラッグ＆ドロップ</p>
                <p className="text-xs text-muted-foreground mt-0.5">JPEG・PNG・WebP・GIF（最大5MB）</p>
              </div>
            </>
          )}
        </div>
      )}

      <Input
        placeholder="またはURLを直接入力..."
        value={url}
        onChange={handleUrlInput}
        className="text-xs"
      />

      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <X className="w-3 h-3" /> {error}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
