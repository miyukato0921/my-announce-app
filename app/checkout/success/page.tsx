import CampaignHeader from "@/components/campaign/CampaignHeader"
import SuccessConfirm from "@/components/checkout/SuccessConfirm"
import SuccessPageClient from "@/components/checkout/SuccessPageClient"
import sql from "@/lib/db"

export const dynamic = "force-dynamic"

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams

  // キャンペーンタイトルを取得（site_settingsからフォールバック）
  let campaignTitle = ""
  try {
    const settings = await sql`SELECT value FROM site_settings WHERE key = 'site_title' LIMIT 1`
    campaignTitle = settings[0]?.value ?? "クラウドファンディング"
  } catch {}
  try {
    const campaigns = await sql`SELECT title FROM campaigns WHERE status = 'active' ORDER BY id LIMIT 1`
    if (campaigns[0]?.title) campaignTitle = campaigns[0].title
  } catch {
    // DB取得失敗時はデフォルト値を使用
  }

  // QRコード・リンク・リダイレクト設定を取得
  let qrSettings: Record<string, string> = {}
  try {
    const rows = await sql`SELECT key, value FROM site_settings WHERE key IN ('success_qr_url', 'success_qr_label', 'success_link_url', 'success_link_label', 'success_redirect_seconds', 'success_message')`
    for (const r of rows) qrSettings[r.key] = r.value
  } catch {}

  // 配送が必要か判定（SuccessConfirmと同じロジック）
  let needsShipping = false
  if (session_id) {
    try {
      const rows = await sql`
        SELECT rt.requires_shipping, p.shipping_name
        FROM pledges p
        JOIN reward_tiers rt ON rt.id = p.reward_tier_id
        WHERE p.stripe_session_id = ${session_id}
        LIMIT 1
      `
      if (rows[0]?.requires_shipping && !rows[0]?.shipping_name) {
        needsShipping = true
      }
    } catch {}
  }

  return (
    <div className="min-h-screen bg-background">
      <CampaignHeader />
      <main className="max-w-lg mx-auto px-4 py-16 text-center">
        {session_id && <SuccessConfirm sessionId={session_id} />}
        <SuccessPageClient
          campaignTitle={campaignTitle}
          qrUrl={qrSettings.success_qr_url}
          qrLabel={qrSettings.success_qr_label}
          linkUrl={qrSettings.success_link_url}
          linkLabel={qrSettings.success_link_label}
          redirectSeconds={qrSettings.success_redirect_seconds ? parseInt(qrSettings.success_redirect_seconds) : undefined}
          needsShipping={needsShipping}
          message={qrSettings.success_message}
        />
      </main>
    </div>
  )
}
