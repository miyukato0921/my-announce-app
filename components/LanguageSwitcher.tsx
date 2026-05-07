"use client"

import { useLanguage } from "@/components/LanguageProvider"
import type { Locale } from "@/lib/i18n"

const LANGS: { code: Locale; label: string; flag: string }[] = [
  { code: "ja", label: "日本語", flag: "JP" },
  { code: "en", label: "English", flag: "EN" },
  { code: "ko", label: "한국어", flag: "KO" },
  { code: "zh", label: "中文", flag: "ZH" },
]

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage()

  return (
    <div className="flex items-center gap-1 bg-white/10 rounded-full p-0.5">
      {LANGS.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLocale(lang.code)}
          className={`text-xs font-bold px-2.5 py-1 rounded-full transition-all duration-200 ${
            locale === lang.code
              ? "bg-brand-gold text-brand-dark shadow-sm"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
          aria-label={lang.label}
          title={lang.label}
        >
          {lang.flag}
        </button>
      ))}
    </div>
  )
}
