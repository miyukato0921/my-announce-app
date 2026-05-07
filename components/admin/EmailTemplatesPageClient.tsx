"use client"

import { useState, useTransition, type ReactNode } from "react"
import { FileText, History, FlaskConical, CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Props {
  templateEditor: ReactNode
  logsViewer: ReactNode
}

interface TestResult {
  success: boolean
  message?: string
  error?: string
  step?: string
  credSource?: string
  smtpHost?: string
  smtpUser?: string
  emailFrom?: string
  templateStatus?: { found: boolean; slug?: string; is_active?: boolean }
}

function EmailTestPanel() {
  const [to, setTo] = useState("")
  const [result, setResult] = useState<TestResult | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleTest = () => {
    if (!to) return
    startTransition(async () => {
      setResult(null)
      const res = await fetch("/api/admin/email-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to }),
      })
      const data = await res.json()
      setResult(data)
    })
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-foreground">テスト送信</h3>
        <p className="text-xs text-muted-foreground">
          設定中の Gmail 認証情報でテストメールを送信し、メール配信が正常に動作しているか確認できます。
        </p>
        <div className="space-y-2">
          <Label htmlFor="test-to">送信先メールアドレス</Label>
          <Input
            id="test-to"
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="test@example.com"
          />
        </div>
        <Button
          onClick={handleTest}
          disabled={isPending || !to}
          className="bg-brand-green hover:bg-brand-green/90 text-white gap-2"
        >
          {isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" />送信中...</>
          ) : (
            <><FlaskConical className="w-4 h-4" />テスト送信</>
          )}
        </Button>
      </div>

      {result && (
        <div className={`rounded-2xl border p-5 space-y-3 ${
          result.success
            ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
            : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
        }`}>
          <div className="flex items-center gap-2">
            {result.success
              ? <CheckCircle className="w-5 h-5 text-brand-green" />
              : <XCircle className="w-5 h-5 text-red-500" />
            }
            <p className="font-bold text-sm">
              {result.success ? "送信成功" : "送信失敗"}
            </p>
          </div>

          {result.message && (
            <p className="text-sm text-foreground">{result.message}</p>
          )}

          {result.error && (
            <div className="space-y-1">
              <p className="text-xs font-bold text-red-700 dark:text-red-400">エラー詳細</p>
              <pre className="text-xs bg-red-100 dark:bg-red-900/40 p-3 rounded-xl font-mono break-all whitespace-pre-wrap">
                {result.error}
              </pre>
            </div>
          )}

          <div className="space-y-1.5 pt-1 border-t border-border/50">
            <p className="text-xs font-bold text-muted-foreground">診断情報</p>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <span className="text-muted-foreground">認証情報の取得元</span>
              <span className="font-mono font-bold">{result.credSource === "db" ? "DB（共通設定）" : result.credSource === "env" ? "環境変数" : "未設定"}</span>
              <span className="text-muted-foreground">SMTPホスト</span>
              <span className="font-mono">{result.smtpHost ?? "未設定"}</span>
              <span className="text-muted-foreground">SMTPユーザー</span>
              <span className="font-mono">{result.smtpUser ?? "未設定"}</span>
              <span className="text-muted-foreground">送信元アドレス</span>
              <span className="font-mono">{result.emailFrom ?? "未設定"}</span>
              {result.templateStatus && (
                <>
                  <span className="text-muted-foreground">確認メールテンプレート</span>
                  <span className="flex items-center gap-1">
                    {result.templateStatus.found
                      ? result.templateStatus.is_active
                        ? <><CheckCircle className="w-3 h-3 text-brand-green" />有効</>
                        : <><AlertTriangle className="w-3 h-3 text-amber-500" />無効（is_active = false）</>
                      : <><XCircle className="w-3 h-3 text-red-500" />テンプレート未作成</>
                    }
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {!result && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 space-y-2">
          <p className="text-xs font-bold text-amber-800 dark:text-amber-300">メール未送信の主な原因</p>
          <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 list-disc pl-4">
            <li>SMTP認証情報（ホスト・ユーザー・パスワード）が未設定または誤り</li>
            <li>SMTPサーバーが外部からの接続を許可していない</li>
            <li>送信元アドレスがSMTPサーバーで許可されていない</li>
            <li>ポート番号が正しくない（通常は 587 または 465）</li>
            <li>pledge_confirmation テンプレートが無効（is_active = false）</li>
            <li>Stripe Webhook が正しく設定されていない（Webhook未受信）</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default function EmailTemplatesPageClient({ templateEditor, logsViewer }: Props) {
  const [tab, setTab] = useState<"templates" | "logs" | "test">("templates")

  const tabs = [
    { key: "templates" as const, label: "テンプレート管理", icon: FileText },
    { key: "logs" as const, label: "配信履歴", icon: History },
    { key: "test" as const, label: "テスト送信", icon: FlaskConical },
  ]

  return (
    <div>
      <div className="flex gap-1 bg-muted p-1 rounded-xl mb-6 w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              tab === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "templates" && templateEditor}
      {tab === "logs" && logsViewer}
      {tab === "test" && <EmailTestPanel />}
    </div>
  )
}
