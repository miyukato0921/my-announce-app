import sql from "@/lib/db"
import { notFound } from "next/navigation"

export default async function ReceiptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const rows = await sql`
    SELECT r.*, rt.logo_url, rt.stamp_url, rt.footer_note, rt.issuer_tel, rt.issuer_email
    FROM receipts r
    LEFT JOIN receipt_templates rt ON rt.id = r.template_id
    WHERE r.download_token = ${token}
  `
  const r = rows[0] as any
  if (!r) notFound()

  // ダウンロード記録
  sql`UPDATE receipts SET downloaded_at = NOW() WHERE download_token = ${token}`.catch(() => {})

  const issuedDate = new Date(r.issued_date).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })

  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>領収書 {r.receipt_number}</title>
        <style dangerouslySetInnerHTML={{ __html: `
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif; padding: 40px 24px; max-width: 800px; margin: 0 auto; color: #333; background: #fff; }
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
        `}} />
      </head>
      <body>
        <div className="print-btn">
          <button onClick="window.print()">印刷 / PDF保存</button>
        </div>
        <div className="header">
          {r.logo_url && <img src={r.logo_url} alt="" style={{ height: 50, marginBottom: 16, display: "block", margin: "0 auto 16px" }} />}
          <h1>領　収　書</h1>
        </div>
        <div className="number">No. {r.receipt_number}　　発行日: {issuedDate}</div>
        <div className="recipient">{r.supporter_name}　様</div>
        <div className="amount-box">
          <div className="label">金額</div>
          <div className="value">¥{Number(r.amount).toLocaleString("ja-JP")}−</div>
        </div>
        <div className="details">
          <table>
            <tbody>
              <tr><td>但し書き</td><td>{r.proviso}</td></tr>
              <tr><td>発行日</td><td>{issuedDate}</td></tr>
              <tr><td>領収書番号</td><td>{r.receipt_number}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="issuer-section">
          <div className="issuer">
            <div className="name">{r.issuer_name}</div>
            {r.issuer_address && <div className="addr">{r.issuer_address}</div>}
            {r.issuer_tel && <div className="addr">TEL: {r.issuer_tel}</div>}
            {r.issuer_email && <div className="addr">Email: {r.issuer_email}</div>}
          </div>
          <div className="stamp-row">
            {r.stamp_url && <img src={r.stamp_url} alt="印影" />}
            {r.reissued && <div className="reissue-stamp">再発行</div>}
          </div>
        </div>
        {r.footer_note && <div className="footer">{r.footer_note}</div>}
      </body>
    </html>
  )
}
