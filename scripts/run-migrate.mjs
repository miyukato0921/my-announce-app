import { neon } from "@neondatabase/serverless"
import { readFileSync } from "fs"

const sql = neon(process.env.DATABASE_URL)

const files = [
  "scripts/migrate.sql",
  "scripts/add-site-settings.sql",
  "scripts/add-gallery-performers.sql",
  "scripts/add-email-templates.sql",
  "scripts/add-email-logs.sql",
  "scripts/add-shop-orders.sql",
  "scripts/add-receipts.sql",
  "scripts/add-receipts-v2.sql",
  "scripts/add-receipts-columns.sql",
  "scripts/enhance-receipts-v3.sql",
  "scripts/add-shortlinks.sql",
  "scripts/add-shipping.sql",
  "scripts/add-pledges.sql",
  "scripts/add-phone-columns.sql",
  "scripts/add-event-info.sql",
  "scripts/add-campaign-rich-content.sql",
  "scripts/add-campaign-i18n.sql",
  "scripts/add-reward-i18n.sql",
  "scripts/add-performers-i18n.sql",
  "scripts/add-products-i18n.sql",
  "scripts/add-page-blocks-i18n.sql",
  "scripts/add-announcements.sql",
]

for (const f of files) {
  try {
    const stmts = readFileSync(f, "utf8")
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0)
    for (const s of stmts) {
      try { await sql(s) } catch (e) {}
    }
    console.log("✓", f)
  } catch (e) {
    console.log("skip", f)
  }
}

console.log("\n完了")
