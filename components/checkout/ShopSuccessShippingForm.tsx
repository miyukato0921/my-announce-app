"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Truck, Loader2, MapPin, Search } from "lucide-react"
import { usePostalCode } from "@/hooks/use-postal-code"
import { useLanguage } from "@/components/LanguageProvider"

interface Props {
  orderId: number
  onComplete?: () => void
}

export default function ShopSuccessShippingForm({ orderId, onComplete }: Props) {
  const { t } = useLanguage()
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [name, setName] = useState("")
  const [postal, setPostal] = useState("")
  const [prefecture, setPrefecture] = useState("")
  const [city, setCity] = useState("")
  const [town, setTown] = useState("")
  const [building, setBuilding] = useState("")
  const [phone, setPhone] = useState("")

  const { lookupPostal, isLooking, lookupError } = usePostalCode((result) => {
    setPrefecture(result.prefecture)
    setCity(result.city)
    setTown(result.town)
  })

  const handlePostalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9-]/g, "")
    setPostal(val)
    const digits = val.replace(/-/g, "")
    if (digits.length === 7) lookupPostal(val)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const fullAddress = `${prefecture}${city}${town}${building ? " " + building : ""}`
    try {
      const res = await fetch(`/api/shop/orders/${orderId}/shipping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipping_name: name,
          shipping_postal_code: postal,
          shipping_address: fullAddress,
          shipping_phone: phone,
        }),
      })
      if (!res.ok) throw new Error("error")
      setSubmitted(true)
      onComplete?.()
    } catch {
      setError("送信に失敗しました。もう一度お試しください。")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="w-14 h-14 rounded-full bg-brand-green/10 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-brand-green" />
        </div>
        <p className="font-bold text-foreground">{t("saved")}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Truck className="w-5 h-5 text-brand-green shrink-0" />
        <span className="font-bold text-sm">{t("shippingTitle")}</span>
      </div>
      <p className="text-xs text-muted-foreground">{t("shippingDesc")}</p>

      <div>
        <Label className="text-xs font-bold">{t("recipientName")} <span className="text-destructive">*</span></Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder={t("recipientNamePlaceholder")} className="mt-1 rounded-xl" required />
      </div>

      <div>
        <Label className="text-xs font-bold">{t("postalCode")} <span className="text-destructive">*</span></Label>
        <div className="relative mt-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          {isLooking
            ? <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
            : <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          }
          <Input value={postal} onChange={handlePostalChange} placeholder={t("postalCodePlaceholder")} className="pl-9 pr-9 rounded-xl" maxLength={8} required />
        </div>
        {lookupError && <p className="text-xs text-destructive mt-1">{lookupError}</p>}
      </div>

      <div>
        <Label className="text-xs font-bold">{t("prefecture")} <span className="text-destructive">*</span></Label>
        <Input value={prefecture} onChange={e => setPrefecture(e.target.value)} placeholder="東京都" className="mt-1 rounded-xl" required />
      </div>

      <div>
        <Label className="text-xs font-bold">{t("city")} <span className="text-destructive">*</span></Label>
        <Input value={city} onChange={e => setCity(e.target.value)} placeholder="渋谷区" className="mt-1 rounded-xl" required />
      </div>

      <div>
        <Label className="text-xs font-bold">{t("address")} <span className="text-destructive">*</span></Label>
        <Input value={town} onChange={e => setTown(e.target.value)} placeholder="道玄坂1丁目" className="mt-1 rounded-xl" required />
      </div>

      <div>
        <Label className="text-xs font-bold">{t("building")}</Label>
        <Input value={building} onChange={e => setBuilding(e.target.value)} placeholder={t("buildingPlaceholder")} className="mt-1 rounded-xl" />
      </div>

      <div>
        <Label className="text-xs font-bold">{t("phone")} <span className="text-destructive">*</span></Label>
        <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder={t("phonePlaceholder")} required className="mt-1 rounded-xl" />
      </div>

      {error && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-bold rounded-xl">
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{t("saving")}</>
          : <><Truck className="w-4 h-4 mr-2" />{t("saveAddress")}</>
        }
      </Button>
    </form>
  )
}
