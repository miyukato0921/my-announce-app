"use client"

import { useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import ImageUploader from "@/components/admin/ImageUploader"
import BlockEditor from "@/components/admin/BlockEditor"
import type { PageBlock } from "@/lib/block-types"
import type { Campaign } from "@/lib/db"
import Link from "next/link"
import { ArrowLeft, Save, Loader2, Languages, Check } from "lucide-react"

interface Props {
  action: (formData: FormData) => Promise<void>
  defaultValues?: Campaign
}

export default function CampaignForm({ action, defaultValues }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [isTranslating, setIsTranslating] = useState(false)
  const [translateDone, setTranslateDone] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>(defaultValues?.hero_image_url ?? "")

  const d = defaultValues as any

  const parseBlocks = (raw: unknown): PageBlock[] => {
    if (!raw) return []
    if (Array.isArray(raw)) return raw as PageBlock[]
    if (typeof raw === "string") {
      try { return JSON.parse(raw) as PageBlock[] } catch { return [] }
    }
    return []
  }

  const [blocks, setBlocks] = useState<PageBlock[]>(() => parseBlocks(d?.page_blocks))
  // 翻訳済みブロック（DBから読み込み or 翻訳ボタンで生成）
  const [blocksEn, setBlocksEn] = useState<PageBlock[]>(() => parseBlocks(d?.page_blocks_en))
  const [blocksKo, setBlocksKo] = useState<PageBlock[]>(() => parseBlocks(d?.page_blocks_ko))
  const [blocksZh, setBlocksZh] = useState<PageBlock[]>(() => parseBlocks(d?.page_blocks_zh))

  const [fields, setFields] = useState({
    title: d?.title ?? "",
    short_description: d?.short_description ?? "",
    title_en: d?.title_en ?? "",
    short_description_en: d?.short_description_en ?? "",
    title_ko: d?.title_ko ?? "",
    short_description_ko: d?.short_description_ko ?? "",
    title_zh: d?.title_zh ?? "",
    short_description_zh: d?.short_description_zh ?? "",
  })

  const set = (key: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((prev) => ({ ...prev, [key]: e.target.value }))

  const toDateTimeInput = (dateStr?: string) => {
    if (!dateStr) return ""
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ""
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const handleAutoTranslate = async () => {
    if (!fields.title && !fields.short_description && blocks.length === 0) {
      alert("日本語のタイトル・説明文またはページコンテンツを入力してください。")
      return
    }
    setIsTranslating(true)
    setTranslateDone(false)
    try {
      // タイトル・説明文
      const texts: Record<string, string> = {}
      if (fields.title) texts.title = fields.title
      if (fields.short_description) texts.short_description = fields.short_description

      // ブロック内テキストを抽出
      blocks.forEach((block, i) => {
        if (block.title) texts[`b${i}_title`] = block.title
        if (block.content && block.type !== "divider") texts[`b${i}_content`] = block.content
        if (block.imageCaption) texts[`b${i}_caption`] = block.imageCaption
        if (block.imageAlt) texts[`b${i}_alt`] = block.imageAlt
        if (block.items) {
          block.items.forEach((item, j) => {
            if (item.label) texts[`b${i}_i${j}_label`] = item.label
            if (item.description) texts[`b${i}_i${j}_desc`] = item.description
          })
        }
      })

      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // タイトル・説明文の翻訳を反映
      setFields((prev) => ({
        ...prev,
        title_en: data.translations.en?.title ?? prev.title_en,
        short_description_en: data.translations.en?.short_description ?? prev.short_description_en,
        title_ko: data.translations.ko?.title ?? prev.title_ko,
        short_description_ko: data.translations.ko?.short_description ?? prev.short_description_ko,
        title_zh: data.translations.zh?.title ?? prev.title_zh,
        short_description_zh: data.translations.zh?.short_description ?? prev.short_description_zh,
      }))

      // ブロックの翻訳を各言語に反映
      if (blocks.length > 0) {
        const buildTranslatedBlocks = (lang: string): PageBlock[] => {
          return blocks.map((block, i) => ({
            ...block,
            title: data.translations[lang]?.[`b${i}_title`] ?? block.title,
            content: block.type !== "divider"
              ? (data.translations[lang]?.[`b${i}_content`] ?? block.content)
              : block.content,
            imageCaption: data.translations[lang]?.[`b${i}_caption`] ?? block.imageCaption,
            imageAlt: data.translations[lang]?.[`b${i}_alt`] ?? block.imageAlt,
            items: block.items?.map((item, j) => ({
              ...item,
              label: data.translations[lang]?.[`b${i}_i${j}_label`] ?? item.label,
              description: data.translations[lang]?.[`b${i}_i${j}_desc`] ?? item.description,
            })),
          }))
        }
        setBlocksEn(buildTranslatedBlocks("en"))
        setBlocksKo(buildTranslatedBlocks("ko"))
        setBlocksZh(buildTranslatedBlocks("zh"))
      }

      setTranslateDone(true)
      setTimeout(() => setTranslateDone(false), 5000)
    } catch (err) {
      alert("翻訳に失敗しました。しばらくしてから再度お試しください。")
    } finally {
      setIsTranslating(false)
    }
  }

  const handleImageUpload = async (file: File): Promise<string> => {
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
    const data = await res.json()
    return data.url ?? ""
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = formRef.current
    if (!form) return
    const fd = new FormData(form)
    fd.set("hero_image_url", imageUrl)
    fd.set("page_blocks", JSON.stringify(blocks))
    fd.set("page_blocks_en", JSON.stringify(blocksEn))
    fd.set("page_blocks_ko", JSON.stringify(blocksKo))
    fd.set("page_blocks_zh", JSON.stringify(blocksZh))
    Object.entries(fields).forEach(([k, v]) => fd.set(k, v))
    startTransition(() => action(fd))
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">

        {/* 日本語 */}
        <div className="pb-5 border-b border-border space-y-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">日本語</p>
          <div>
            <Label htmlFor="title" className="text-sm font-bold">タイトル <span className="text-destructive">*</span></Label>
            <Input id="title" name="title" required value={fields.title} onChange={set("title")} placeholder="例：クラウドファンディングプロジェクト 2026" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="short_description" className="text-sm font-bold">短い説明文 <span className="text-destructive">*</span></Label>
            <Input id="short_description" name="short_description" required value={fields.short_description} onChange={set("short_description")} placeholder="一覧ページやSNSで表示される短い説明" className="mt-1.5" />
          </div>

          {/* 自動翻訳ボタン */}
          <Button
            type="button"
            onClick={handleAutoTranslate}
            disabled={isTranslating || (!fields.title && !fields.short_description && blocks.length === 0)}
            variant="outline"
            className="border-brand-green text-brand-green hover:bg-brand-green/10 rounded-xl font-bold"
          >
            {isTranslating
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />タイトル＋ブロックを翻訳中...</>
              : translateDone
                ? <><Check className="w-4 h-4 mr-2" />翻訳完了（EN/KO/ZH）</>
                : <><Languages className="w-4 h-4 mr-2" />EN / KO / ZH に自動翻訳（タイトル＋ブロック）</>
            }
          </Button>
          {translateDone && (
            <p className="text-xs text-brand-green">タイトル・説明文・ページコンテンツが翻訳されました。「保存する」で反映されます。</p>
          )}
        </div>

        {/* English */}
        <div className="pb-5 border-b border-border space-y-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">English</p>
          <div>
            <Label htmlFor="title_en" className="text-sm font-bold">Title</Label>
            <Input id="title_en" name="title_en" value={fields.title_en} onChange={set("title_en")} placeholder="e.g. Crowdfunding Project 2026" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="short_description_en" className="text-sm font-bold">Short Description</Label>
            <Input id="short_description_en" name="short_description_en" value={fields.short_description_en} onChange={set("short_description_en")} placeholder="Short description for listing pages" className="mt-1.5" />
          </div>
        </div>

        {/* 한국어 */}
        <div className="pb-5 border-b border-border space-y-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">한국어</p>
          <div>
            <Label htmlFor="title_ko" className="text-sm font-bold">제목</Label>
            <Input id="title_ko" name="title_ko" value={fields.title_ko} onChange={set("title_ko")} placeholder="예: 그린 아일랜드 페스티벌 2026 크라우드펀딩" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="short_description_ko" className="text-sm font-bold">짧은 설명</Label>
            <Input id="short_description_ko" name="short_description_ko" value={fields.short_description_ko} onChange={set("short_description_ko")} placeholder="목록 페이지에 표시되는 짧은 설명" className="mt-1.5" />
          </div>
        </div>

        {/* 中文 */}
        <div className="pb-5 border-b border-border space-y-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">中文</p>
          <div>
            <Label htmlFor="title_zh" className="text-sm font-bold">标题</Label>
            <Input id="title_zh" name="title_zh" value={fields.title_zh} onChange={set("title_zh")} placeholder="例: 绿色爱尔兰节 2026 众筹" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="short_description_zh" className="text-sm font-bold">简短说明</Label>
            <Input id="short_description_zh" name="short_description_zh" value={fields.short_description_zh} onChange={set("short_description_zh")} placeholder="列表页面显示的简短说明" className="mt-1.5" />
          </div>
        </div>

        <ImageUploader
          name="hero_image_url"
          label="ヒーロー画像"
          defaultValue={defaultValues?.hero_image_url}
          onUrlChange={setImageUrl}
        />
      </div>

      {/* ページコンテンツブロック */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div>
          <h2 className="text-sm font-black text-foreground">ページコンテンツ</h2>
          <p className="text-xs text-muted-foreground mt-1">
            ブロックを追加・並び替えて公開ページのレイアウトを自由に構成できます。「自動翻訳」ボタンでEN/KO/ZHも自動生成されます。
          </p>
        </div>
        <BlockEditor initialBlocks={blocks} onChange={setBlocks} onImageUpload={handleImageUpload} />
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <div>
          <Label htmlFor="goal_amount" className="text-sm font-bold">目標金額（円） <span className="text-destructive">*</span></Label>
          <Input id="goal_amount" name="goal_amount" type="number" min={1} required defaultValue={defaultValues?.goal_amount} placeholder="1000000" className="mt-1.5" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_date" className="text-sm font-bold">開始日時 <span className="text-destructive">*</span></Label>
            <Input id="start_date" name="start_date" type="datetime-local" required defaultValue={toDateTimeInput(defaultValues?.start_date)} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="end_date" className="text-sm font-bold">終了日時 <span className="text-destructive">*</span></Label>
            <Input id="end_date" name="end_date" type="datetime-local" required defaultValue={toDateTimeInput(defaultValues?.end_date)} className="mt-1.5" />
          </div>
        </div>
        <div>
          <Label htmlFor="event_date" className="text-sm font-bold">イベント開催日（表示テキスト）</Label>
          <Input id="event_date" name="event_date" defaultValue={(defaultValues as any)?.event_date ?? ""} placeholder="例：2026年3月15日（日）" className="mt-1.5" />
          <p className="text-xs text-muted-foreground mt-1">メインページのイベント概要に表示されます</p>
        </div>
        <div>
          <Label htmlFor="event_venue" className="text-sm font-bold">開催会場（表示テキスト）</Label>
          <Input id="event_venue" name="event_venue" defaultValue={(defaultValues as any)?.event_venue ?? ""} placeholder="例：東京（詳細は支援者にご連絡）" className="mt-1.5" />
          <p className="text-xs text-muted-foreground mt-1">メインページのイベント概要に表示されます</p>
        </div>
        <div>
          <Label htmlFor="status" className="text-sm font-bold">ステータス</Label>
          <select
            id="status"
            name="status"
            defaultValue={defaultValues?.status ?? "draft"}
            className="w-full mt-1.5 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="draft">下書き</option>
            <option value="active">実施中</option>
            <option value="completed">終了</option>
            <option value="cancelled">中止</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 justify-between">
        <Button type="button" variant="outline" className="rounded-xl" asChild>
          <Link href="/admin/campaigns"><ArrowLeft className="w-4 h-4 mr-2" />戻る</Link>
        </Button>
        <Button type="submit" disabled={isPending} className="bg-brand-green hover:bg-brand-green/90 text-white rounded-xl">
          {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {isPending ? "保存中..." : "保存する"}
        </Button>
      </div>
    </form>
  )
}
