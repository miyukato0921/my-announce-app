"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Save, Check, ExternalLink } from "lucide-react"
import Link from "next/link"

interface Props {
  tokushoContent: string
  termsContent: string
  privacyContent: string
  systemContent: string
}

type Tab = "tokusho" | "terms" | "privacy" | "system"

const tabs: { key: Tab; label: string; previewUrl: string }[] = [
  { key: "tokusho", label: "特定商取引法", previewUrl: "/legal/tokusho" },
  { key: "terms", label: "利用規約", previewUrl: "/legal/terms" },
  { key: "privacy", label: "プライバシーポリシー", previewUrl: "/legal/privacy" },
  { key: "system", label: "システム提供・決済代行", previewUrl: "/legal/system" },
]

export default function LegalPagesEditor({ tokushoContent, termsContent, privacyContent, systemContent }: Props) {
  const [tokusho, setTokusho] = useState(tokushoContent)
  const [terms, setTerms] = useState(termsContent)
  const [privacy, setPrivacy] = useState(privacyContent)
  const [system, setSystem] = useState(systemContent)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState<Tab>("tokusho")

  const handleSave = () => {
    startTransition(async () => {
      await fetch("/api/admin/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legal_tokusho: tokusho,
          legal_terms: terms,
          legal_privacy: privacy,
          legal_system: system,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  const currentTab = tabs.find((t) => t.key === tab)!

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit flex-wrap">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              tab === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-foreground">{currentTab.label}</h2>
          <Link
            href={currentTab.previewUrl}
            target="_blank"
            className="text-xs text-brand-green flex items-center gap-1 hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            プレビュー
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          空欄の場合はデフォルトの内容が表示されます。編集して保存すると、編集内容が優先されます。
        </p>

        <textarea
          value={tab === "tokusho" ? tokusho : tab === "terms" ? terms : tab === "privacy" ? privacy : system}
          onChange={(e) => {
            const val = e.target.value
            if (tab === "tokusho") setTokusho(val)
            else if (tab === "terms") setTerms(val)
            else if (tab === "privacy") setPrivacy(val)
            else setSystem(val)
          }}
          className="w-full h-96 p-4 border border-border rounded-xl font-mono text-sm bg-background text-foreground"
          placeholder="HTML形式で入力してください..."
        />
      </div>

      <Button
        onClick={handleSave}
        disabled={isPending}
        className="bg-brand-green hover:bg-brand-green/90 text-white gap-2"
      >
        {saved ? (
          <><Check className="w-4 h-4" />保存しました</>
        ) : (
          <><Save className="w-4 h-4" />{isPending ? "保存中..." : "保存する"}</>
        )}
      </Button>
    </div>
  )
}
