# Form Recipe

`AdminLoginForm.tsx` のパターンをベースにした汎用フォームテンプレート。

---

## 基本テンプレート

```tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

export default function ExampleForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // フィールドごとに useState を追加
  const [fieldA, setFieldA] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null) // 再送信時にエラーをリセット

    try {
      const res = await fetch("/api/example", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldA }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "送信に失敗しました。")

      // 成功時の処理（リダイレクト、状態更新など）
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました。")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* フィールド */}
      <div>
        <Label htmlFor="fieldA" className="text-sm font-medium">ラベル</Label>
        <Input
          id="fieldA"
          type="text"
          required
          value={fieldA}
          onChange={(e) => setFieldA(e.target.value)}
          placeholder="入力してください"
          className="mt-1"
        />
      </div>

      {/* エラー表示 — error が null のときは何も表示しない */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          {error}
        </div>
      )}

      {/* 送信ボタン — loading 中は disabled + スピナー */}
      <Button
        type="submit"
        className="w-full bg-brand-dark hover:bg-brand-dark/90 text-white font-bold rounded-xl py-5"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            送信中...
          </>
        ) : (
          "送信"
        )}
      </Button>
    </form>
  )
}
```

---

## パターン集

### パスワード表示トグル

```tsx
import { Eye, EyeOff } from "lucide-react"

const [showPassword, setShowPassword] = useState(false)

// JSX
<div className="relative mt-1">
  <Input
    id="password"
    type={showPassword ? "text" : "password"}
    required
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    placeholder="パスワード"
    className="pr-10"
    autoComplete="current-password"
  />
  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
  >
    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
  </button>
</div>
```

### 成功メッセージ表示

```tsx
const [success, setSuccess] = useState<string | null>(null)

// handleSubmit の成功時
setSuccess("保存しました。")

// JSX
{success && (
  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-700 dark:text-green-400">
    {success}
  </div>
)}
```

### フォームリセット

```tsx
// 送信成功後にフィールドをクリア
setFieldA("")
setError(null)
setSuccess(null)
```

### textarea フィールド

```tsx
import { Textarea } from "@/components/ui/textarea"

const [body, setBody] = useState("")

// JSX
<div>
  <Label htmlFor="body" className="text-sm font-medium">本文</Label>
  <Textarea
    id="body"
    value={body}
    onChange={(e) => setBody(e.target.value)}
    placeholder="内容を入力してください"
    className="mt-1"
    rows={4}
  />
</div>
```

---

## 規則

- `"use client"` は必須（useState / イベントハンドラを使うため）
- `setError(null)` は必ず `handleSubmit` の先頭で呼ぶ（再送信時にエラーをリセット）
- API エラーは `data.error` を優先し、フォールバックメッセージを必ず用意する
- `loading` 中はボタンを `disabled` にして二重送信を防ぐ
- React Hook Form / Zod はチェックアウトや複雑なフォームで使用（このテンプレートは軽量な管理フォーム向け）
