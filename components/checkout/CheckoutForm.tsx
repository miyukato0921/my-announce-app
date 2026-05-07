"use client"

import { useState } from "react"
import type { Campaign, RewardTier } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { formatYen } from "@/lib/utils"
import { CreditCard, Loader2, Lock } from "lucide-react"
import { useLanguage } from "@/components/LanguageProvider"

interface Props {
  campaign: Campaign
  reward: RewardTier | null
  rewardTitle?: string | null
  isCustom: boolean
  defaultAmount: number | null
}

const PRESET_AMOUNTS = [1000, 3000, 5000, 10000, 30000]

export default function CheckoutForm({ campaign, reward, rewardTitle, isCustom, defaultAmount }: Props) {
  const { t } = useLanguage()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [message, setMessage] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [customAmount, setCustomAmount] = useState(defaultAmount ?? 1000)
  const [customAmountDisplay, setCustomAmountDisplay] = useState(
    (defaultAmount ?? 1000).toLocaleString("ja-JP")
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const amount = reward ? reward.amount : customAmount

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 数字以外を除去
    const raw = e.target.value.replace(/[^0-9]/g, "")
    if (raw === "") {
      setCustomAmount(0)
      setCustomAmountDisplay("")
      return
    }
    const num = parseInt(raw, 10)
    setCustomAmount(num)
    setCustomAmountDisplay(num.toLocaleString("ja-JP"))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name && !isAnonymous) { setError(t("nameRequired")); return }
    if (!email) { setError(t("emailRequired")); return }
    if (!contactPhone) { setError(t("contactPhoneRequired")); return }
    if (isCustom && customAmount < 500) { setError(t("minAmount")); return }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaign.id,
          reward_tier_id: reward?.id ?? null,
          amount,
          supporter_name: isAnonymous ? null : name,
          supporter_email: email,
          supporter_phone: contactPhone,
          message: message || null,
          is_anonymous: isAnonymous,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "エラーが発生しました。")

      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました。")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-xl sm:rounded-2xl border border-border p-4 sm:p-6 space-y-4 sm:space-y-5">
      <h2 className="font-bold text-foreground text-base sm:text-lg">{t("supporterInfo")}</h2>

      {/* Custom amount selector */}
      {isCustom && (
        <div>
          <Label className="text-xs sm:text-sm font-medium text-foreground mb-2 block">{t("supportAmount")}</Label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {PRESET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => {
                  setCustomAmount(amt)
                  setCustomAmountDisplay(amt.toLocaleString("ja-JP"))
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold border transition-colors ${
                  customAmount === amt
                    ? "bg-brand-green text-white border-brand-green"
                    : "bg-background text-foreground border-border hover:border-brand-green"
                }`}
              >
                {formatYen(amt)}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground">{t("orEnterAmount")}</span>
            <div className="relative flex-1 w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">¥</span>
              <Input
                type="text"
                inputMode="numeric"
                value={customAmountDisplay}
                onChange={handleAmountChange}
                placeholder="1,000"
                className="pl-7 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {!isCustom && reward && (
        <div className="p-3 sm:p-4 bg-brand-green/10 rounded-lg sm:rounded-xl border border-brand-green/20">
          <p className="text-xs sm:text-sm text-muted-foreground">{t("selectedReturn")}</p>
          <p className="font-bold text-foreground text-sm sm:text-base">{rewardTitle ?? reward.title}</p>
          <p className="text-xl sm:text-2xl font-black text-brand-green">{formatYen(reward.amount)}</p>
        </div>
      )}

      <div>
        <Label htmlFor="email" className="text-xs sm:text-sm font-medium">
          {t("emailAddress")} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="mt-1.5 text-sm"
        />
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{t("emailNote")}</p>
      </div>

      <div>
        <Label htmlFor="contactPhone" className="text-xs sm:text-sm font-medium">
          {t("contactPhone")} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="contactPhone"
          type="tel"
          required
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          placeholder={t("contactPhonePlaceholder")}
          className="mt-1.5 text-sm"
        />
      </div>

      <div>
        <Label htmlFor="name" className="text-xs sm:text-sm font-medium">
          {t("yourName")} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          required={!isAnonymous}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("yourNamePlaceholder")}
          className="mt-1.5 text-sm"
          disabled={isAnonymous}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="anonymous"
          checked={isAnonymous}
          onCheckedChange={(v) => setIsAnonymous(!!v)}
        />
        <Label htmlFor="anonymous" className="text-xs sm:text-sm cursor-pointer">{t("anonymous2")}</Label>
      </div>

      <div>
        <Label htmlFor="message" className="text-xs sm:text-sm font-medium">{t("message")}</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("messagePlaceholder")}
          rows={2}
          className="mt-1.5 resize-none text-sm"
        />
      </div>

      {error && (
        <div className="p-2.5 sm:p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs sm:text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="pt-1 sm:pt-2 space-y-2">
        <Button
          type="submit"
          className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-black text-base sm:text-lg py-5 sm:py-6 rounded-lg sm:rounded-xl active:scale-95"
          disabled={loading}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />{t("processing")}</>
          ) : (
            <><CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />{t("proceed")}</>
          )}
        </Button>
        <div className="flex items-center justify-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
          <Lock className="w-3 h-3" />
          <span>{t("securePayment")}</span>
        </div>
      </div>
    </form>
  )
}
