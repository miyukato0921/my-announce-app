"use client"

import Link from "next/link"
import Image from "next/image"
import { Leaf } from "lucide-react"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import { useLanguage } from "@/components/LanguageProvider"
import { useSiteSettings } from "@/components/SiteSettingsProvider"

export default function CampaignHeader() {
  const { t } = useLanguage()
  const { logoUrl, siteTitle } = useSiteSettings()
  const title = siteTitle || "クラウドファンディング"

  return (
    <header className="bg-brand-dark text-white py-2 px-3 sm:px-4 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2 min-w-0 hover:opacity-80 transition-opacity">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={title}
              width={36}
              height={36}
              className="rounded-full object-cover shrink-0 w-7 h-7 sm:w-9 sm:h-9"
              unoptimized
            />
          ) : (
            <div className="w-7 h-7 sm:w-9 sm:h-9 bg-brand-gold rounded-full flex items-center justify-center shrink-0">
              <Leaf className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-dark" />
            </div>
          )}
          <span className="font-bold text-xs sm:text-base tracking-tight truncate">{title}</span>
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-white/60 text-sm hidden sm:block">{t("crowdfunding")}</span>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  )
}
