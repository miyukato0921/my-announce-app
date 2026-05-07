"use client"

import Link from "next/link"
import Image from "next/image"
import { Suspense } from "react"
import { ArrowLeft, Leaf } from "lucide-react"
import { useLanguage } from "@/components/LanguageProvider"
import { useSiteSettings } from "@/components/SiteSettingsProvider"
import { formatYen } from "@/lib/utils"
import ShopCheckoutForm from "@/components/checkout/ShopCheckoutForm"

interface Product {
  id: number
  name: string
  price: number
  description?: string
  image_url?: string
  name_en?: string; name_ko?: string; name_zh?: string
  description_en?: string; description_ko?: string; description_zh?: string
}

type Props =
  | { type: "no_product"; reason: "not_found" | "not_specified" }
  | { type: "checkout"; product: Product }

export default function ShopCheckoutPageClient(props: Props) {
  const { t, lang } = useLanguage()
  const { logoUrl, siteTitle } = useSiteSettings()
  const title = siteTitle || "クラウドファンディング"

  if (props.type === "no_product") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            {props.reason === "not_found" ? t("noProduct") : t("noProductSpecified")}
          </p>
          <Link href="/shop" className="text-brand-green hover:underline text-sm">{t("backToShopLink")}</Link>
        </div>
      </div>
    )
  }

  const { product } = props
  const productName = (lang !== "ja" && (product as any)[`name_${lang}`]) || product.name
  const productDesc = (lang !== "ja" && (product as any)[`description_${lang}`]) || product.description

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-brand-dark border-b border-brand-green/20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          {logoUrl ? (
            <Image src={logoUrl} alt={title} width={32} height={32} className="rounded-lg object-cover" unoptimized />
          ) : (
            <div className="w-8 h-8 bg-brand-gold rounded-lg flex items-center justify-center shrink-0">
              <Leaf className="w-4 h-4 text-brand-dark" />
            </div>
          )}
          <div>
            <p className="font-black text-white text-sm leading-none">{title}</p>
            <p className="text-brand-gold text-xs">{t("officialShop")}</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("backToShopLink")}
        </Link>

        <h1 className="text-2xl font-black text-foreground mb-6">{t("shopCheckoutTitle")}</h1>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="md:col-span-2">
            <div className="bg-card rounded-2xl border border-border p-5 sticky top-4">
              <h2 className="font-bold text-foreground mb-4 text-sm">{t("shopOrderSummary")}</h2>
              <div className="relative h-40 w-full rounded-xl overflow-hidden mb-4 bg-muted">
                {product.image_url ? (
                  <Image src={product.image_url} alt={productName} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">{t("noImageText")}</div>
                )}
              </div>
              <p className="font-bold text-foreground text-sm mb-1">{productName}</p>
              {productDesc && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-3">{productDesc}</p>
              )}
              <div className="border-t border-border pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("shopPriceLabel")}</span>
                  <span className="font-black text-brand-green text-lg">{formatYen(product.price)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-3">
            <Suspense fallback={<div className="bg-card rounded-2xl border border-border p-6 animate-pulse h-64" />}>
              <ShopCheckoutForm product={product} />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}
