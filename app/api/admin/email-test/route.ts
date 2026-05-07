import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import nodemailer from "nodemailer"

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { to } = await req.json()
  if (!to) return NextResponse.json({ error: "to is required" }, { status: 400 })

  // 1. SMTP 認証情報を取得（DB優先 → 環境変数フォールバック / lib/email.ts と同一順序）
  let smtpHost: string | undefined
  let smtpPort = 587
  let smtpUser: string | undefined
  let smtpPass: string | undefined
  let emailFrom = process.env.EMAIL_FROM ?? ""
  let emailReplyTo = process.env.EMAIL_FROM ?? ""
  let credSource = "none"

  let legacyGmailWarning: string | null = null

  try {
    const rows = await sql`SELECT key, value FROM site_settings WHERE key IN ('smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'email_from', 'email_reply_to', 'gmail_user', 'gmail_app_password')`
    const map: Record<string, string> = {}
    for (const row of rows) map[row.key] = row.value

    if (map.smtp_host && map.smtp_user && map.smtp_pass) {
      smtpHost = map.smtp_host
      smtpPort = parseInt(map.smtp_port ?? "587", 10)
      smtpUser = map.smtp_user
      smtpPass = map.smtp_pass
      emailFrom = map.email_from || emailFrom
      emailReplyTo = map.email_reply_to || emailReplyTo
      credSource = "db"
    } else if (map.gmail_user && map.gmail_app_password) {
      // 旧 Gmail 設定が残っている場合は自動変換して使用
      smtpHost = "smtp.gmail.com"
      smtpPort = 587
      smtpUser = map.gmail_user
      smtpPass = map.gmail_app_password
      emailFrom = map.gmail_user
      credSource = "db(legacy gmail)"
      legacyGmailWarning = "旧Gmail設定（gmail_user/gmail_app_password）を使用しています。共通設定でSMTP設定に移行してください。"
    }
  } catch { /* DB失敗時は環境変数にフォールバック */ }

  if (!smtpHost || !smtpUser || !smtpPass) {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      smtpHost = process.env.SMTP_HOST
      smtpPort = parseInt(process.env.SMTP_PORT ?? "587", 10)
      smtpUser = process.env.SMTP_USER
      smtpPass = process.env.SMTP_PASS
      emailFrom = process.env.EMAIL_FROM || emailFrom
      credSource = "env"
    }
  }

  if (!smtpHost || !smtpUser || !smtpPass) {
    return NextResponse.json({
      success: false,
      step: "credentials",
      error: "SMTP認証情報が見つかりません。共通設定でSMTPホスト・ユーザー・パスワードを設定してください。",
      credSource,
      smtpHost: smtpHost ?? null,
      smtpUser: smtpUser ?? null,
    })
  }

  // 2. テンプレート確認
  const templates = await sql`SELECT slug, is_active FROM email_templates WHERE slug = 'pledge_confirmation' LIMIT 1`
  const templateStatus = templates.length > 0
    ? { found: true, slug: templates[0].slug, is_active: templates[0].is_active }
    : { found: false }

  // 3. テスト送信
  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    })

    await transporter.verify()

    await transporter.sendMail({
      from: emailFrom,
      replyTo: emailReplyTo,
      to,
      subject: "【テスト送信】メール配信テスト",
      text: `このメールはテスト送信です。\n\nSMTP認証情報: ${credSource}から取得\nSMTPホスト: ${smtpHost}\nSMTPユーザー: ${smtpUser}\n送信元: ${emailFrom}\n\nメール配信設定は正常に機能しています。`,
    })

    return NextResponse.json({
      success: true,
      credSource,
      smtpHost,
      smtpUser,
      emailFrom,
      templateStatus,
      legacyGmailWarning,
      message: `${to} へテスト送信しました`,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({
      success: false,
      step: "send",
      error: message,
      credSource,
      smtpHost,
      smtpUser,
      emailFrom,
      templateStatus,
    })
  }
}
