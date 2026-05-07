import sql from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const rows = await sql`
    SELECT r.*, rt.logo_url, rt.stamp_url, rt.footer_note, rt.issuer_tel, rt.issuer_email
    FROM receipts r
    LEFT JOIN receipt_templates rt ON rt.id = r.template_id
    WHERE r.download_token = ${token}
  `
  const r = rows[0] as any
  if (!r) {
    return new NextResponse("<html><body><h1>領収書が見つかりません</h1><p>リンクが無効です。</p></body></html>", {
      status: 404, headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  }

  // ダウンロード記録
  sql`UPDATE receipts SET downloaded_at = NOW() WHERE download_token = ${token}`.catch(() => {})

  const issuedDate = new Date(r.issued_date).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>領収書 ${r.receipt_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif; padding: 40px 24px; max-width: 800px; margin: 0 auto; color: #333; }
    .print-btn { text-align: center; margin-bottom: 30px; }
    .print-btn button { background: #2D6A4F; color: white; border: none; padding: 14px 40px; border-radius: 10px; font-size: 16px; font-weight: bold; cursor: pointer; }
    .print-btn button:hover { background: #245a42; }
    .header { text-align: center; margin-bottom: 40px; }
    .header h1 { font-size: 28px; letter-spacing: 10px; border-bottom: 3px double #333; display: inline-block; padding-bottom: 10px; }
    .number { text-align: right; font-size: 13px; color: #666; margin-bottom: 24px; }
    .recipient { font-size: 22px; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 6px; margin-bottom: 32px; }
    .amount-box { border: 2px solid #333; padding: 20px; text-align: center; margin-bottom: 32px; }
    .amount-box .label { font-size: 13px; color: #666; }
    .amount-box .value { font-size: 36px; font-weight: bold; margin-top: 6px; letter-spacing: 2px; }
    .details table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    .details td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
    .details td:first-child { width: 130px; color: #666; font-weight: bold; }
    .issuer-section { position: relative; margin-top: 48px; }
    .issuer { text-align: right; }
    .issuer .name { font-size: 18px; font-weight: bold; }
    .issuer .addr { font-size: 13px; color: #666; margin-top: 4px; }
    .stamp-row { display: flex; justify-content: flex-end; align-items: center; gap: 0; margin-top: 16px; position: relative; }
    .stamp-row img { width: 80px; height: 80px; opacity: 0.8; }
    .reissue-stamp { width: 70px; height: 70px; border: 3px solid #dc2626; border-radius: 50%; color: #dc2626; font-size: 14px; font-weight: bold; letter-spacing: 2px; display: flex; align-items: center; justify-content: center; transform: rotate(-18deg); opacity: 0.85; margin-left: -10px; flex-shrink: 0; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 11px; color: #999; text-align: center; }
    @media print { .print-btn { display: none; } body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="print-btn"><button onclick="window.print()">印刷 / PDF保存</button></div>
  <div class="header">
    ${r.logo_url ? `<img src="${r.logo_url}" alt="" style="height:50px;display:block;margin:0 auto 16px">` : ""}
    <h1>領　収　書</h1>
  </div>
  <div class="number">No. ${r.receipt_number}　　発行日: ${issuedDate}</div>
  <div class="recipient">${r.supporter_name || r.recipient_name}　様</div>
  <div class="amount-box">
    <div class="label">金額</div>
    <div class="value">¥${Number(r.amount).toLocaleString("ja-JP")}−</div>
  </div>
  <div class="details"><table>
    <tr><td>但し書き</td><td>${r.proviso}</td></tr>
    <tr><td>発行日</td><td>${issuedDate}</td></tr>
    <tr><td>領収書番号</td><td>${r.receipt_number}</td></tr>
  </table></div>
  <div class="issuer-section">
    <div class="issuer">
      <div class="name">${r.issuer_name}</div>
      ${r.issuer_address ? `<div class="addr">${r.issuer_address}</div>` : ""}
      ${r.issuer_tel ? `<div class="addr">TEL: ${r.issuer_tel}</div>` : ""}
      ${r.issuer_email ? `<div class="addr">Email: ${r.issuer_email}</div>` : ""}
    </div>
    <div class="stamp-row">
      ${r.stamp_url ? `<img src="${r.stamp_url}" alt="印影">` : ""}
      ${r.reissued ? '<div class="reissue-stamp">再発行</div>' : ""}
    </div>
  </div>
  ${r.footer_note ? `<div class="footer">${r.footer_note}</div>` : ""}
</body>
</html>`

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
