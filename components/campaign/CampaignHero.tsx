"use client"

import Image from "next/image"
import type { Campaign } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin } from "lucide-react"
import { useLanguage } from "@/components/LanguageProvider"

interface Props {
  campaign: Campaign
}

export default function CampaignHero({ campaign }: Props) {
  const { t, lang, mounted } = useLanguage()

  const c = campaign as any
  
  // Always use Japanese (default) for SSR, then switch after hydration
  const effectiveLang = mounted ? lang : "ja"
  
  const title =
    effectiveLang === "en" && c.title_en ? c.title_en :
    effectiveLang === "ko" && c.title_ko ? c.title_ko :
    effectiveLang === "zh" && c.title_zh ? c.title_zh :
    campaign.title

  const shortDesc =
    effectiveLang === "en" && c.short_description_en ? c.short_description_en :
    effectiveLang === "ko" && c.short_description_ko ? c.short_description_ko :
    effectiveLang === "zh" && c.short_description_zh ? c.short_description_zh :
    campaign.short_description

  const eventDate = c.event_date || t("eventDateValue")
  const eventVenue = c.event_venue || t("venueValue")

  return (
    <section className="relative">
      {/* ===== モバイル（md未満）: 画像とテキストを分離 ===== */}
      <div className="md:hidden">
        {/* 画像 — アスペクト比16:9でしっかり見せる */}
        <div className="relative w-full aspect-[16/9]">
          <Image
            src={campaign.hero_image_url || "/images/hero-irish-bon-odori.jpg"}
            alt={title}
            fill
            className="object-cover"
            priority
            loading="eager"
          />
          {/* バッジだけ画像の上に */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <Badge className="bg-brand-gold text-brand-dark font-bold border-0 text-[10px] px-2 py-0.5 shadow">
              {t("accepting")}
            </Badge>
            <Badge className="bg-white/90 text-brand-dark border-0 text-[10px] backdrop-blur-sm px-2 py-0.5 shadow">
              {t("cultureArt")}
            </Badge>
          </div>
        </div>
        {/* テキスト — 画像の下、背景色付き */}
        <div className="bg-brand-dark px-4 py-4 space-y-2">
          <h1 className="text-lg font-black text-white leading-snug">
            {title}
          </h1>
          <p className="text-white/75 text-xs leading-relaxed line-clamp-2">
            {shortDesc}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
            <div className="flex items-center gap-1 text-white/70 text-[11px]">
              <Calendar className="w-3 h-3 text-brand-gold shrink-0" />
              <span>{eventDate}</span>
            </div>
            <div className="flex items-center gap-1 text-white/70 text-[11px]">
              <MapPin className="w-3 h-3 text-brand-gold shrink-0" />
              <span>{eventVenue}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== PC（md以上）: 従来のオーバーレイ ===== */}
      <div className="hidden md:block">
        <div className="relative w-full h-96 lg:h-[500px] overflow-hidden">
          <Image
            src={campaign.hero_image_url || "/images/hero-irish-bon-odori.jpg"}
            alt={title}
            fill
            className="object-cover"
            priority
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/85 via-brand-dark/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-10">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className="bg-brand-gold text-brand-dark font-bold border-0 text-xs">
                  {t("accepting")}
                </Badge>
                <Badge className="bg-white/20 text-white border-white/30 text-xs backdrop-blur-sm">
                  {t("cultureArt")}
                </Badge>
              </div>
              <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight mb-3">
                {title}
              </h1>
              <p className="text-white/90 text-base leading-relaxed max-w-2xl">
                {shortDesc}
              </p>
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-1.5 text-white/80 text-sm">
                  <Calendar className="w-4 h-4 text-brand-gold shrink-0" />
                  <span>{eventDate}</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/80 text-sm">
                  <MapPin className="w-4 h-4 text-brand-gold shrink-0" />
                  <span>{eventVenue}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
