# Recipe: SNSシェアボタン

X（Twitter）・LINE・URLコピーの3ボタンを持つシェアコンポーネント。
Next.js App Router（SSR）環境でハイドレーションエラーなく動作する実装パターン。

---

## 全体フロー

```
Server Component（page.tsx）
    ↓ title と url（NEXT_PUBLIC_BASE_URL）を props で渡す
ShareButtons（Client Component）
    ↓ SSR: url="" で初期レンダリング（サーバー・クライアント一致）
    ↓ useEffect: マウント後に window.location.href で上書き
X / LINE / URLコピー ボタンを描画
```

---

## 要点まとめ

### 1. SSR 環境では window を直接参照しない

`typeof window !== "undefined"` による分岐はハイドレーションエラーの原因になる。
サーバーとクライアントの初回レンダリングを一致させるため、`window` は必ず `useEffect` の中で参照する。

```ts
// NG — サーバーとクライアントで値が変わりハイドレーションエラーになる
const url = typeof window !== "undefined" ? window.location.href : ""

// OK — 初期値を統一し、マウント後に window を参照する
const [url, setUrl] = useState(urlProp ?? "")
useEffect(() => {
  if (!urlProp) setUrl(window.location.href)
}, [urlProp])
```

### 2. シェアURLの組み立て

| SNS | URL形式 |
|---|---|
| X（Twitter） | `https://twitter.com/intent/tweet?text={タイトル}&url={URL}` |
| LINE | `https://social-plugins.line.me/lineit/share?url={URL}` |
| Instagram | 直接シェアAPIなし → URLコピーで代替 |

タイトル・URLは必ず `encodeURIComponent()` でエンコードする。

### 3. URLコピーは navigator.clipboard を使う

```ts
await navigator.clipboard.writeText(url)
```

- `try/catch` で囲む（HTTP環境や古いブラウザでは使えない場合がある）
- コピー後に 2秒だけ「コピーしました」表示 → `setTimeout` でリセット

### 4. アイコンは SVG をインラインで定義する

X・LINEの公式ロゴは外部ライブラリ（react-icons など）に依存せず、
SVGパスをコンポーネント内に直接書くことで依存ゼロで使える。

---

## 実装コード

```tsx
"use client"

import { useState, useEffect } from "react"
import { Copy, Check } from "lucide-react"

interface Props {
  title: string   // シェア時のテキスト
  url?: string    // 省略時は window.location.href を使用
}

export default function ShareButtons({ title, url: urlProp }: Props) {
  const [copied, setCopied] = useState(false)
  const [url, setUrl] = useState(urlProp ?? "")

  // SSR/CSR 不一致を防ぐため useEffect 内で window を参照
  useEffect(() => {
    if (!urlProp) setUrl(window.location.href)
  }, [urlProp])

  const encodedUrl   = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const xUrl    = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`
  const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-5 mb-6">
      <p className="text-sm font-bold text-foreground mb-3">シェアして広める</p>
      <div className="flex flex-wrap gap-2">

        {/* X（Twitter） */}
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold bg-black text-white hover:bg-black/80 transition-colors"
        >
          <XIcon />
          X でシェア
        </a>

        {/* LINE */}
        <a
          href={lineUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold bg-[#06C755] text-white hover:bg-[#06C755]/80 transition-colors"
        >
          <LineIcon />
          LINE で送る
        </a>

        {/* URLコピー */}
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold bg-muted text-foreground hover:bg-muted/70 transition-colors"
        >
          {copied ? (
            <><Check className="w-4 h-4 text-green-600" />コピーしました</>
          ) : (
            <><Copy className="w-4 h-4" />URLをコピー</>
          )}
        </button>
      </div>
    </div>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function LineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.629 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  )
}
```

---

## 呼び出し側（Server Component）

```tsx
// NEXT_PUBLIC_BASE_URL を渡すことでSSR時も正しいURLが入る
// 未設定なら useEffect で window.location.href にフォールバック
import ShareButtons from "@/components/campaign/ShareButtons"

<ShareButtons
  title={campaign.title}
  url={process.env.NEXT_PUBLIC_BASE_URL ?? ""}
/>
```

---

## 転用プロンプト

新しいアプリにこのパターンを組み込む際は、以下をそのままAIに渡してください。

```
以下の仕様でSNSシェアボタンコンポーネントを実装してください。

【使用技術】
- Next.js App Router（"use client" Client Component）
- Tailwind CSS
- lucide-react（Copy・Check アイコン）

【ボタン構成】
- X（Twitter）: twitter.com/intent/tweet にタイトル＋URLを付けて新しいタブで開く
- LINE: social-plugins.line.me/lineit/share にURLを付けて新しいタブで開く
- URLコピー: navigator.clipboard.writeText でコピー → 2秒間「コピーしました」表示

【SSRハイドレーション対策】
- props で url を受け取る（省略可能）
- useState の初期値は urlProp ?? "" に統一（サーバー・クライアントで一致させる）
- window.location.href は useEffect 内でのみ参照し、urlProp が空の場合に setUrl で更新する
- typeof window !== "undefined" による分岐は使わない

【アイコン】
- X・LINEのロゴは外部ライブラリ不要のインラインSVGで実装する

【スタイル】
- X: 黒背景・白テキスト・rounded-full
- LINE: #06C755 背景・白テキスト・rounded-full
- URLコピー: ミュート背景・rounded-full

配置場所: {コンポーネント名や場所を記述}
シェアするタイトル: {タイトルの取得方法を記述}
```

---

## 注意点

- `encodeURIComponent()` を忘れると日本語タイトルがURLで壊れる
- `navigator.clipboard` は HTTPS または localhost でのみ動作する（HTTP本番環境では使えない）
- Instagram にはWeb用のシェアURLが存在しないためURLコピーで代替するのが一般的
- `target="_blank"` には必ず `rel="noopener noreferrer"` をセットする（セキュリティ対策）
