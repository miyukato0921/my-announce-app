"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import type { Announcement } from "@/lib/db"

interface Props {
  action: (formData: FormData) => Promise<void>
  defaultValues?: Announcement
}

export default function AnnouncementForm({ action, defaultValues }: Props) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    await action(formData)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <div>
          <Label htmlFor="title" className="text-sm font-medium">タイトル <span className="text-destructive">*</span></Label>
          <Input
            id="title"
            name="title"
            required
            defaultValue={defaultValues?.title ?? ""}
            placeholder="お知らせのタイトルを入力"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="content" className="text-sm font-medium">本文</Label>
          <Textarea
            id="content"
            name="content"
            defaultValue={defaultValues?.body ?? ""}
            placeholder="お知らせの内容を入力してください"
            className="mt-1"
            rows={8}
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="is_published"
            name="is_published"
            defaultChecked={defaultValues?.published ?? false}
            className="w-4 h-4 rounded border-border"
          />
          <Label htmlFor="is_published" className="text-sm font-medium cursor-pointer">公開する</Label>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-brand-dark hover:bg-brand-dark/90 text-white font-bold rounded-xl py-5"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            保存中...
          </>
        ) : (
          "保存する"
        )}
      </Button>
    </form>
  )
}
