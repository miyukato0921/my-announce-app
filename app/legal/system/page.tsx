import sql from "@/lib/db"
import LegalPageClient from "@/components/legal/LegalPageClient"

export const dynamic = "force-dynamic"

export default async function SystemProviderPage() {
  let content = ""
  try {
    const rows = await sql`SELECT value FROM site_settings WHERE key = 'legal_system' LIMIT 1`
    content = rows[0]?.value ?? ""
  } catch {}

  const defaultContent = `<h2>システム提供・決済代行について</h2>

<p>本クラウドファンディングサイト（以下「本サービス」）のシステム提供・決済代行に関する情報です。</p>

<h3>クレジットカード情報の取り扱い</h3>
<p>クレジットカード情報は、<strong>Stripe, Inc.（米国）</strong>の決済基盤上でのみ処理されます。</p>
<ul>
<li>Stripe, Inc.は <strong>PCI DSS Level 1</strong> 認証（クレジットカード業界の最高レベルのセキュリティ基準）を取得した決済サービスプロバイダーです</li>
<li>すべての決済通信はSSL/TLSにより暗号化されています</li>
</ul>

<h3>支援金の流れ</h3>
<ol>
<li><strong>支援者</strong>がクレジットカードで支援金を決済</li>
<li><strong>Stripe, Inc.</strong> が決済処理を実施し、カード会社を通じて代金を収納</li>
<li>Stripeの入金サイクルに従い、支援金がプロジェクト主催者に引き渡されます</li>
</ol>

<p style="margin-top: 24px; font-size: 13px; color: #666;">※ 管理画面の「法的ページ編集」から内容を更新してください。</p>`

  return <LegalPageClient title="システム提供・決済代行について" content={content || defaultContent} />
}
