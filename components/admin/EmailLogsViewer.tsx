"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Mail, AlertTriangle, CheckCircle, SkipForward, ChevronDown, ChevronUp } from "lucide-react"

interface EmailLog {
  id: number
  template_slug: string
  to_address: string
  subject: string
  body: string
  status: "sent" | "failed" | "skipped"
  error_message: string | null
  created_at: string
}

export default function EmailLogsViewer() {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/email-logs")
      if (res.ok) setLogs(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs() }, [])

  const statusConfig = {
    sent: { label: "送信済み", variant: "default" as const, icon: CheckCircle, color: "text-brand-green" },
    failed: { label: "失敗", variant: "destructive" as const, icon: AlertTriangle, color: "text-red-500" },
    skipped: { label: "スキップ", variant: "secondary" as const, icon: SkipForward, color: "text-muted-foreground" },
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          直近100件の配信履歴を表示しています
        </p>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading} className="gap-2">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          更新
        </Button>
      </div>

      {logs.length === 0 && !loading && (
        <div className="text-center py-16 text-muted-foreground">
          <Mail className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-bold">配信履歴がありません</p>
          <p className="text-xs mt-1">メールが送信されると、ここに履歴が表示されます。</p>
        </div>
      )}

      {logs.length > 0 && (
        <div className="border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {logs.map((log) => {
            const cfg = statusConfig[log.status]
            const StatusIcon = cfg.icon
            const isExpanded = expandedId === log.id

            return (
              <div key={log.id} className="bg-card">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <StatusIcon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-foreground truncate">{log.subject || "(件名なし)"}</span>
                      <Badge variant={cfg.variant} className="text-[10px] px-1.5 py-0">
                        {cfg.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span>{log.to_address}</span>
                      <span>{formatDate(log.created_at)}</span>
                      <span className="font-mono">{log.template_slug}</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border bg-muted/30">
                    {log.error_message && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
                        <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-1">エラー詳細</p>
                        <p className="text-xs text-red-600 dark:text-red-300 font-mono break-all">{log.error_message}</p>
                      </div>
                    )}
                    {log.body && (
                      <div className="mt-3">
                        <p className="text-xs font-bold text-foreground mb-1">本文</p>
                        <pre className="text-xs text-muted-foreground bg-muted p-3 rounded-xl whitespace-pre-wrap break-all max-h-48 overflow-y-auto font-mono">
                          {log.body}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
