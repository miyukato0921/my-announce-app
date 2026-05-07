import nodemailer from "nodemailer"
import sql from "@/lib/db"

const DEFAULT_FROM = process.env.EMAIL_FROM ?? ""
const DEFAULT_REPLY_TO = process.env.EMAIL_FROM ?? ""

function renderTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "")
}

interface SmtpCredentials {
  host: string
  port: number
  user: string
  pass: string
  from: string
}

async function getSmtpCredentials(): Promise<SmtpCredentials | null> {
  // DB優先 → 環境変数フォールバック
  try {
    const rows = await sql`SELECT key, value FROM site_settings WHERE key IN ('smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'email_from', 'gmail_user', 'gmail_app_password')`
    const map: Record<string, string> = {}
    for (const row of rows) map[row.key] = row.value

    if (map.smtp_host && map.smtp_user && map.smtp_pass) {
      return {
        host: map.smtp_host,
        port: parseInt(map.smtp_port ?? "587", 10),
        user: map.smtp_user,
        pass: map.smtp_pass,
        from: map.email_from || DEFAULT_FROM,
      }
    }

    // 旧 Gmail 設定が残っている場合は自動変換して使用
    if (map.gmail_user && map.gmail_app_password) {
      return {
        host: "smtp.gmail.com",
        port: 587,
        user: map.gmail_user,
        pass: map.gmail_app_password,
        from: map.gmail_user,
      }
    }
  } catch {
    // DB失敗時は環境変数にフォールバック
  }

  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (host && user && pass) {
    return {
      host,
      port: parseInt(process.env.SMTP_PORT ?? "587", 10),
      user,
      pass,
      from: process.env.EMAIL_FROM || DEFAULT_FROM,
    }
  }

  return null
}

async function createTransporter() {
  const creds = await getSmtpCredentials()
  if (!creds) return null

  // 返信先アドレス・送信者名をDBから取得
  let replyTo = DEFAULT_REPLY_TO
  let senderName = ""
  try {
    const rows = await sql`SELECT key, value FROM site_settings WHERE key IN ('email_reply_to', 'site_title') LIMIT 2`
    for (const row of rows) {
      if (row.key === 'email_reply_to') replyTo = row.value
      if (row.key === 'site_title') senderName = row.value
    }
  } catch {}

  return {
    transporter: nodemailer.createTransport({
      host: creds.host,
      port: creds.port,
      secure: creds.port === 465,
      auth: { user: creds.user, pass: creds.pass },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    }),
    fromAddress: creds.from,
    replyToAddress: replyTo,
    senderName,
  }
}

export async function sendTemplateEmail(
  slug: string,
  to: string,
  vars: Record<string, string>
): Promise<void> {
  const rows = await sql`
    SELECT subject, body FROM email_templates WHERE slug = ${slug} AND is_active = true LIMIT 1
  `
  if (!rows.length) {
    console.log(`[email] Template "${slug}" not found or inactive — skipping.`)
    await logEmail(slug, to, `[template: ${slug}]`, "", "skipped", "テンプレートが見つからないか無効です")
    return
  }

  const { subject, body } = rows[0]
  const renderedSubject = renderTemplate(subject, vars)
  const renderedBody = renderTemplate(body, vars)

  const result = await createTransporter()

  if (!result) {
    console.log(`[email] SMTP credentials not set — skipping send.`)
    await logEmail(slug, to, renderedSubject, renderedBody, "failed", "SMTP認証情報が未設定です（共通設定または環境変数 SMTP_HOST / SMTP_USER / SMTP_PASS）")
    return
  }

  const { transporter, fromAddress, replyToAddress, senderName } = result

  try {
    await transporter.sendMail({
      from: senderName ? `"${senderName}" <${fromAddress}>` : fromAddress,
      replyTo: replyToAddress,
      to,
      subject: renderedSubject,
      text: renderedBody,
    })
    await logEmail(slug, to, renderedSubject, renderedBody, "sent", null)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[email] Send failed:`, message)
    await logEmail(slug, to, renderedSubject, renderedBody, "failed", message)
  }
}

async function logEmail(
  templateSlug: string,
  toAddress: string,
  subject: string,
  body: string,
  status: "sent" | "failed" | "skipped",
  errorMessage: string | null
) {
  try {
    await sql`
      INSERT INTO email_logs (template_slug, to_address, subject, body, status, error_message)
      VALUES (${templateSlug}, ${toAddress}, ${subject}, ${body}, ${status}, ${errorMessage})
    `
  } catch (logErr) {
    console.error("[email] Failed to write email log:", logErr)
  }
}

export async function sendRawEmail({
  to,
  subject,
  text,
  html,
  attachments,
}: {
  to: string
  subject: string
  text: string
  html?: string
  attachments?: Array<{ filename: string; content: Buffer; contentType?: string }>
}): Promise<void> {
  const result = await createTransporter()

  if (!result) {
    console.log(`[email] SMTP credentials not set — skipping send.`)
    return
  }

  const { transporter, fromAddress, replyToAddress, senderName } = result

  await transporter.sendMail({
    from: senderName ? `"${senderName}" <${fromAddress}>` : fromAddress,
    replyTo: replyToAddress,
    to,
    subject,
    text,
    ...(html ? { html } : {}),
    ...(attachments ? { attachments } : {}),
  })
}
