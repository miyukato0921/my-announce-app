import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"

function detectPlatform(ua: string): string {
  const l = ua.toLowerCase()
  if (l.includes("line/")) return "line"
  if (/iphone|ipad|ipod/.test(l)) return "ios"
  if (l.includes("android")) return "android"
  if (l.includes("chrome") && !l.includes("mobile")) return "chrome"
  if (!l.includes("mobile") && !l.includes("android")) return "pc"
  return "other"
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const rows = await sql`SELECT * FROM shortlinks WHERE slug = ${slug} AND is_active = true LIMIT 1`
  const link = rows[0] as any
  if (!link) return NextResponse.redirect(new URL("/", req.url))

  const ua = req.headers.get("user-agent") ?? ""
  const platform = detectPlatform(ua)
  const referer = req.headers.get("referer") ?? ""
  const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim()

  // クリック記録（非同期）
  sql`INSERT INTO shortlink_clicks (shortlink_id, user_agent, detected_platform, referer, ip_hash)
      VALUES (${link.id}, ${ua.slice(0, 500)}, ${platform}, ${referer.slice(0, 500)}, ${ip.slice(0, 64)})`.catch(() => {})
  sql`UPDATE shortlinks SET total_clicks = total_clicks + 1, updated_at = NOW() WHERE id = ${link.id}`.catch(() => {})

  let target = link.url_default
  if (platform === "line" && link.url_line) target = link.url_line
  else if (platform === "ios" && link.url_ios) target = link.url_ios
  else if (platform === "android" && link.url_android) target = link.url_android
  else if (platform === "chrome" && link.url_chrome) target = link.url_chrome
  else if (platform === "pc" && link.url_pc) target = link.url_pc

  return NextResponse.redirect(target, { status: 302 })
}
