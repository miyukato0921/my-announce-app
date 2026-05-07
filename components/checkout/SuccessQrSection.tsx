"use client"

import { useState, useEffect } from "react"
import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  qrUrl?: string
  qrLabel?: string
  linkUrl?: string
  linkLabel?: string
  redirectSeconds?: number
  paused?: boolean
  message?: string
}

export default function SuccessQrSection({ qrUrl, qrLabel, linkUrl, linkLabel, redirectSeconds, paused, message }: Props) {
  const [countdown, setCountdown] = useState(redirectSeconds ?? 0)
  const [redirected, setRedirected] = useState(false)

  // paused が解除されたらカウントダウンをリセットして開始
  useEffect(() => {
    if (!paused && redirectSeconds && redirectSeconds > 0 && !redirected) {
      setCountdown(redirectSeconds)
    }
  }, [paused, redirectSeconds, redirected])

  useEffect(() => {
    if (!redirectSeconds || redirectSeconds <= 0 || !qrUrl || redirected || paused) return

    if (countdown <= 0) {
      setRedirected(true)
      window.location.href = qrUrl
      return
    }

    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, redirectSeconds, qrUrl, redirected, paused])

  if (!qrUrl && !linkUrl) return null

  return (
    <div className="bg-card rounded-2xl border border-border p-6 mb-6 text-center space-y-4">
      {qrUrl && (
        <div className="space-y-3">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrUrl)}`}
            alt="QR Code"
            className="mx-auto rounded-xl"
            width={180}
            height={180}
          />
          {message && (
            <p className="text-xs font-medium text-muted-foreground italic">{message}</p>
          )}
          {qrLabel && (
            <p className="font-bold text-sm text-foreground">{qrLabel}</p>
          )}
          <a
            href={qrUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-brand-green hover:underline"
          >
            {qrUrl.length > 40 ? qrUrl.slice(0, 40) + "..." : qrUrl}
            <ExternalLink className="w-3 h-3" />
          </a>
          {redirectSeconds && redirectSeconds > 0 && !redirected && (
            <p className="text-xs text-muted-foreground">
              {paused
                ? "配送先の入力完了後にリダイレクトします"
                : countdown > 0
                  ? `${countdown}秒後に自動的に移動します...`
                  : "リダイレクト中..."}
            </p>
          )}
        </div>
      )}

      {linkUrl && (
        <Button
          className="w-full bg-brand-gold hover:bg-brand-gold/90 text-brand-dark font-bold rounded-xl"
          asChild
        >
          <a href={linkUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            {linkLabel || linkUrl}
          </a>
        </Button>
      )}
    </div>
  )
}
