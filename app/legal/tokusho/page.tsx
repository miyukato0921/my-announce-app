import sql from "@/lib/db"
import LegalPageClient from "@/components/legal/LegalPageClient"

export const dynamic = "force-dynamic"

export default async function TokushoPage() {
  let content = ""
  try {
    const rows = await sql`SELECT value FROM site_settings WHERE key = 'legal_tokusho' LIMIT 1`
    content = rows[0]?.value ?? ""
  } catch {}

  const defaultContent = `<h2>特定商取引法に基づく表記</h2>

<table>
<tr><td><strong>販売事業者</strong></td><td>（管理画面の共通設定から設定してください）</td></tr>
<tr><td><strong>運営統括責任者</strong></td><td>（管理画面の共通設定から設定してください）</td></tr>
<tr><td><strong>所在地</strong></td><td>請求があった場合には遅滞なく開示いたします</td></tr>
<tr><td><strong>電話番号</strong></td><td>請求があった場合には遅滞なく開示いたします</td></tr>
<tr><td><strong>メールアドレス</strong></td><td>（管理画面の共通設定から設定してください）</td></tr>
<tr><td><strong>販売URL</strong></td><td>（管理画面の共通設定から設定してください）</td></tr>
<tr><td><strong>販売価格</strong></td><td>各プロジェクトページおよびリターン欄に記載の金額（税込）</td></tr>
<tr><td><strong>商品代金以外の必要料金</strong></td><td>なし（配送料が発生する場合は各リターン欄に記載いたします）</td></tr>
<tr><td><strong>支払方法</strong></td><td>クレジットカード決済（VISA / Mastercard / American Express / JCB）<br>※ 決済処理はStripe, Inc.を通じて行われます</td></tr>
<tr><td><strong>支払時期</strong></td><td>支援申込時に即時決済</td></tr>
<tr><td><strong>商品（リターン）の引渡し時期</strong></td><td>各リターンに記載の発送予定時期に準じます。イベント参加権等のリターンは、イベント開催日に提供いたします。</td></tr>
<tr><td><strong>返品・交換について</strong></td><td>支援の性質上、支援完了後のキャンセル・返金は原則としてお受けしておりません。ただし、以下の場合は返金対応いたします。<br>・プロジェクトが中止となった場合（支援金全額を返金）<br>・リターン商品に初期不良があった場合（交換または返金にて対応）</td></tr>
<tr><td><strong>動作環境</strong></td><td>最新版のGoogle Chrome、Safari、Firefox、Edgeを推奨。スマートフォンのブラウザにも対応しています。</td></tr>
</table>

<p style="margin-top: 24px; font-size: 13px; color: #666;">※ 本ページは特定商取引に関する法律第11条に基づき表示しています。<br>※ 管理画面の「法的ページ編集」から内容を更新してください。</p>`

  return <LegalPageClient title="特定商取引法に基づく表記" content={content || defaultContent} />
}
