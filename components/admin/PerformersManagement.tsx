"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { Plus, Trash2, Pencil, Eye, EyeOff, X, Check, ChevronUp, ChevronDown, Languages, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import ImageUploader from "@/components/admin/ImageUploader"

interface Performer {
  id: number
  name: string
  role: string
  bio: string
  image_url: string | null
  sort_order: number
  is_active: boolean
  name_en?: string; role_en?: string; bio_en?: string
  name_ko?: string; role_ko?: string; bio_ko?: string
  name_zh?: string; role_zh?: string; bio_zh?: string
}

interface Props {
  campaignId: number
  initialPerformers: Performer[]
}

const emptyForm = {
  name: "", role: "", bio: "", image_url: "",
  name_en: "", role_en: "", bio_en: "",
  name_ko: "", role_ko: "", bio_ko: "",
  name_zh: "", role_zh: "", bio_zh: "",
}

type FormState = typeof emptyForm

// ── 翻訳ボタン (共通) ──────────────────────────────
function AutoTranslateButton({
  texts,
  onResult,
}: {
  texts: { name: string; role: string; bio: string }
  onResult: (lang: string, result: { name: string; role: string; bio: string }) => void
}) {
  const [loading, setLoading] = useState(false)

  const handleTranslate = async () => {
    const hasText = texts.name.trim() || texts.role.trim() || texts.bio.trim()
    if (!hasText) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: { name: texts.name, role: texts.role, bio: texts.bio } }),
      })
      const data = await res.json()
      if (data.translations) {
        for (const lang of ["en", "ko", "zh"] as const) {
          if (data.translations[lang]) {
            onResult(lang, data.translations[lang])
          }
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={handleTranslate}
      disabled={loading}
      className="gap-1.5 text-xs h-8 border-brand-green/40 text-brand-green hover:bg-brand-green/10"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Languages className="w-3.5 h-3.5" />}
      {loading ? "翻訳中..." : "EN / KO / ZH に自動翻訳"}
    </Button>
  )
}

// ── 多言語フォームセクション ──────────────────────────
function I18nFields({
  form,
  onChange,
}: {
  form: FormState
  onChange: (updates: Partial<FormState>) => void
}) {
  return (
    <div className="space-y-5 border-t border-border pt-4">
      {(["en", "ko", "zh"] as const).map((lang) => {
        const labels = {
          en: { lang: "English", name: "Name", role: "Role / Title", bio: "Bio" },
          ko: { lang: "한국어", name: "이름", role: "역할 / 직함", bio: "프로필" },
          zh: { lang: "中文", name: "姓名", role: "角色 / 头衔", bio: "简介" },
        }[lang]
        return (
          <div key={lang} className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{labels.lang}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">{labels.name}</Label>
                <Input
                  value={(form as any)[`name_${lang}`]}
                  onChange={(e) => onChange({ [`name_${lang}`]: e.target.value })}
                  className="mt-1 text-sm h-8"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">{labels.role}</Label>
                <Input
                  value={(form as any)[`role_${lang}`]}
                  onChange={(e) => onChange({ [`role_${lang}`]: e.target.value })}
                  className="mt-1 text-sm h-8"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">{labels.bio}</Label>
              <Textarea
                value={(form as any)[`bio_${lang}`]}
                onChange={(e) => onChange({ [`bio_${lang}`]: e.target.value })}
                rows={2}
                className="mt-1 text-sm resize-none"
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── メインコンポーネント ──────────────────────────────
export default function PerformersManagement({ campaignId, initialPerformers }: Props) {
  const [performers, setPerformers] = useState<Performer[]>(initialPerformers)
  const [isPending, startTransition] = useTransition()
  const [addMode, setAddMode] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<FormState>(emptyForm)

  const reload = async () => {
    const res = await fetch(`/api/admin/performers?campaign_id=${campaignId}`)
    if (res.ok) setPerformers(await res.json())
  }

  const handleAdd = () => {
    if (!form.name) return
    startTransition(async () => {
      await fetch("/api/admin/performers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: campaignId, ...form, sort_order: performers.length }),
      })
      setForm(emptyForm)
      setAddMode(false)
      await reload()
    })
  }

  const movePerformer = (index: number, direction: "up" | "down") => {
    const newList = [...performers]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newList.length) return
    ;[newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]]
    const reordered = newList.map((p, i) => ({ ...p, sort_order: i }))
    setPerformers(reordered)
    startTransition(async () => {
      await fetch("/api/admin/performers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reordered.map(({ id, sort_order }) => ({ id, sort_order }))),
      })
    })
  }

  const handleDelete = (id: number) => {
    if (!confirm("この出演者を削除しますか？")) return
    startTransition(async () => {
      await fetch(`/api/admin/performers/${id}`, { method: "DELETE" })
      await reload()
    })
  }

  const handleToggle = (id: number, current: boolean) => {
    startTransition(async () => {
      await fetch(`/api/admin/performers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !current }),
      })
      await reload()
    })
  }

  const startEdit = (p: Performer) => {
    setEditingId(p.id)
    setEditForm({
      name: p.name, role: p.role, bio: p.bio, image_url: p.image_url || "",
      name_en: p.name_en || "", role_en: p.role_en || "", bio_en: p.bio_en || "",
      name_ko: p.name_ko || "", role_ko: p.role_ko || "", bio_ko: p.bio_ko || "",
      name_zh: p.name_zh || "", role_zh: p.role_zh || "", bio_zh: p.bio_zh || "",
    })
  }

  const handleUpdate = (id: number) => {
    startTransition(async () => {
      await fetch(`/api/admin/performers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      setEditingId(null)
      await reload()
    })
  }

  // 翻訳結果をフォームに反映
  const applyTranslation = (
    setter: React.Dispatch<React.SetStateAction<FormState>>,
    lang: string,
    result: { name: string; role: string; bio: string }
  ) => {
    setter((prev) => ({
      ...prev,
      [`name_${lang}`]: result.name || (prev as any)[`name_${lang}`],
      [`role_${lang}`]: result.role || (prev as any)[`role_${lang}`],
      [`bio_${lang}`]: result.bio || (prev as any)[`bio_${lang}`],
    }))
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-foreground">出演者管理</h1>
          <p className="text-sm text-muted-foreground mt-1">メインページの出演者紹介セクションを管理します</p>
        </div>
        <Button onClick={() => setAddMode(true)} disabled={addMode} className="bg-brand-green hover:bg-brand-green/90">
          <Plus className="w-4 h-4 mr-2" />
          出演者を追加
        </Button>
      </div>

      {/* 追加フォーム */}
      {addMode && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 space-y-5">
          <h2 className="font-bold text-foreground">新しい出演者を追加</h2>

          {/* 日本語 */}
          <div className="space-y-4 pb-4 border-b border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">日本語</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">名前 <span className="text-destructive">*</span></Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例：孝藤右近" className="mt-1.5" />
              </div>
              <div>
                <Label className="text-sm font-medium">役割・肩書き</Label>
                <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="例：日本舞踊" className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">プロフィール</Label>
              <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="出演者の紹介文を入力" className="mt-1.5" rows={3} />
            </div>
            <AutoTranslateButton
              texts={{ name: form.name, role: form.role, bio: form.bio }}
              onResult={(lang, result) => applyTranslation(setForm, lang, result)}
            />
          </div>

          {/* EN / KO / ZH */}
          <I18nFields form={form} onChange={(u) => setForm((p) => ({ ...p, ...u }))} />

          {/* 写真 */}
          <div>
            <Label className="text-sm font-medium mb-2 block">プロフィール写真</Label>
            <ImageUploader name="image_url" label="プロフィール写真" currentUrl={form.image_url} onUrlChange={(url) => setForm({ ...form, image_url: url })} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleAdd} disabled={!form.name || isPending} className="bg-brand-green hover:bg-brand-green/90">追加する</Button>
            <Button variant="outline" onClick={() => { setAddMode(false); setForm(emptyForm) }}>キャンセル</Button>
          </div>
        </div>
      )}

      {/* 出演者一覧 */}
      {performers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-card rounded-2xl border border-border">
          <p className="font-medium">出演者が登録されていません</p>
          <p className="text-sm mt-1">「出演者を追加」ボタンから追加してください</p>
        </div>
      ) : (
        <div className="space-y-4">
          {performers.map((p, index) => (
            <div key={p.id} className={`bg-card border rounded-2xl overflow-hidden ${!p.is_active ? "opacity-50 border-border" : "border-border"}`}>
              {editingId === p.id ? (
                <div className="p-6 space-y-5">
                  <h3 className="font-bold text-foreground">編集中</h3>

                  {/* 日本語 */}
                  <div className="space-y-4 pb-4 border-b border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">日本語</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">名前</Label>
                        <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="mt-1.5" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">役割</Label>
                        <Input value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="mt-1.5" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">プロフィール</Label>
                      <Textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} className="mt-1.5" rows={3} />
                    </div>
                    <AutoTranslateButton
                      texts={{ name: editForm.name, role: editForm.role, bio: editForm.bio }}
                      onResult={(lang, result) => applyTranslation(setEditForm, lang, result)}
                    />
                  </div>

                  {/* EN / KO / ZH */}
                  <I18nFields form={editForm} onChange={(u) => setEditForm((prev) => ({ ...prev, ...u }))} />

                  {/* 写真 */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">写真</Label>
                    <ImageUploader name="image_url" label="プロフィール写真" currentUrl={editForm.image_url} onUrlChange={(url) => setEditForm({ ...editForm, image_url: url })} />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => handleUpdate(p.id)} disabled={isPending} className="bg-brand-green hover:bg-brand-green/90">
                      <Check className="w-4 h-4 mr-1" /> 保存
                    </Button>
                    <Button variant="outline" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4 mr-1" /> キャンセル
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-4 p-4">
                  {/* 並び替えボタン */}
                  <div className="flex flex-col gap-1 justify-center shrink-0">
                    <button
                      onClick={() => movePerformer(index, "up")}
                      disabled={index === 0 || isPending}
                      className="w-7 h-7 rounded-lg border border-border hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => movePerformer(index, "down")}
                      disabled={index === performers.length - 1 || isPending}
                      className="w-7 h-7 rounded-lg border border-border hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-muted">
                    {p.image_url ? (
                      <Image src={p.image_url} alt={p.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-2xl font-black">
                        {p.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-brand-gold font-bold uppercase tracking-wider">{p.role}</p>
                        <p className="font-black text-foreground text-lg">{p.name}</p>
                        {(p.name_en || p.name_ko || p.name_zh) && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {[p.name_en, p.name_ko, p.name_zh].filter(Boolean).join(" / ")}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => handleToggle(p.id, p.is_active)} className="w-8 h-8 rounded-lg border border-border hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title={p.is_active ? "非表示" : "表示"}>
                          {p.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button onClick={() => startEdit(p)} className="w-8 h-8 rounded-lg border border-border hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="w-8 h-8 rounded-lg border border-border hover:bg-red-500/10 hover:border-red-500/30 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.bio}</p>
                    <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${p.is_active ? "bg-brand-green/10 text-brand-green" : "bg-muted text-muted-foreground"}`}>
                      {p.is_active ? "表示中" : "非表示"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
