"use client"

import Link from "next/link"
import Image from "next/image"
import { Suspense } from "react"
import { ArrowLeft } from "lucide-react"
import { useLanguage } from "@/components/LanguageProvider"
import { formatYen } from "@/lib/utils"
import CheckoutForm from "@/components/checkout/CheckoutForm"
import type { Campaign, RewardTier } from "@/lib/db"

type Props =
  | { type: "no_campaign" }
  | {
      type: "checkout"
      campaign: Campaign
      reward: RewardTier | null
      isCustom: boolean
      defaultAmount: number | null
    }

export default function CheckoutPageClient(props: Props) {
  const { t, lang } = useLanguage()

  if (props.type === "no_campaign") {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">{t("noCampaign")}</p>
      </div>
    )
  }

  const { campaign, reward, isCustom, defaultAmount } = props
  const c = campaign as any
  const campaignTitle =
    lang === "en" && c.title_en ? c.title_en :
    lang === "ko" && c.title_ko ? c.title_ko :
    lang === "zh" && c.title_zh ? c.title_zh :
    campaign.title
  const r = reward as any
  const rewardTitle = reward
    ? (lang === "en" && r.title_en ? r.title_en :
       lang === "ko" && r.title_ko ? r.title_ko :
       lang === "zh" && r.title_zh ? r.title_zh :
       reward.title)
    : null

  return (
    <>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("backToProject")}
      </Link>

      <h1 className="text-2xl font-black text-foreground mb-6">{t("checkoutPageTitle")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Order summary */}
        <div className="md:col-span-2">
          <div className="bg-card rounded-2xl border border-border p-5 sticky top-4">
            <h2 className="font-bold text-foreground mb-4 text-sm">{t("checkoutSummaryTitle")}</h2>
            <div className="relative h-32 w-full rounded-xl overflow-hidden mb-4">
              <Image
                src={reward?.image_url ?? "/images/hero-festival.jpg"}
                alt={rewardTitle ?? campaignTitle}
                fill
                className="object-cover"
                priority
                loading="eager"
              />
            </div>
            <p className="font-bold text-foreground text-sm mb-1">{campaignTitle}</p>
            {reward ? (
              <>
                <p className="text-xs text-muted-foreground mb-3">{rewardTitle}</p>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("checkoutAmountLabel")}</span>
                    <span className="font-black text-brand-green text-lg">{formatYen(reward.amount)}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-3">{t("cheerSupportLabel")}</p>
                {defaultAmount && (
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("checkoutAmountLabel")}</span>
                      <span className="font-black text-brand-green text-lg">{formatYen(defaultAmount)}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Checkout form */}
        <div className="md:col-span-3">
          <Suspense fallback={<div className="bg-card rounded-2xl border border-border p-6 animate-pulse h-64" />}>
            <CheckoutForm
              campaign={campaign}
              reward={reward}
              rewardTitle={rewardTitle}
              isCustom={isCustom}
              defaultAmount={defaultAmount}
            />
          </Suspense>
        </div>
      </div>
    </>
  )
}
