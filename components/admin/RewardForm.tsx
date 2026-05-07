"use client"

import { useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import ImageUploader from "@/components/admin/ImageUploader"
import type { Campaign, RewardTier } from "@/lib/db"
import Link from "next/link"
import { ArrowLeft, Save, Loader2, Languages } from "lucide-react"

interface Props {
  action: (formData: FormData) => Promise<void>
  campaigns: Campaign[]
  defaultValues?: RewardTier
}

export default function RewardForm({ action, campaigns, defaultValues }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [isTranslating, setIsTranslating] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>(defaultValues?.image_url ?? "")

  const d = defaultValues as any

  const [requiresShipping, setRequiresShipping] = useState(d?.requires_shipping ?? false)

  const [fields, setFields] = useState({
    title: d?.title ?? "",
    description: d?.description ?? "",
    title_en: d?.title_en ?? "",
    description_en: d?.description_en ?? "",
    title_ko: d?.title_ko ?? "",
    description_ko: d?.description_ko ?? "",
    title_zh: d?.title_zh ?? "",
    description_zh: d?.description_zh ?? "",
  })

  const setInput = (key: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((prev) => ({ ...prev, [key]: e.target.value }))

  const handleAutoTranslate = async () => {
    if (!fields.title && !fields.description) {
      alert("日本語のタイトルまたは説明文を入力してください。")
      return
    }
    setIsTranslating(true)
    try {
      const texts: Record<string, string> = {}
      if (fields.title) texts.title = fields.title
      if (fields.description) texts.description = fields.description

      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setFields((prev) => ({
        ...prev,
        title_en: data.translations.en?.title ?? prev.title_en,
        description_en: data.translations.en?.description ?? prev.description_en,
        title_ko: data.translations.ko?.title ?? prev.title_ko,
        description_ko: data.translations.ko?.description ?? prev.description_ko,
        title_zh: data.translations.zh?.title ?? prev.title_zh,
        description_zh: data.translations.zh?.description ?? prev.description_zh,
      }))
    } catch {
      alert("翻訳に失敗しました。しばらくしてから再度お試しください。")
    } finally {
      setIsTranslating(false)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = formRef.current
    if (!form) return
    const fd = new FormData(form)
    fd.set("image_url", imageUrl)
    fd.set("requires_shipping", requiresShipping ? "on" : "")
    Object.entries(fields).forEach(([k, v]) => fd.set(k, v))
    startTransition(() => action(fd))
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <div>
          <Label htmlFor="campaign_id" className="text-sm font-bold">キャンペーン <span className="text-destructive">*</span></Label>
          <select
            id="campaign_id"
            name="campaign_id"
            required
            defaultValue={defaultValues?.campaign_id ?? campaigns[0]?.id}
            className="w-full mt-1.5 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        {/* 日本語 */}
        <div className="pb-4 border-b border-border space-y-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">日本語</p>
          <div>
            <Label htmlFor="title" className="text-sm font-bold">タイトル <span className="text-destructive">*</span></Label>
            <Input id="title" name="title" required value={fields.title} onChange={setInput("title")} placeholder="例：アイリッシュ盆踊りステージ参加権" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="description" className="text-sm font-bold">説明 <span className="text-destructive">*</span></Label>
            <Textarea id="description" name="description" required rows={4} value={fields.description} onChange={setInput("description")} placeholder="リターン内容の詳細説明..." className="mt-1.5 resize-none" />
          </div>

          {/* 自動翻訳ボタン */}
          <Button
            type="button"
            onClick={handleAutoTranslate}
            disabled={isTranslating || (!fields.title && !fields.description)}
            variant="outline"
            className="border-brand-green text-brand-green hover:bg-brand-green/10 rounded-xl font-bold"
          >
            {isTranslating
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />翻訳中...</>
              : <><Languages className="w-4 h-4 mr-2" />EN / KO / ZH に自動翻訳</>
            }
          </Button>
        </div>

        {/* English */}
        <div className="pb-4 border-b border-border space-y-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">English</p>
          <div>
            <Label htmlFor="title_en" className="text-sm font-bold">Title</Label>
            <Input id="title_en" name="title_en" value={fields.title_en} onChange={setInput("title_en")} placeholder="e.g. Irish Bon Odori Stage Participation" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="description_en" className="text-sm font-bold">Description</Label>
            <Textarea id="description_en" name="description_en" rows={4} value={fields.description_en} onChange={setInput("description_en")} placeholder="Detailed description of this reward..." className="mt-1.5 resize-none" />
          </div>
        </div>

        {/* 한국어 */}
        <div className="pb-4 border-b border-border space-y-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">한국어</p>
          <div>
            <Label htmlFor="title_ko" className="text-sm font-bold">제목</Label>
            <Input id="title_ko" name="title_ko" value={fields.title_ko} onChange={setInput("title_ko")} placeholder="예: 아이리시 봉오도리 스테이지 참가권" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="description_ko" className="text-sm font-bold">설명</Label>
            <Textarea id="description_ko" name="description_ko" rows={4} value={fields.description_ko} onChange={setInput("description_ko")} placeholder="리턴 내용 상세 설명..." className="mt-1.5 resize-none" />
          </div>
        </div>

        {/* 中文 */}
        <div className="space-y-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">中文</p>
          <div>
            <Label htmlFor="title_zh" className="text-sm font-bold">标题</Label>
            <Input id="title_zh" name="title_zh" value={fields.title_zh} onChange={setInput("title_zh")} placeholder="例: 爱尔兰盆踊舞台参与权" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="description_zh" className="text-sm font-bold">说明</Label>
            <Textarea id="description_zh" name="description_zh" rows={4} value={fields.description_zh} onChange={setInput("description_zh")} placeholder="回报内容详细说明..." className="mt-1.5 resize-none" />
          </div>
        </div>

        <ImageUploader
          name="image_url"
          label="リターン画像"
          defaultValue={defaultValues?.image_url}
          onUrlChange={setImageUrl}
        />
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="amount" className="text-sm font-bold">支援金額（円） <span className="text-destructive">*</span></Label>
            <Input id="amount" name="amount" type="number" min={1} required defaultValue={defaultValues?.amount} placeholder="20000" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="limit_count" className="text-sm font-bold">数量上限（空白=無制限）</Label>
            <Input id="limit_count" name="limit_count" type="number" min={1} defaultValue={defaultValues?.limit_count ?? ""} placeholder="50" className="mt-1.5" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="delivery_date" className="text-sm font-bold">発送・提供予定</Label>
            <Input id="delivery_date" name="delivery_date" defaultValue={defaultValues?.delivery_date ?? ""} placeholder="2026年03月" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="sort_order" className="text-sm font-bold">表示順</Label>
            <Input id="sort_order" name="sort_order" type="number" min={0} defaultValue={defaultValues?.sort_order ?? 0} className="mt-1.5" />
          </div>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <input
            id="requires_shipping"
            name="requires_shipping"
            type="checkbox"
            checked={requiresShipping}
            onChange={(e) => setRequiresShipping(e.target.checked)}
            className="w-4 h-4 rounded border border-input accent-brand-green"
          />
          <Label htmlFor="requires_shipping" className="text-sm font-bold cursor-pointer">
            配送が必要（チェックすると支援完了後に住所入力欄が表示されます）
          </Label>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <input
            id="is_active"
            name="is_active"
            type="checkbox"
            defaultChecked={defaultValues?.is_active ?? true}
            className="w-4 h-4 rounded border border-input accent-brand-green"
          />
          <Label htmlFor="is_active" className="text-sm font-bold cursor-pointer">公開中（チェックを外すと非公開）</Label>
        </div>
      </div>

      <div className="flex gap-3 justify-between">
        <Button type="button" variant="outline" className="rounded-xl" asChild>
          <Link href="/admin/rewards">
            <ArrowLeft className="w-4 h-4 mr-2" />
            戻る
          </Link>
        </Button>
        <Button type="submit" disabled={isPending} className="bg-brand-green hover:bg-brand-green/90 text-white rounded-xl">
          {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {isPending ? "保存中..." : "保存する"}
        </Button>
      </div>
    </form>
  )
}
