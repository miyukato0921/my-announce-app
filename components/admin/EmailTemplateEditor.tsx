"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Check, ChevronDown, ChevronUp, Mail, Save, ToggleLeft, ToggleRight } from "lucide-react"

interface EmailTemplate {
  id: number
  slug: string
  name: string
  subject: string
  body: string
  description: string | null
  is_active: boolean
}

interface Props {
  templates: EmailTemplate[]
}

export default function EmailTemplateEditor({ templates: initial }: Props) {
  const [templates, setTemplates] = useState<EmailTemplate[]>(initial)
  const [openId, setOpenId] = useState<number | null>(initial[0]?.id ?? null)
  const [saved, setSaved] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  const updateField = (id: number, field: keyof EmailTemplate, value: string | boolean) => {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)))
  }

  const handleSave = (t: EmailTemplate) => {
    startTransition(async () => {
      await fetch(`/api/admin/email-templates/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: t.name,
          subject: t.subject,
          body: t.body,
          is_active: t.is_active,
        }),
      })
      setSaved(t.id)
      setTimeout(() => setSaved(null), 3000)
    })
  }

  return (
    <div className="space-y-4 max-w-3xl">
      {templates.map((t) => {
        const isOpen = openId === t.id
        return (
          <div key={t.id} className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Header */}
            <button
              className="w-full flex items-center justify-between p-5 hover:bg-muted/40 transition-colors text-left"
              onClick={() => setOpenId(isOpen ? null : t.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-green/10 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-brand-green" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{t.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={t.is_active ? "default" : "secondary"} className={t.is_active ? "bg-brand-green text-white" : ""}>
                  {t.is_active ? "有効" : "無効"}
                </Badge>
                {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </button>

            {/* Editor */}
            {isOpen && (
              <div className="border-t border-border p-5 space-y-5">
                {t.description && (
                  <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground whitespace-pre-line">{t.description}</div>
                )}

                {/* Active toggle */}
                <div className="flex items-center gap-3">
                  <Label className="text-sm">メール配信</Label>
                  <button
                    onClick={() => updateField(t.id, "is_active", !t.is_active)}
                    className="flex items-center gap-1.5 text-sm"
                  >
                    {t.is_active
                      ? <ToggleRight className="w-6 h-6 text-brand-green" />
                      : <ToggleLeft className="w-6 h-6 text-muted-foreground" />}
                    <span className={t.is_active ? "text-brand-green font-medium" : "text-muted-foreground"}>
                      {t.is_active ? "有効" : "無効"}
                    </span>
                  </button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`name-${t.id}`}>テンプレート名</Label>
                  <Input
                    id={`name-${t.id}`}
                    value={t.name}
                    onChange={(e) => updateField(t.id, "name", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`subject-${t.id}`}>件名</Label>
                  <Input
                    id={`subject-${t.id}`}
                    value={t.subject}
                    onChange={(e) => updateField(t.id, "subject", e.target.value)}
                    placeholder="メールの件名"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`body-${t.id}`}>本文</Label>
                  <p className="text-xs text-muted-foreground">{`{{変数名}} の形式でテンプレート変数を使用できます`}</p>
                  <Textarea
                    id={`body-${t.id}`}
                    value={t.body}
                    onChange={(e) => updateField(t.id, "body", e.target.value)}
                    rows={14}
                    className="font-mono text-xs leading-relaxed"
                    placeholder="メール本文を入力..."
                  />
                </div>

                {/* Preview box */}
                <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-2">
                  <p className="text-xs font-bold text-foreground">プレビュー</p>
                  <p className="text-xs text-muted-foreground">件名: <span className="text-foreground">{t.subject}</span></p>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed font-sans mt-2 max-h-48 overflow-y-auto">{t.body}</pre>
                </div>

                <Button
                  onClick={() => handleSave(t)}
                  disabled={isPending}
                  className="bg-brand-green hover:bg-brand-green/90 text-white gap-2"
                >
                  {saved === t.id ? (
                    <><Check className="w-4 h-4" />保存しました</>
                  ) : (
                    <><Save className="w-4 h-4" />{isPending ? "保存中..." : "変更を保存"}</>
                  )}
                </Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
