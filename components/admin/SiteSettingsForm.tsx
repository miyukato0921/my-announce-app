"use client"

import { useState, useTransition, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import ImageUploader from "@/components/admin/ImageUploader"
import { Check, Save, CreditCard, Mail, Globe, Eye, EyeOff, FlaskConical, Zap, QrCode, Receipt, Stamp } from "lucide-react"
import Image from "next/image"
import { processStampImage } from "@/lib/stamp-processor"

interface ReceiptTemplate {
  id: number
  name: string
  issuer_name: string | null
  issuer_address: string | null
  issuer_tel: string | null
  issuer_email: string | null
  logo_url: string | null
  stamp_url: string | null
  prefix: string
  next_number: number
  default_proviso: string | null
  footer_note: string | null
  is_default: boolean
}

interface Props {
  initial: Record<string, string>
  receiptTemplate?: ReceiptTemplate | null
}

const MASKED = "••••••••••••••••"

function SecretField({
  id,
  label,
  placeholder,
  saved,
  value,
  onChange,
  show,
  onToggleShow,
  editing,
  onEdit,
}: {
  id: string
  label: string
  placeholder: string
  saved: boolean
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggleShow: () => void
  editing: boolean
  onEdit: () => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>
          {label}
          {saved && <span className="ml-2 text-xs text-brand-green font-normal">設定済み</span>}
        </Label>
        {saved && !editing && (
          <button type="button" onClick={onEdit} className="text-xs text-brand-green underline underline-offset-2">
            変更する
          </button>
        )}
      </div>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={saved && !editing}
          placeholder={placeholder}
          className={`pr-10 font-mono text-sm ${saved && !editing ? "bg-muted cursor-default select-none" : ""}`}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

export default function SiteSettingsForm({ initial, receiptTemplate }: Props) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  // 領収書設定
  const [rcptIssuerName, setRcptIssuerName] = useState(receiptTemplate?.issuer_name ?? "")
  const [rcptIssuerAddress, setRcptIssuerAddress] = useState(receiptTemplate?.issuer_address ?? "")
  const [rcptIssuerTel, setRcptIssuerTel] = useState(receiptTemplate?.issuer_tel ?? "")
  const [rcptIssuerEmail, setRcptIssuerEmail] = useState(receiptTemplate?.issuer_email ?? "")
  const [rcptLogoUrl, setRcptLogoUrl] = useState(receiptTemplate?.logo_url ?? "")
  const [rcptStampUrl, setRcptStampUrl] = useState(receiptTemplate?.stamp_url ?? "")
  const [rcptPrefix, setRcptPrefix] = useState(receiptTemplate?.prefix ?? "CF")
  const [rcptProviso, setRcptProviso] = useState(receiptTemplate?.default_proviso ?? "クラウドファンディング支援金として")
  const [rcptFooterNote, setRcptFooterNote] = useState(receiptTemplate?.footer_note ?? "")
  const [stampUploading, setStampUploading] = useState(false)
  const stampInputRef = useRef<HTMLInputElement>(null)

  // サイト情報
  const [title, setTitle] = useState(initial.site_title ?? "")
  const [subtitle, setSubtitle] = useState(initial.site_subtitle ?? "")
  const [logoUrl, setLogoUrl] = useState(initial.logo_url ?? "")

  // Stripe モード
  const [stripeMode, setStripeMode] = useState<"test" | "live">(
    (initial.stripe_mode as "test" | "live") ?? "live"
  )

  // Stripe 本番キー
  const stripeKeySaved = !!initial.stripe_secret_key
  const [stripeKey, setStripeKey] = useState(stripeKeySaved ? MASKED : "")
  const [showStripeKey, setShowStripeKey] = useState(false)
  const [stripeKeyEditing, setStripeKeyEditing] = useState(false)

  const stripePubKeySaved = !!initial.stripe_publishable_key
  const [stripePubKey, setStripePubKey] = useState(initial.stripe_publishable_key ?? "")

  const stripeWebhookSaved = !!initial.stripe_webhook_secret
  const [stripeWebhook, setStripeWebhook] = useState(stripeWebhookSaved ? MASKED : "")
  const [showStripeWebhook, setShowStripeWebhook] = useState(false)
  const [stripeWebhookEditing, setStripeWebhookEditing] = useState(false)

  // Stripe テストキー
  const stripeTestKeySaved = !!initial.stripe_test_secret_key
  const [stripeTestKey, setStripeTestKey] = useState(stripeTestKeySaved ? MASKED : "")
  const [showStripeTestKey, setShowStripeTestKey] = useState(false)
  const [stripeTestKeyEditing, setStripeTestKeyEditing] = useState(false)

  const stripeTestPubKeySaved = !!initial.stripe_test_publishable_key
  const [stripeTestPubKey, setStripeTestPubKey] = useState(initial.stripe_test_publishable_key ?? "")

  const stripeTestWebhookSaved = !!initial.stripe_test_webhook_secret
  const [stripeTestWebhook, setStripeTestWebhook] = useState(stripeTestWebhookSaved ? MASKED : "")
  const [showStripeTestWebhook, setShowStripeTestWebhook] = useState(false)
  const [stripeTestWebhookEditing, setStripeTestWebhookEditing] = useState(false)

  // SMTP
  const smtpHostSaved = !!initial.smtp_host
  const [smtpHost, setSmtpHost] = useState(initial.smtp_host ?? "")
  const [smtpPort, setSmtpPort] = useState(initial.smtp_port ?? "587")
  const [smtpUser, setSmtpUser] = useState(initial.smtp_user ?? "")

  const smtpPassSaved = !!initial.smtp_pass
  const [smtpPass, setSmtpPass] = useState(smtpPassSaved ? MASKED : "")
  const [showSmtpPass, setShowSmtpPass] = useState(false)
  const [smtpPassEditing, setSmtpPassEditing] = useState(false)

  const [emailFrom, setEmailFrom] = useState(initial.email_from ?? "")
  const [emailReplyTo, setEmailReplyTo] = useState(initial.email_reply_to ?? "")

  // 完了画面QRコード・リンク
  const [successQrUrl, setSuccessQrUrl] = useState(initial.success_qr_url ?? "")
  const [successQrLabel, setSuccessQrLabel] = useState(initial.success_qr_label ?? "")
  const [successLinkUrl, setSuccessLinkUrl] = useState(initial.success_link_url ?? "")
  const [successLinkLabel, setSuccessLinkLabel] = useState(initial.success_link_label ?? "")
  const [successRedirectSeconds, setSuccessRedirectSeconds] = useState(initial.success_redirect_seconds ?? "")
  const [successMessage, setSuccessMessage] = useState(initial.success_message ?? "")

  const handleSave = () => {
    startTransition(async () => {
      const payload: Record<string, string> = {
        site_title: title,
        site_subtitle: subtitle,
        logo_url: logoUrl,
        stripe_mode: stripeMode,
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_user: smtpUser,
        email_from: emailFrom,
        email_reply_to: emailReplyTo,
        stripe_publishable_key: stripePubKey,
        stripe_test_publishable_key: stripeTestPubKey,
        success_qr_url: successQrUrl,
        success_qr_label: successQrLabel,
        success_link_url: successLinkUrl,
        success_link_label: successLinkLabel,
        success_redirect_seconds: successRedirectSeconds,
        success_message: successMessage,
      }
      // masked・空欄は上書きしない
      if (stripeKey && stripeKey !== MASKED) payload.stripe_secret_key = stripeKey
      if (stripeWebhook && stripeWebhook !== MASKED) payload.stripe_webhook_secret = stripeWebhook
      if (stripeTestKey && stripeTestKey !== MASKED) payload.stripe_test_secret_key = stripeTestKey
      if (stripeTestWebhook && stripeTestWebhook !== MASKED) payload.stripe_test_webhook_secret = stripeTestWebhook
      if (smtpPass && smtpPass !== MASKED) payload.smtp_pass = smtpPass

      await fetch("/api/admin/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      // Save receipt template settings
      // First check if any template exists
      const rcptPayload = {
        name: "デフォルト",
        issuer_name: rcptIssuerName,
        issuer_address: rcptIssuerAddress,
        issuer_tel: rcptIssuerTel,
        issuer_email: rcptIssuerEmail,
        logo_url: rcptLogoUrl,
        stamp_url: rcptStampUrl,
        prefix: rcptPrefix,
        default_proviso: rcptProviso,
        footer_note: rcptFooterNote,
      }
      try {
        const tplRes = await fetch("/api/admin/receipt-templates")
        const templates = await tplRes.json()
        const existingTpl = Array.isArray(templates) && templates.length > 0 ? templates[0] : null

        if (existingTpl?.id) {
          await fetch(`/api/admin/receipt-templates/${existingTpl.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(rcptPayload),
          })
        } else {
          await fetch("/api/admin/receipt-templates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(rcptPayload),
          })
        }
      } catch (e) {
        console.error("Receipt template save error:", e)
      }

      setSaved(true)
      if (stripeKey && stripeKey !== MASKED) { setStripeKey(MASKED); setStripeKeyEditing(false) }
      if (stripeWebhook && stripeWebhook !== MASKED) { setStripeWebhook(MASKED); setStripeWebhookEditing(false) }
      if (stripeTestKey && stripeTestKey !== MASKED) { setStripeTestKey(MASKED); setStripeTestKeyEditing(false) }
      if (stripeTestWebhook && stripeTestWebhook !== MASKED) { setStripeTestWebhook(MASKED); setStripeTestWebhookEditing(false) }
      if (smtpPass && smtpPass !== MASKED) { setSmtpPass(MASKED); setSmtpPassEditing(false) }
      setTimeout(() => setSaved(false), 3000)
    })
  }

  return (
    <div className="space-y-8 max-w-2xl">

      {/* ��ゴ */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-4 h-4 text-brand-green" />
          <h2 className="font-bold text-foreground">ロゴ画像</h2>
        </div>
        {logoUrl && (
          <div className="relative w-32 h-16 rounded-xl overflow-hidden border border-border bg-muted">
            <Image src={logoUrl} alt="ロゴプレビュー" fill className="object-contain p-2" unoptimized />
          </div>
        )}
        <ImageUploader
          name="logo_url"
          label="ロゴ画像をアップロード"
          defaultValue={logoUrl}
          onUrlChange={setLogoUrl}
        />
        <p className="text-xs text-muted-foreground">推奨サイズ: 横長・透過PNG（例: 400×100px）</p>
      </div>

      {/* サイト名・サブタイトル */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-4 h-4 text-brand-green" />
          <h2 className="font-bold text-foreground">サイト名・サブタイトル</h2>
        </div>
        <div className="space-y-2">
          <Label htmlFor="site_title">サイトタイトル</Label>
          <Input
            id="site_title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="サイト名を入力"
          />
          <p className="text-xs text-muted-foreground">ブラウザタブ・ヘッダーに表示されます</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="site_subtitle">サブタイトル / キャッチコピー</Label>
          <Textarea
            id="site_subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="日本×アイルランドの文化融合フェスティバル"
            rows={2}
          />
          <p className="text-xs text-muted-foreground">ヘッダーやOGPに表示されます</p>
        </div>
      </div>

      {/* Stripe 決済設定 */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="w-4 h-4 text-brand-green" />
          <h2 className="font-bold text-foreground">Stripe 決済設定</h2>
        </div>

        {/* モードトグル */}
        <div className="space-y-2">
          <Label>決済モード</Label>
          <div className="flex rounded-xl border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setStripeMode("test")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                stripeMode === "test"
                  ? "bg-amber-500 text-white"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              テストモード
            </button>
            <button
              type="button"
              onClick={() => setStripeMode("live")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                stripeMode === "live"
                  ? "bg-brand-green text-white"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              <Zap className="w-4 h-4" />
              本番モード
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {stripeMode === "test"
              ? "テストモード中はテスト用カード番号（4242 4242 4242 4242）で決済できます。実際の課金は発生しません。"
              : "本番モードで実際の決済が行われます。本番用キーが設定されていることを確認してください。"}
          </p>
          {stripeMode === "test" && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400">テストモード有効中</p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">実際の課金は発生しません。テスト用キーを使用しています。</p>
            </div>
          )}
        </div>

        {/* テストキー */}
        <div className="space-y-4 border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-3.5 h-3.5 text-amber-500" />
            <h3 className="text-sm font-bold text-foreground">テスト用キー</h3>
            <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-mono">sk_test_ / pk_test_</span>
          </div>
          <SecretField
            id="stripe_test_secret_key"
            label="テスト シークレットキー"
            placeholder="sk_test_xxxxxxxxxxxx"
            saved={stripeTestKeySaved}
            value={stripeTestKey}
            onChange={setStripeTestKey}
            show={showStripeTestKey}
            onToggleShow={() => setShowStripeTestKey((v) => !v)}
            editing={stripeTestKeyEditing}
            onEdit={() => { setStripeTestKey(""); setStripeTestKeyEditing(true) }}
          />
          <div className="space-y-2">
            <Label htmlFor="stripe_test_publishable_key">
              テスト 公開キー
              {stripeTestPubKeySaved && <span className="ml-2 text-xs text-brand-green font-normal">設定済み</span>}
            </Label>
            <Input
              id="stripe_test_publishable_key"
              value={stripeTestPubKey}
              onChange={(e) => setStripeTestPubKey(e.target.value)}
              placeholder="pk_test_xxxxxxxxxxxx"
              className="font-mono text-sm"
            />
          </div>
          <SecretField
            id="stripe_test_webhook_secret"
            label="テスト Webhook シークレット"
            placeholder="whsec_xxxxxxxxxxxx（テスト用）"
            saved={stripeTestWebhookSaved}
            value={stripeTestWebhook}
            onChange={setStripeTestWebhook}
            show={showStripeTestWebhook}
            onToggleShow={() => setShowStripeTestWebhook((v) => !v)}
            editing={stripeTestWebhookEditing}
            onEdit={() => { setStripeTestWebhook(""); setStripeTestWebhookEditing(true) }}
          />
        </div>

        {/* 本番キー */}
        <div className="space-y-4 border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-brand-green" />
            <h3 className="text-sm font-bold text-foreground">本番用キー</h3>
            <span className="text-xs bg-brand-green/10 text-brand-green px-2 py-0.5 rounded-full font-mono">sk_live_ / pk_live_</span>
          </div>
          <SecretField
            id="stripe_secret_key"
            label="本番 シークレットキー"
            placeholder="sk_live_xxxxxxxxxxxx"
            saved={stripeKeySaved}
            value={stripeKey}
            onChange={setStripeKey}
            show={showStripeKey}
            onToggleShow={() => setShowStripeKey((v) => !v)}
            editing={stripeKeyEditing}
            onEdit={() => { setStripeKey(""); setStripeKeyEditing(true) }}
          />
          <div className="space-y-2">
            <Label htmlFor="stripe_publishable_key">
              本番 公開キー
              {stripePubKeySaved && <span className="ml-2 text-xs text-brand-green font-normal">設定済み</span>}
            </Label>
            <Input
              id="stripe_publishable_key"
              value={stripePubKey}
              onChange={(e) => setStripePubKey(e.target.value)}
              placeholder="pk_live_xxxxxxxxxxxx"
              className="font-mono text-sm"
            />
          </div>
          <SecretField
            id="stripe_webhook_secret"
            label="本番 Webhook シークレット"
            placeholder="whsec_xxxxxxxxxxxx（本番用）"
            saved={stripeWebhookSaved}
            value={stripeWebhook}
            onChange={setStripeWebhook}
            show={showStripeWebhook}
            onToggleShow={() => setShowStripeWebhook((v) => !v)}
            editing={stripeWebhookEditing}
            onEdit={() => { setStripeWebhook(""); setStripeWebhookEditing(true) }}
          />
        </div>
      </div>

      {/* SMTP メール送信設定 */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-4 h-4 text-brand-green" />
          <h2 className="font-bold text-foreground">メール送信設定（SMTP）</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          返信先アドレス: <code className="font-mono bg-muted px-1 rounded">{emailReplyTo}</code>（下記で変更可能）
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="smtp_host">SMTPホスト</Label>
            <Input
              id="smtp_host"
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              placeholder="smtp.example.com"
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp_port">ポート</Label>
            <Input
              id="smtp_port"
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
              placeholder="587"
              className="font-mono text-sm"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="smtp_user">SMTPユーザー名</Label>
          <Input
            id="smtp_user"
            value={smtpUser}
            onChange={(e) => setSmtpUser(e.target.value)}
            placeholder="user@iris-corp.co.jp"
            className="font-mono text-sm"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="smtp_pass">
              SMTPパスワード
              {smtpPassSaved && <span className="ml-2 text-xs text-brand-green font-normal">設定済み</span>}
            </Label>
            {smtpPassSaved && !smtpPassEditing && (
              <button type="button" onClick={() => { setSmtpPass(""); setSmtpPassEditing(true) }} className="text-xs text-brand-green underline underline-offset-2">
                変更する
              </button>
            )}
          </div>
          <div className="relative">
            <Input
              id="smtp_pass"
              type={showSmtpPass ? "text" : "password"}
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
              readOnly={smtpPassSaved && !smtpPassEditing}
              placeholder="SMTPパスワード"
              className={`pr-10 font-mono text-sm ${smtpPassSaved && !smtpPassEditing ? "bg-muted cursor-default select-none" : ""}`}
            />
            <button type="button" onClick={() => setShowSmtpPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email_from">送信元メールアドレス</Label>
          <Input
            id="email_from"
            type="email"
            value={emailFrom}
            onChange={(e) => setEmailFrom(e.target.value)}
            placeholder="noreply@example.com"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            メールの From に表示されるアドレスです。SMTPサーバーで送信が許可されたアドレスを指定してください。
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email_reply_to">返信先メールアドレス</Label>
          <Input
            id="email_reply_to"
            type="email"
            value={emailReplyTo}
            onChange={(e) => setEmailReplyTo(e.target.value)}
            placeholder="noreply@example.com"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            メールの返信先（Reply-To）に設定されるアドレスです。受信者が返信するとこのアドレスに届きます。
          </p>
        </div>
      </div>

      {/* 完了画面 QRコード・リンク */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <QrCode className="w-4 h-4 text-brand-green" />
          <h2 className="font-bold text-foreground">完了画面 QRコード・リンク</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          支援完了・購入完了の画面に表示するQRコードとリンクを設定します。LINE公式アカウントやSNSへの誘導などにご利用ください。
        </p>

        <div className="space-y-2">
          <Label htmlFor="success_qr_url">QRコード URL</Label>
          <Input
            id="success_qr_url"
            value={successQrUrl}
            onChange={(e) => setSuccessQrUrl(e.target.value)}
            placeholder="https://line.me/R/ti/p/@example"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">このURLのQRコードが完了画面に表示されます。空欄の場合は非表示。</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="success_qr_label">QRコード ラベル</Label>
          <Input
            id="success_qr_label"
            value={successQrLabel}
            onChange={(e) => setSuccessQrLabel(e.target.value)}
            placeholder="LINE公式アカウントを友だち追加"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="success_link_url">リンク URL</Label>
          <Input
            id="success_link_url"
            value={successLinkUrl}
            onChange={(e) => setSuccessLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">完了画面にボタンリンクとして表示されます。空欄の場合は非表示。</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="success_link_label">リンク ラベル</Label>
          <Input
            id="success_link_label"
            value={successLinkLabel}
            onChange={(e) => setSuccessLinkLabel(e.target.value)}
            placeholder="イベント詳細はこちら"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="success_redirect_seconds">自動リダイレクト秒数（オプション）</Label>
          <Input
            id="success_redirect_seconds"
            type="number"
            min={0}
            value={successRedirectSeconds}
            onChange={(e) => setSuccessRedirectSeconds(e.target.value)}
            placeholder="10"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">秒数を指定すると、完了画面から自動的にホームにリダイレクト。0 = リダイレクトなし。</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="success_message">任意メッセージ</Label>
          <Textarea
            id="success_message"
            value={successMessage}
            onChange={(e) => setSuccessMessage(e.target.value)}
            placeholder="ご支援ありがとうございます。イベント当日のご来場をお待ちしております！"
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">完了画面のQRコード上に表示。空欄で非表示。</p>
        </div>

        {/* プレビュー */}
        {successQrUrl && (
          <div className="bg-muted/50 rounded-xl p-4 text-center space-y-2">
            <p className="text-xs font-bold text-muted-foreground">プレビュー</p>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(successQrUrl)}`}
              alt="QR Preview"
              className="mx-auto rounded-lg"
              width={120}
              height={120}
            />
            {successQrLabel && <p className="text-xs text-foreground font-bold">{successQrLabel}</p>}
          </div>
        )}
      </div>

      {/* 領収書設定 */}
      <div id="receipt-settings" className="bg-card border border-border rounded-2xl p-6 space-y-5 scroll-mt-6">
        <div className="flex items-center gap-2 mb-1">
          <Receipt className="w-4 h-4 text-brand-green" />
          <h2 className="font-bold text-foreground">領収書設定</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          領収書に表示される差出人情報・印鑑画像などを設定します。
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rcpt_issuer_name">差出人名（発行者名）</Label>
            <Input
              id="rcpt_issuer_name"
              value={rcptIssuerName}
              onChange={(e) => setRcptIssuerName(e.target.value)}
              placeholder="発行者名を入力"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rcpt_issuer_email">メールアドレス</Label>
            <Input
              id="rcpt_issuer_email"
              type="email"
              value={rcptIssuerEmail}
              onChange={(e) => setRcptIssuerEmail(e.target.value)}
              placeholder="info@example.com"
              className="font-mono text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rcpt_issuer_address">住所</Label>
          <Input
            id="rcpt_issuer_address"
            value={rcptIssuerAddress}
            onChange={(e) => setRcptIssuerAddress(e.target.value)}
            placeholder="東京都渋谷区..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rcpt_issuer_tel">電話番号</Label>
            <Input
              id="rcpt_issuer_tel"
              value={rcptIssuerTel}
              onChange={(e) => setRcptIssuerTel(e.target.value)}
              placeholder="03-1234-5678"
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rcpt_prefix">領収書番号プレフィックス</Label>
            <Input
              id="rcpt_prefix"
              value={rcptPrefix}
              onChange={(e) => setRcptPrefix(e.target.value)}
              placeholder="GIF"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">例: GIF → GIF-000001</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rcpt_proviso">但し書き（デフォルト）</Label>
          <Input
            id="rcpt_proviso"
            value={rcptProviso}
            onChange={(e) => setRcptProviso(e.target.value)}
            placeholder="クラウドファンディング支援金として"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rcpt_footer_note">フッター注記</Label>
          <Textarea
            id="rcpt_footer_note"
            value={rcptFooterNote}
            onChange={(e) => setRcptFooterNote(e.target.value)}
            placeholder="この領収書は電子的に発行されたものです。"
            rows={2}
            className="resize-none"
          />
        </div>

        {/* ロゴ画像 */}
        <div className="space-y-2">
          <Label>領収書ロゴ画像</Label>
          <ImageUploader
            name="rcpt_logo_url"
            label="ロゴ画像をアップロード"
            defaultValue={rcptLogoUrl}
            onUrlChange={setRcptLogoUrl}
          />
          <p className="text-xs text-muted-foreground">領収書のヘッダーに表示されます</p>
        </div>

        {/* 印鑑画像 */}
        <div className="space-y-2">
          <Label>印鑑画像</Label>
          <p className="text-xs text-muted-foreground">
            アップロード時に白背景の透過処理と150×150pxへのリサイズが自動で行われます。
          </p>
          {rcptStampUrl ? (
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-lg border border-border" style={{ backgroundImage: "linear-gradient(45deg, #e0e0e0 25%, transparent 25%, transparent 75%, #e0e0e0 75%), linear-gradient(45deg, #e0e0e0 25%, transparent 25%, transparent 75%, #e0e0e0 75%)", backgroundSize: "16px 16px", backgroundPosition: "0 0, 8px 8px" }}>
                <img src={rcptStampUrl} alt="印鑑プレビュー" className="w-full h-full object-contain" />
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" className="rounded-lg" onClick={() => stampInputRef.current?.click()}>
                  変更
                </Button>
                <Button type="button" size="sm" variant="outline" className="rounded-lg text-destructive" onClick={() => setRcptStampUrl("")}>
                  削除
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => stampInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 w-full h-32 rounded-xl border-2 border-dashed border-border hover:border-brand-green/60 hover:bg-muted/50 cursor-pointer transition-colors"
            >
              {stampUploading ? (
                <span className="text-sm text-muted-foreground">処理・アップロード中...</span>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center">
                    <Stamp className="w-5 h-5 text-brand-green" />
                  </div>
                  <p className="text-sm text-foreground">印鑑画像をアップロード</p>
                  <p className="text-xs text-muted-foreground">PNG推奨（白背景自動透過）</p>
                </>
              )}
            </div>
          )}
          <input
            ref={stampInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              setStampUploading(true)
              try {
                const processed = await processStampImage(file)
                const stampFile = new File([processed], "stamp.png", { type: "image/png" })
                const fd = new FormData()
                fd.append("file", stampFile)
                const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error)
                setRcptStampUrl(data.url)
              } catch (err) {
                alert(err instanceof Error ? err.message : "アップロードに失敗しました")
              } finally {
                setStampUploading(false)
                if (stampInputRef.current) stampInputRef.current.value = ""
              }
            }}
          />
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={isPending}
        className="bg-brand-green hover:bg-brand-green/90 text-white gap-2"
      >
        {saved ? (
          <><Check className="w-4 h-4" />保存しました</>
        ) : (
          <><Save className="w-4 h-4" />{isPending ? "保存中..." : "設定を保存"}</>
        )}
      </Button>
    </div>
  )
}
