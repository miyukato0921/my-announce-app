"use client"

import { createContext, useContext, type ReactNode } from "react"

interface SiteSettings {
  logoUrl: string
  siteTitle: string
}

const SiteSettingsContext = createContext<SiteSettings>({
  logoUrl: "",
  siteTitle: "クラウドファンディング",
})

export function useSiteSettings() {
  return useContext(SiteSettingsContext)
}

export function SiteSettingsProvider({
  logoUrl,
  siteTitle,
  children,
}: SiteSettings & { children: ReactNode }) {
  return (
    <SiteSettingsContext.Provider value={{ logoUrl, siteTitle }}>
      {children}
    </SiteSettingsContext.Provider>
  )
}
