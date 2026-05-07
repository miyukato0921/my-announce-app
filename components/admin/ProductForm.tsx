"use client"

import { useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import ImageUploader from "@/components/admin/ImageUploader"
import type { Product } from "@/lib/db"
import Link from "next/link"
import { ArrowLeft, Save, Loader2, Languages } from "lucide-react"

interface Props {
  action: (formData: FormData) => Promise<void>
  defaultValues?: Product
}

const LANGS = ["en", "ko", "zh"] as const
const LANG_LABELS: Record<string, string> = { en: "English", ko: "Korean", zh: "Chinese" }

export default function ProductForm({ action, defaultValues }: Props) {
  const dv = defaultValues as any
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [imageUrl, setImageUrl] = useState<string>(defaultValues?.image_url ?? "")

  const [name, setName] = useState(defaultValues?.name ?? "")
  const [description, setDescription] = useState(defaultValues?.description ?? "")

  const [nameEn, setNameEn] = useState(dv?.name_en ?? "")
  const [nameKo, setNameKo] = useState(dv?.name_ko ?? "")
  const [nameZh, setNameZh] = useState(dv?.name_zh ?? "")
  const [descEn, setDescEn] = useState(dv?.description_en ?? "")
  const [descKo, setDescKo] = useState(dv?.description_ko ?? "")
  const [descZh, setDescZh] = useState(dv?.description_zh ?? "")

  const [translating, setTranslating] = useState(false)

  const nameSetters: Record<string, (v: string) => void> = { en: setNameEn, ko: setNameKo, zh: setNameZh }
  const descSetters: Record<string, (v: string) => void> = { en: setDescEn, ko: setDescKo, zh: setDescZh }

  const handleTranslate = async () => {
    if (!name && !description) return
    setTranslating(true)
    try {
      const fields: Record<string, string> = {}
      if (name) fields.name = name
      if (description) fields.description = description
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      })
      if (!res.ok) throw new Error("Translation failed")
      const data = await res.json()
      for (const lang of LANGS) {
        if (data[lang]?.name) nameSetters[lang](data[lang].name)
        if (data[lang]?.description) descSetters[lang](data[lang].description)
      }
    } catch { alert("翻訳に失敗しました") }
    finally { setTranslating(false) }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = formRef.current
    if (!form) return
    const fd = new FormData(form)
    fd.set("image_url", imageUrl)
    fd.set("name", name)
    fd.set("description", description)
    fd.set("name_en", nameEn); fd.set("name_ko", nameKo); fd.set("name_zh", nameZh)
    fd.set("description_en", descEn); fd.set("description_ko", descKo); fd.set("description_zh", descZh)
    startTransition(() => action(fd))
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <h3 className="text-sm font-bold text-foreground">日本語（メイン）</h3>
        <div>
          <Label htmlFor="name" className="text-sm font-bold">商品名 <span className="text-destructive">*</span></Label>
          <Input id="name" name="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="例：オリジナルTシャツ 2026" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="description" className="text-sm font-bold">商品説明</Label>
          <Textarea id="description" name="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="商品の詳細説明..." className="mt-1.5 resize-none" />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTranslate}
          disabled={translating || (!name && !description)}
          className="w-full"
        >
          {translating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Languages className="w-4 h-4 mr-2" />}
          {translating ? "翻訳中..." : "EN / KO / ZH に自動翻訳"}
        </Button>

        {LANGS.map((lang) => (
          <div key={lang} className="border-t border-border pt-4 space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase">{LANG_LABELS[lang]}</h4>
            <div>
              <Label className="text-xs">商品名</Label>
              <Input
                value={lang === "en" ? nameEn : lang === "ko" ? nameKo : nameZh}
                onChange={(e) => nameSetters[lang](e.target.value)}
                placeholder={`商品名 (${LANG_LABELS[lang]})`}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">商品説明</Label>
              <Textarea
                value={lang === "en" ? descEn : lang === "ko" ? descKo : descZh}
                onChange={(e) => descSetters[lang](e.target.value)}
                placeholder={`商品説明 (${LANG_LABELS[lang]})`}
                rows={2}
                className="mt-1 resize-none"
              />
            </div>
          </div>
        ))}

        <ImageUploader
          name="image_url"
          label="商品画像"
          defaultValue={defaultValues?.image_url}
          onUrlChange={setImageUrl}
        />
        <div>
          <Label htmlFor="category" className="text-sm font-bold">カテゴリ</Label>
          <Input id="category" name="category" defaultValue={defaultValues?.category ?? ""} placeholder="例：アパレル、グッズ、食品" className="mt-1.5" />
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price" className="text-sm font-bold">価格（円） <span className="text-destructive">*</span></Label>
            <Input id="price" name="price" type="number" min={0} required defaultValue={defaultValues?.price} placeholder="5000" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="stock_count" className="text-sm font-bold">在庫数（空白=無制限）</Label>
            <Input id="stock_count" name="stock_count" type="number" min={0} defaultValue={defaultValues?.stock_count ?? ""} placeholder="100" className="mt-1.5" />
          </div>
        </div>
        <div className="flex items-center gap-3">
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
          <Link href="/admin/products">
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
