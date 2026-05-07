"use client"

import Link from "next/link"
import { CheckCircle2, Leaf } from "lucide-react"
import { useLanguage } from "@/components/LanguageProvider"
import { useSiteSettings } from "@/components/SiteSettingsProvider"
import ShopSuccessShippingForm from "@/components/checkout/ShopSuccessShippingForm"

interface Props {
  order: {
    orderId: number
    productName: string
    requiresShipping: boolean
    shippingAlreadySaved: boolean
  } | null
}

export default function ShopSuccessPageClient({ order }: Props) {
  const { t } = useLanguage()
  const { siteTitle } = useSiteSettings()
  const title = siteTitle || "クラウドファンディング"

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-brand-green" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-7 h-7 bg-brand-gold rounded-lg flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5 text-brand-dark" />
            </div>
            <span className="font-black text-foreground text-sm">{title} Shop</span>
          </div>
          <h1 className="text-2xl font-black text-foreground mb-3">{t("shopSuccessTitle")}</h1>
          {order && (
            <p className="text-sm text-muted-foreground">
              <span className="font-bold text-foreground">{order.productName}</span>{" "}
              {t("shopSuccessDesc")}
            </p>
          )}
        </div>

        {order && order.requiresShipping && !order.shippingAlreadySaved && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <ShopSuccessShippingForm orderId={order.orderId} />
          </div>
        )}

        {order && order.requiresShipping && order.shippingAlreadySaved && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="font-bold text-green-800 text-sm">{t("shippingAlreadySaved")}</p>
            <p className="text-xs text-green-700 mt-1">{t("shippingAlreadySavedNote")}</p>
          </div>
        )}

        {(!order || !order.requiresShipping) && (
          <p className="text-muted-foreground text-sm leading-relaxed text-center mb-8">
            {t("successEmailNote")}
          </p>
        )}

        <div className="flex flex-col gap-3 mt-6">
          <Link
            href="/shop"
            className="w-full bg-brand-green text-white font-bold py-3 rounded-xl text-sm hover:bg-brand-green/90 transition-colors text-center"
          >
            {t("backToShopBtn")}
          </Link>
          <Link
            href="/"
            className="w-full bg-card border border-border text-foreground font-bold py-3 rounded-xl text-sm hover:bg-muted transition-colors text-center"
          >
            {t("toCampaignPage")}
          </Link>
        </div>
      </div>
    </div>
  )
}
