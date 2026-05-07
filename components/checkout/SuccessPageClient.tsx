"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { CheckCircle, Heart, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/LanguageProvider"
import SuccessQrSection from "@/components/checkout/SuccessQrSection"

interface Props {
  campaignTitle: string
  qrUrl?: string
  qrLabel?: string
  linkUrl?: string
  linkLabel?: string
  redirectSeconds?: number
  needsShipping?: boolean
  message?: string
}

export default function SuccessPageClient({
  campaignTitle,
  qrUrl,
  qrLabel,
  linkUrl,
  linkLabel,
  redirectSeconds,
  needsShipping,
  message,
}: Props) {
  const { t } = useLanguage()
  const [shippingComplete, setShippingComplete] = useState(false)

  useEffect(() => {
    const handler = () => setShippingComplete(true)
    window.addEventListener("shipping-complete", handler)
    return () => window.removeEventListener("shipping-complete", handler)
  }, [])

  // 配送が必要かつまだ完了していない場合はリダイレクトを保留
  const isPaused = needsShipping && !shippingComplete

  return (
    <>
      <div className="w-20 h-20 bg-brand-green/15 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-brand-green" />
      </div>
      <h1 className="text-3xl font-black text-foreground mb-3">{t("successTitle")}</h1>
      <p className="text-muted-foreground leading-relaxed mb-2">
        {campaignTitle}の実現に近づきました。
      </p>
      <p className="text-sm text-muted-foreground mb-8">{t("successEmailNote")}</p>
      <div className="bg-brand-green/10 border border-brand-green/20 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Heart className="w-5 h-5 text-brand-gold fill-brand-gold" />
          <span className="font-bold text-foreground">{t("successShare")}</span>
        </div>
        <p className="text-sm text-muted-foreground">{t("successShareDesc")}</p>
      </div>

      <SuccessQrSection
        qrUrl={qrUrl}
        qrLabel={qrLabel}
        linkUrl={linkUrl}
        linkLabel={linkLabel}
        redirectSeconds={redirectSeconds}
        paused={isPaused}
        message={message}
      />

      <Button
        className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-bold rounded-xl"
        asChild
      >
        <Link href="/">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("backToProjectBtn")}
        </Link>
      </Button>
    </>
  )
}
