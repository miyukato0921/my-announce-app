"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreditCard, Loader2, Lock } from "lucide-react"
import { formatYen } from "@/lib/utils"
import { useLanguage } from "@/components/LanguageProvider"

interface Product {
  id: number
  name: string
  price: number
  description?: string
  image_url?: string
}

export default function ShopCheckoutForm({ product }: { product: Product }) {
  const { t } = useLanguage()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { setError(t("emailAddress") + "を入力してください。"); return }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          buyer_name: name,
          buyer_email: email,
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
    <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 space-y-5">
      <h2 className="font-bold text-foreground">{t("buyerInfo")}</h2>

      <div className="p-4 bg-brand-green/10 rounded-xl border border-brand-green/20">
        <p className="text-sm text-muted-foreground">{t("shopPurchaseItem")}</p>
        <p className="font-bold text-foreground">{product.name}</p>
        <p className="text-2xl font-black text-brand-green mt-1">{formatYen(product.price)}</p>
      </div>

      <div>
        <Label htmlFor="email" className="text-sm font-medium">
          {t("emailAddress")} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="mt-1"
        />
        <p className="text-xs text-muted-foreground mt-1">{t("purchaseEmailNote")}</p>
      </div>

      <div>
        <Label htmlFor="name" className="text-sm font-medium">{t("yourName")}</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("yourNamePlaceholder")}
          className="mt-1"
        />
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="pt-2">
        <Button
          type="submit"
          className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-black text-lg py-6 rounded-xl"
          disabled={loading}
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{t("processing")}</>
          ) : (
            <><CreditCard className="w-5 h-5 mr-2" />{t("proceed")} — {formatYen(product.price)}</>
          )}
        </Button>
        <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-muted-foreground">
          <Lock className="w-3 h-3" />
          <span>{t("securePayment")}</span>
        </div>
      </div>
    </form>
  )
}
