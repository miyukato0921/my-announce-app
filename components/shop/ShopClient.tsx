"use client"

import Image from "next/image"
import Link from "next/link"
import { ShoppingCart, ArrowLeft, Leaf } from "lucide-react"
import { formatYen } from "@/lib/utils"
import { useLanguage } from "@/components/LanguageProvider"
import { useSiteSettings } from "@/components/SiteSettingsProvider"
import LanguageSwitcher from "@/components/LanguageSwitcher"

interface Product {
  id: number
  name: string
  description: string | null
  price: number
  image_url: string | null
  stock_count: number | null
  name_en?: string; name_ko?: string; name_zh?: string
  description_en?: string; description_ko?: string; description_zh?: string
}

interface Props {
  products: Product[]
}

export default function ShopClient({ products }: Props) {
  const { t, lang } = useLanguage()
  const { logoUrl, siteTitle } = useSiteSettings()
  const title = siteTitle || "クラウドファンディング"

  const localize = (p: Product) => ({
    name: (lang !== "ja" && (p as any)[`name_${lang}`]) || p.name,
    description: (lang !== "ja" && (p as any)[`description_${lang}`]) || p.description,
  })

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-brand-dark border-b border-brand-green/20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <Image src={logoUrl} alt={title} width={32} height={32} className="rounded-lg object-cover" unoptimized />
            ) : (
              <div className="w-8 h-8 bg-brand-gold rounded-lg flex items-center justify-center shrink-0">
                <Leaf className="w-4 h-4 text-brand-dark" />
              </div>
            )}
            <div>
              <p className="font-black text-white text-sm leading-none">{title}</p>
              <p className="text-brand-gold text-xs">Official Shop</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/" className="hidden sm:flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {t("backToCampaign")}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <p className="text-brand-green text-xs font-bold uppercase tracking-widest mb-2">Official Shop</p>
          <h1 className="text-3xl font-black text-foreground text-balance">{t("shopTitle")}</h1>
          <p className="text-muted-foreground text-sm mt-3">{t("shopDesc")}</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-2xl border border-border">
            <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-bold text-foreground">{t("noProducts")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => {
              const lp = localize(product)
              return (
              <div key={product.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
                <div className="relative w-full aspect-square bg-muted">
                  {product.image_url ? (
                    <Image src={product.image_url} alt={lp.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingCart className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                  {product.stock_count !== null && product.stock_count <= 5 && product.stock_count > 0 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {t("remaining2", { n: product.stock_count })}
                    </div>
                  )}
                  {product.stock_count === 0 && (
                    <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                      <span className="bg-muted-foreground text-white text-sm font-bold px-4 py-1.5 rounded-full">{t("outOfStock")}</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-bold text-sm text-foreground line-clamp-2 leading-tight">{lp.name}</p>
                  {lp.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{lp.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="font-black text-brand-green">{formatYen(product.price)}</p>
                      <p className="text-xs text-muted-foreground">{t("tax")}</p>
                    </div>
                    {product.stock_count !== 0 && (
                      <Link
                        href={`/shop/checkout?product_id=${product.id}`}
                        className="text-xs bg-brand-green text-white font-bold px-3 py-1.5 rounded-lg hover:bg-brand-green/90 transition-colors"
                      >
                        {t("buyNow")}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-16 py-8 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} {title}. All rights reserved.</p>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link href="/" className="text-brand-green hover:underline inline-block">
            {t("backToCampaign")}
          </Link>
          <Link href="mailto:m.kato@iris-corp.co.jp" className="text-brand-green hover:underline inline-block">
            お問い合わせ
          </Link>
        </div>
      </footer>
    </div>
  )
}
