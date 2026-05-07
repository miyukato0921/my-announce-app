"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Bold, Italic, Underline, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Image as ImageIcon, Link as LinkIcon,
  AlignLeft, AlignCenter, AlignRight, Minus, Code, Eye, Edit3, Type
} from "lucide-react"

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  onImageUpload?: (file: File) => Promise<string>
}

const TOOLBAR_GROUPS = [
  [
    { cmd: "formatBlock", value: "h1", label: "H1", icon: Heading1, title: "見出し1" },
    { cmd: "formatBlock", value: "h2", label: "H2", icon: Heading2, title: "見出し2" },
    { cmd: "formatBlock", value: "h3", label: "H3", icon: Heading3, title: "見出し3" },
    { cmd: "formatBlock", value: "p", label: "P", icon: Type, title: "本文" },
  ],
  [
    { cmd: "bold", icon: Bold, title: "太字 (Ctrl+B)" },
    { cmd: "italic", icon: Italic, title: "斜体 (Ctrl+I)" },
    { cmd: "underline", icon: Underline, title: "下線 (Ctrl+U)" },
    { cmd: "strikeThrough", icon: Minus, title: "取り消し線" },
    { cmd: "removeFormat", icon: Code, title: "書式をクリア" },
  ],
  [
    { cmd: "justifyLeft", icon: AlignLeft, title: "左揃え" },
    { cmd: "justifyCenter", icon: AlignCenter, title: "中央揃え" },
    { cmd: "justifyRight", icon: AlignRight, title: "右揃え" },
  ],
  [
    { cmd: "insertUnorderedList", icon: List, title: "箇条書き" },
    { cmd: "insertOrderedList", icon: ListOrdered, title: "番号リスト" },
    { cmd: "formatBlock", value: "blockquote", icon: Quote, title: "引用" },
  ],
]

export default function RichTextEditor({ value, onChange, placeholder, onImageUpload }: Props) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<"rich" | "plain">("rich")
  const [plainText, setPlainText] = useState("")
  const isInitialized = useRef(false)

  // 初期値セット（一度だけ）
  useEffect(() => {
    if (!isInitialized.current && editorRef.current) {
      editorRef.current.innerHTML = value || ""
      isInitialized.current = true
    }
  }, [value])

  const exec = useCallback((cmd: string, val?: string) => {
    document.execCommand(cmd, false, val)
    editorRef.current?.focus()
  }, [])

  const handleInput = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? ""
    onChange(html)
  }, [onChange])

  const handleLinkInsert = () => {
    const url = prompt("URLを入力してください:", "https://")
    if (url) exec("createLink", url)
  }

  const handleImageInsert = async () => {
    if (!onImageUpload) {
      const url = prompt("画像URLを入力してください:", "https://")
      if (url) exec("insertImage", url)
      return
    }
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const url = await onImageUpload(file)
      exec("insertImage", url)
    }
    input.click()
  }

  const switchToPlain = () => {
    const html = editorRef.current?.innerHTML ?? ""
    // HTML → プレーンテキスト変換
    const div = document.createElement("div")
    div.innerHTML = html
    setPlainText(div.innerText)
    setMode("plain")
  }

  const switchToRich = () => {
    // プレーンテキスト → HTML（改行をpタグに）
    const html = plainText
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`)
      .join("")
    if (editorRef.current) {
      editorRef.current.innerHTML = html
      onChange(html)
    }
    setMode("rich")
  }

  return (
    <div className="border border-input rounded-xl overflow-hidden bg-background">
      {/* ツールバー */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-input bg-muted/40">
        {mode === "rich" && (
          <>
            {TOOLBAR_GROUPS.map((group, gi) => (
              <div key={gi} className="flex items-center gap-0.5 pr-2 border-r border-border last:border-0">
                {group.map((btn) => {
                  const Icon = btn.icon
                  return (
                    <button
                      key={btn.cmd + (btn.value ?? "")}
                      type="button"
                      title={btn.title}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        exec(btn.cmd, (btn as any).value)
                      }}
                      className="p-1.5 rounded hover:bg-background hover:shadow-sm transition-colors text-foreground/70 hover:text-foreground"
                    >
                      {(btn as any).label
                        ? <span className="text-xs font-black w-5 h-5 flex items-center justify-center">{(btn as any).label}</span>
                        : <Icon className="w-4 h-4" />
                      }
                    </button>
                  )
                })}
              </div>
            ))}

            <div className="flex items-center gap-0.5 pr-2 border-r border-border">
              <button type="button" title="リンク挿入" onMouseDown={(e) => { e.preventDefault(); handleLinkInsert() }}
                className="p-1.5 rounded hover:bg-background hover:shadow-sm transition-colors text-foreground/70 hover:text-foreground">
                <LinkIcon className="w-4 h-4" />
              </button>
              <button type="button" title="画像挿入" onMouseDown={(e) => { e.preventDefault(); handleImageInsert() }}
                className="p-1.5 rounded hover:bg-background hover:shadow-sm transition-colors text-foreground/70 hover:text-foreground">
                <ImageIcon className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* モード切り替え */}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={mode === "rich" ? switchToPlain : switchToRich}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
              mode === "plain"
                ? "bg-brand-green text-white"
                : "bg-background border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {mode === "rich" ? <><Edit3 className="w-3 h-3" />プレーンテキスト</> : <><Eye className="w-3 h-3" />リッチテキスト</>}
          </button>
        </div>
      </div>

      {/* エディタ本体 */}
      {mode === "rich" ? (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          className="min-h-[200px] p-4 text-sm leading-relaxed outline-none prose prose-sm max-w-none
            [&_h1]:text-2xl [&_h1]:font-black [&_h1]:mb-3 [&_h1]:mt-4
            [&_h2]:text-xl [&_h2]:font-black [&_h2]:mb-2 [&_h2]:mt-4
            [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-3
            [&_p]:mb-3 [&_p]:leading-relaxed
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3
            [&_blockquote]:border-l-4 [&_blockquote]:border-brand-green [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
            [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-3
            [&_a]:text-brand-green [&_a]:underline
            [&_strong]:font-bold [&_em]:italic"
          data-placeholder={placeholder ?? "内容を入力してください..."}
          style={{ "--placeholder": `"${placeholder ?? "内容を入力してください..."}"` } as React.CSSProperties}
        />
      ) : (
        <textarea
          value={plainText}
          onChange={(e) => setPlainText(e.target.value)}
          rows={10}
          placeholder={placeholder}
          className="w-full p-4 text-sm leading-relaxed outline-none resize-y bg-background font-mono"
        />
      )}

      {/* placeholder用CSS */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}
