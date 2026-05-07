"use client"

import Image from "next/image"
import type { RewardTier } from "@/lib/db"
import { formatYen } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Calendar, Users, ChevronRight, Clock, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/LanguageProvider"
import type { Language } from "@/lib/i18n"

interface Props {
  rewards: RewardTier[]
  campaignId: number
}

function getSpecialNote(title: string, t: (k: any) => string): string | null {
  if (title.includes("一緒に") || title.includes("ステージ") || title.toLowerCase().includes("stage")) {
    return t("stageDeadline")
  }
  if (title.includes("打ち上げ") || title.includes("パーティー") || title.toLowerCase().includes("party")) {
    return t("partyLimit")
  }
  return null
}

function getTierStyle(amount: number, t: (k: any) => string) {
  if (amount >= 20000) return {
    bg: "bg-brand-gold/8", border: "border-brand-gold/50",
    badge: "bg-brand-gold text-brand-dark", btn: "bg-brand-gold hover:bg-brand-gold/90 text-brand-dark",
    label: t("premium"),
  }
  if (amount >= 10000) return {
    bg: "bg-brand-green/8", border: "border-brand-green/40",
    badge: "bg-brand-green text-white", btn: "bg-brand-green hover:bg-brand-green/90 text-white",
    label: t("standard"),
  }
  if (amount >= 5000) return {
    bg: "bg-primary/5", border: "border-primary/30",
    badge: "bg-primary/80 text-white", btn: "bg-primary/80 hover:bg-primary text-white",
    label: t("supporter"),
  }
  return {
    bg: "bg-muted/60", border: "border-border",
    badge: "bg-muted-foreground/60 text-white", btn: "bg-muted-foreground/70 hover:bg-muted-foreground text-white",
    label: t("entry"),
  }
}

function getLocalizedReward(reward: any, lang: Language) {
  const titleKey = lang === "en" ? "title_en" : lang === "ko" ? "title_ko" : lang === "zh" ? "title_zh" : null
  const descKey = lang === "en" ? "description_en" : lang === "ko" ? "description_ko" : lang === "zh" ? "description_zh" : null
  return {
    title: (titleKey && reward[titleKey]) ? reward[titleKey] : reward.title,
    description: (descKey && reward[descKey]) ? reward[descKey] : reward.description,
  }
}

export default function RewardTiers({ rewards, campaignId }: Props) {
  const router = useRouter()
  const { t, lang } = useLanguage()

  const handleSupport = (rewardId: number, amount: number) => {
    router.push(`/checkout?campaign_id=${campaignId}&reward_id=${rewardId}&amount=${amount}`)
  }

  return (
    <div className="space-y-3">
      <h2 className="text-base sm:text-lg font-bold text-foreground">{t("chooseReturn")}</h2>

      <div className="grid grid-cols-1 gap-3">
        {rewards.map((reward) => {
          const style = getTierStyle(reward.amount, t)
          const isSoldOut = reward.limit_count !== null && reward.claimed_count >= reward.limit_count
          const remaining = reward.limit_count !== null ? reward.limit_count - reward.claimed_count : null
          const localized = getLocalizedReward(reward, lang)
          const specialNote = getSpecialNote(reward.title, t)

          return (
            <div key={reward.id} className={`rounded-xl sm:rounded-2xl border-2 p-3 sm:p-4 transition-all duration-200 ${style.bg} ${style.border} ${isSoldOut ? "opacity-60" : "hover:shadow-md active:scale-95 sm:hover:shadow-lg"}`}>
              {reward.image_url && (
                <div className="relative h-32 sm:h-40 w-full rounded-lg overflow-hidden mb-3">
                  <Image src={reward.image_url} alt={localized.title} fill className="object-cover" />
                </div>
              )}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1 mb-2">
                    <Badge className={`text-[10px] sm:text-xs border-0 ${style.badge}`}>{style.label}</Badge>
                    {isSoldOut && <Badge variant="secondary" className="text-[10px] sm:text-xs">{t("soldOut")}</Badge>}
                    {!isSoldOut && remaining !== null && remaining <= 10 && (
                      <Badge className="text-[10px] sm:text-xs bg-red-500 text-white border-0">
                        {t("remainingSlots", { n: remaining })}
                      </Badge>
                    )}
                  </div>
                  <p className="text-lg sm:text-xl font-black text-foreground">{formatYen(reward.amount)}</p>
                </div>
              </div>
              <p className="font-bold text-foreground text-xs sm:text-sm mb-1.5">{localized.title}</p>
              <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed mb-3 whitespace-pre-wrap">{localized.description}</p>
              <div className="flex flex-wrap gap-2 mb-3 text-[10px] sm:text-xs text-muted-foreground">
                {reward.delivery_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 shrink-0" />
                    <span className="truncate">{t("delivery")}{reward.delivery_date}</span>
                  </div>
                )}
                {remaining !== null && !isSoldOut && (
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 shrink-0" />
                    <span className="truncate">{t("remainingSlots", { n: remaining })}（{t("capacity", { n: reward.limit_count! })}）</span>
                  </div>
                )}
                {reward.claimed_count > 0 && (
                  <div className="flex items-center gap-1 text-brand-green">
                    <CheckCircle className="w-3 h-3 shrink-0" />
                    <span className="truncate">{t("supporting", { n: reward.claimed_count })}</span>
                  </div>
                )}
              </div>
              {specialNote && !isSoldOut && (
                <div className="flex items-start gap-2 mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <Clock className="w-3 h-3 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-[10px] sm:text-xs text-amber-700 font-medium">{specialNote}</p>
                </div>
              )}
              <Button
                className={`w-full font-bold rounded-lg sm:rounded-xl text-xs sm:text-base py-2 sm:py-2.5 ${style.btn}`}
                disabled={isSoldOut}
                onClick={() => handleSupport(reward.id, reward.amount)}
              >
                {isSoldOut ? t("soldOut") : t("supportWithThis")}
                {!isSoldOut && <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />}
              </Button>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl sm:rounded-2xl border-2 border-dashed border-brand-green/40 p-3 sm:p-4 bg-brand-green/5 mt-2">
        <div className="flex items-start gap-2 mb-2.5">
          <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-green mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="font-bold text-foreground text-xs sm:text-sm">{t("freeSupport")}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{t("freeSupportDesc")}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full border-brand-green text-brand-green hover:bg-brand-green hover:text-white font-bold rounded-lg sm:rounded-xl text-xs sm:text-base py-2 sm:py-2.5"
          onClick={() => router.push(`/checkout?campaign_id=${campaignId}&custom=true`)}
        >
          {t("cheerSupport")}
        </Button>
      </div>
    </div>
  )
}
