import type { Metadata } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { LanguageProvider } from '@/components/LanguageProvider'
import { SiteSettingsProvider } from '@/components/SiteSettingsProvider'
import sql from '@/lib/db'
import './globals.css'

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
})

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  let siteTitle = "クラウドファンディング"
  try {
    const rows = await sql`SELECT value FROM site_settings WHERE key = 'site_title' LIMIT 1`
    if (rows[0]?.value) siteTitle = rows[0].value
  } catch {}

  return {
    title: `${siteTitle} - クラウドファンディング`,
    description: `${siteTitle}のクラウドファンディングプロジェクト`,
    keywords: [siteTitle, 'クラウドファンディング'],
    openGraph: {
      title: siteTitle,
      description: `${siteTitle}のクラウドファンディング`,
      type: 'website',
    },
  }
}

async function getSiteSettings() {
  try {
    const rows = await sql`SELECT key, value FROM site_settings WHERE key IN ('logo_url', 'site_title')`
    const map: Record<string, string> = {}
    for (const r of rows) map[r.key] = r.value
    return map
  } catch {
    return {}
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const settings = await getSiteSettings()

  return (
    <html lang="ja">
      <body className={`${notoSansJP.className} font-sans antialiased bg-background text-foreground`}>
        <SiteSettingsProvider
          logoUrl={settings.logo_url ?? ""}
          siteTitle={settings.site_title ?? "クラウドファンディング"}
        >
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </SiteSettingsProvider>
        <Analytics />
      </body>
    </html>
  )
}
