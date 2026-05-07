"use client"

import Image from "next/image"
import { useState } from "react"
import type { Campaign } from "@/lib/db"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { useLanguage } from "@/components/LanguageProvider"
import BlockRenderer from "@/components/campaign/BlockRenderer"
import type { PageBlock } from "@/lib/block-types"

interface GalleryPhoto {
  id: number
  image_url: string
  caption: string
  sort_order: number
}

interface Performer {
  id: number
  name: string
  role: string
  bio: string
  image_url: string | null
  sort_order: number
  name_en?: string; role_en?: string; bio_en?: string
  name_ko?: string; role_ko?: string; bio_ko?: string
  name_zh?: string; role_zh?: string; bio_zh?: string
}

interface Props {
  campaign: Campaign
  gallery: GalleryPhoto[]
  performers: Performer[]
}

export default function CampaignDescription({ campaign, gallery, performers }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null)
  const { t, locale, lang } = useLanguage()

  // ─── ブロック（言語別。DBに保存済みの翻訳を使用） ───
  const parseBlocks = (raw: unknown): PageBlock[] => {
    if (!raw) return []
    if (Array.isArray(raw)) return raw as PageBlock[]
    if (typeof raw === "string") {
      try { return JSON.parse(raw) as PageBlock[] } catch { return [] }
    }
    return []
  }

  const c = campaign as any
  const jaBlocks = parseBlocks(c.page_blocks)
  const langBlocksMap: Record<string, PageBlock[]> = {
    ja: jaBlocks,
    en: parseBlocks(c.page_blocks_en),
    ko: parseBlocks(c.page_blocks_ko),
    zh: parseBlocks(c.page_blocks_zh),
  }
  // 該当言語のブロックがあればそれを表示、なければ日本語にフォールバック
  const blocks = langBlocksMap[lang]?.length > 0 ? langBlocksMap[lang] : jaBlocks
  const hasBlocks = jaBlocks.length > 0

  // イベント日時・会場・締切をi18nで静的表示（APIコール不要）
  const eventDate = c.event_date || t("eventDateValue")
  const eventVenue = c.event_venue || t("venueValue")
  const deadlineLabel = (() => {
    if (!campaign.end_date) return t("tba")
    // UTC基準で年月日を取得（サーバー/クライアント間のタイムゾーン差によるハイドレーションミスマッチを防ぐ）
    const d = new Date(campaign.end_date)
    const y = d.getUTCFullYear()
    const m = d.getUTCMonth() + 1
    const day = d.getUTCDate()
    if (lang === "en") return `${d.toLocaleString("en-US", { month: "long", timeZone: "UTC" })} ${day}, ${y}`
    if (lang === "ko") return `${y}년 ${m}월 ${day}일`
    if (lang === "zh") return `${y}年${m}月${day}日`
    return `${y}年${m}月${day}日` // ja
  })()

  const localizePerformer = (p: Performer) => ({
    name: (lang !== "ja" && (p as any)[`name_${lang}`]) || p.name,
    role: (lang !== "ja" && (p as any)[`role_${lang}`]) || p.role,
    bio:  (lang !== "ja" && (p as any)[`bio_${lang}`])  || p.bio,
  })

  const prev = () => setLightbox((i) => (i === null ? null : (i - 1 + gallery.length) % gallery.length))
  const next = () => setLightbox((i) => (i === null ? null : (i + 1) % gallery.length))

  return (
    <div className="space-y-6 mb-6">

      {/* ─── イントロ ヒーロー画像（常に表示） ─── */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="relative w-full h-56 md:h-72">
          <Image
            src={campaign.hero_image_url || "/images/hero-irish-bon-odori.jpg"}
            alt={t("aboutProject")}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <p className="text-brand-gold text-xs font-bold uppercase tracking-widest mb-1">{t("aboutProject")}</p>
            <h2 className="text-white text-xl font-black text-balance leading-tight">
              {t("aboutTitle")}
            </h2>
          </div>
        </div>
      </div>

      {/* ─── ブロックコンテンツ（設定済みの場合）or デフォルト About ─── */}
      {hasBlocks ? (
        <BlockRenderer blocks={blocks} />
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-black text-foreground">{t("aboutProject")}</h2>
          </div>
          <div className="p-6 space-y-4 text-sm text-foreground/80 leading-relaxed">
            {campaign.description
              ? campaign.description.split(/\n\n+/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))
              : (
                <>
                  <p>{t("aboutP1")}</p>
                  <p>{t("aboutP2")}</p>
                  <p>{t("aboutP3")}</p>
                </>
              )
            }
          </div>
        </div>
      )}

      {/* ─── フォトギャラリー ─── */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-brand-green inline-block" />
          {t("gallery")}
        </h2>
        {gallery.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">{t("noPhotos")}</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {gallery.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setLightbox(i)}
                className="relative aspect-square rounded-xl overflow-hidden group focus:outline-none focus:ring-2 focus:ring-brand-green"
              >
                <Image
                  src={img.image_url}
                  alt={img.caption}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-brand-dark/0 group-hover:bg-brand-dark/40 transition-colors duration-300 flex items-center justify-center">
                  <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity px-2 text-center leading-tight">
                    {img.caption}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── 出演者紹介 ─── */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-brand-gold inline-block" />
          {t("performers")}
        </h2>
        {performers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">{t("noPerformers")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {performers.map((p) => {
              const lp = localizePerformer(p)
              return (
                <div key={p.id} className="rounded-xl overflow-hidden border border-border bg-muted/30">
                  <div className="relative w-full h-52">
                    <Image
                      src={p.image_url || "/images/performer-ukon.jpg"}
                      alt={lp.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-4">
                      <p className="text-brand-gold text-xs font-bold uppercase tracking-wider mb-0.5">{lp.role}</p>
                      <p className="text-white text-lg font-black">{lp.name}</p>
                    </div>
                  </div>
                  {lp.bio && (
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground leading-relaxed">{lp.bio}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── 資金の使い道（ブロックに fund_usage がない場合のみデフォルト表示） ─── */}
      {!jaBlocks.some(b => b.type === "fund_usage") && (
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-brand-green inline-block" />
          {t("fundingUsage")}
        </h2>
        <div className="space-y-3">
          {[
            { labelKey: "fundUsage1" as const, percent: 40, color: "bg-brand-green" },
            { labelKey: "fundUsage2" as const, percent: 25, color: "bg-brand-gold" },
            { labelKey: "fundUsage3" as const, percent: 15, color: "bg-primary/60" },
            { labelKey: "fundUsage4" as const, percent: 15, color: "bg-secondary/70" },
            { labelKey: "fundUsage5" as const, percent: 5,  color: "bg-muted-foreground/40" },
          ].map((item) => (
            <div key={item.labelKey}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-foreground/80">{t(item.labelKey)}</span>
                <span className="font-bold text-foreground">{item.percent}%</span>
              </div>
              <div className="h-2.5 bg-border rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${item.color} transition-all duration-700`} style={{ width: `${item.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      )}

      {/* ─── イベント概要 ─── */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="relative w-full h-44">
          <Image src="/images/festival-crowd.jpg" alt={t("eventOverview")} fill className="object-cover" />
          <div className="absolute inset-0 bg-brand-dark/60" />
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="text-white text-xl font-black tracking-wide">{t("eventOverview")}</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {[
            { labelKey: "eventDate" as const, value: eventDate },
            { labelKey: "venue" as const,     value: eventVenue },
            { labelKey: "deadline" as const,  value: deadlineLabel },
          ].map((item) => (
            <div key={item.labelKey} className="p-5 text-center">
              <p className="text-xs text-muted-foreground mb-1">{t(item.labelKey)}</p>
              <p className="font-bold text-sm text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Lightbox ─── */}
      {lightbox !== null && gallery[lightbox] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            onClick={() => setLightbox(null)}
            aria-label="close"
          >
            <X className="w-8 h-8" />
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors bg-black/40 rounded-full p-2"
            onClick={(e) => { e.stopPropagation(); prev() }}
            aria-label="prev"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div
            className="relative w-full max-w-3xl max-h-[80vh] rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={gallery[lightbox].image_url}
              alt={gallery[lightbox].caption}
              width={1200}
              height={800}
              className="object-contain w-full h-full max-h-[75vh]"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-4 py-3 text-center">
              <p className="text-white text-sm">{gallery[lightbox].caption}</p>
              <p className="text-white/50 text-xs mt-0.5">{lightbox + 1} / {gallery.length}</p>
            </div>
          </div>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors bg-black/40 rounded-full p-2"
            onClick={(e) => { e.stopPropagation(); next() }}
            aria-label="next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  )
}
