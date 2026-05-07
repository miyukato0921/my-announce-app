"use client"

import { useEffect, useState } from "react"
import type { Campaign } from "@/lib/db"
import { calcProgress, calcDaysLeft, formatYen } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Users, Clock, TrendingUp, Target } from "lucide-react"
import { useLanguage } from "@/components/LanguageProvider"

interface Props {
  campaign: Campaign
}

export default function FundingProgress({ campaign }: Props) {
  const { t, locale } = useLanguage()
  const [current, setCurrent] = useState(campaign.current_amount)
  const [supporters, setSupporters] = useState(campaign.supporter_count)
  const [animated, setAnimated] = useState(false)

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/stats`, { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setCurrent(Number(data.current_amount))
        setSupporters(Number(data.supporter_count))
      }
    } catch {}
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 5000)
    setTimeout(() => setAnimated(true), 100)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign.id])

  const progress = calcProgress(current, campaign.goal_amount)
  const daysLeft = calcDaysLeft(campaign.end_date)
  const remaining = campaign.goal_amount - current

  const formatCurrency = (n: number) =>
    locale === "ja" ? formatYen(n) : `¥${n.toLocaleString()}`

  return (
    <div className="bg-card rounded-2xl border border-border p-6 mb-6">
      <div className="mb-4">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-4xl font-black text-brand-green tabular-nums">
            {formatCurrency(current)}
          </span>
          <span className="text-muted-foreground text-sm">
            {t("goal")} {formatCurrency(campaign.goal_amount)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <Target className="w-3.5 h-3.5 text-brand-gold" />
          <span className="text-sm text-muted-foreground">
            {t("remaining")} <span className="font-bold text-foreground">{formatCurrency(remaining)}</span> {t("toGoal")}
          </span>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span className="font-bold text-brand-green">{progress}% {t("achievementRate")}</span>
          <span>{formatCurrency(campaign.goal_amount)}</span>
        </div>
        <div className="h-4 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: animated ? `${progress}%` : "0%",
              background: "linear-gradient(90deg, oklch(0.42 0.15 152), oklch(0.55 0.16 152))",
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-4 h-4 text-brand-green" />
            <span className="text-2xl font-black text-foreground tabular-nums">{progress}%</span>
          </div>
          <p className="text-xs text-muted-foreground">{t("achievementRate")}</p>
        </div>
        <div className="text-center border-x border-border">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="w-4 h-4 text-brand-gold" />
            <span className="text-2xl font-black text-foreground tabular-nums">{supporters}</span>
          </div>
          <p className="text-xs text-muted-foreground">{t("supporters")}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="w-4 h-4 text-brand-green" />
            <span className="text-2xl font-black text-foreground tabular-nums">{daysLeft}</span>
          </div>
          <p className="text-xs text-muted-foreground">{t("daysLeft")}</p>
        </div>
      </div>
    </div>
  )
}
