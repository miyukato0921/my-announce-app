"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import RichTextEditor from "@/components/admin/RichTextEditor"
import {
  GripVertical, Plus, Trash2, ChevronUp, ChevronDown,
  FileText, PieChart, Image as ImageIcon, Type, Minus, LayoutGrid
} from "lucide-react"
import Image from "next/image"

// 型定義は lib/block-types.ts に定義（管理画面・公開ページ共通）
export type { BlockType, FundItem, PageBlock } from "@/lib/block-types"
import type { BlockType, FundItem, PageBlock } from "@/lib/block-types"

const BLOCK_TYPES: { type: BlockType; label: string; icon: React.FC<{ className?: string }>; desc: string }[] = [
  { type: "about", label: "プロジェクト説明", icon: FileText, desc: "リッチテキストで詳細説明" },
  { type: "fund_usage", label: "資金の使い道", icon: PieChart, desc: "円グラフ＋内訳リスト" },
  { type: "rich_text", label: "カスタムテキスト", icon: Type, desc: "自由なリッチテキストブロック" },
  { type: "image", label: "画像", icon: ImageIcon, desc: "画像＋キャプション" },
  { type: "heading", label: "見出し", icon: LayoutGrid, desc: "セクション見出し" },
  { type: "divider", label: "区切り線", icon: Minus, desc: "セクション区切り" },
]

const FUND_COLORS = [
  "#2D6A4F", "#40916C", "#74C69D", "#B7E4C7",
  "#D4A017", "#F4A261", "#E76F51", "#264653",
]

const uid = () => Math.random().toString(36).slice(2, 9)

// ブロックコンテンツ編集エリア
function BlockContent({
  block,
  onChange,
  onImageUpload,
}: {
  block: PageBlock
  onChange: (updated: Partial<PageBlock>) => void
  onImageUpload: (file: File) => Promise<string>
}) {
  if (block.type === "divider") {
    return <p className="text-xs text-muted-foreground px-2 py-1">区切り線（編集不要）</p>
  }

  if (block.type === "heading") {
    return (
      <div className="space-y-2 p-3">
        <Label className="text-xs font-bold">見出しテキスト</Label>
        <Input
          value={block.content ?? ""}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="セクション見出し"
          className="font-bold text-base"
        />
      </div>
    )
  }

  if (block.type === "image") {
    return (
      <div className="space-y-3 p-3">
        <div className="space-y-2">
          <Label className="text-xs font-bold">画像URL</Label>
          <div className="flex gap-2">
            <Input
              value={block.imageUrl ?? ""}
              onChange={(e) => onChange({ imageUrl: e.target.value })}
              placeholder="https://..."
              className="text-sm font-mono"
            />
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const url = await onImageUpload(file)
                  onChange({ imageUrl: url })
                }}
              />
              <div className="h-9 px-3 flex items-center rounded-md border border-input bg-muted text-xs font-bold hover:bg-accent cursor-pointer">
                アップロード
              </div>
            </label>
          </div>
          {block.imageUrl && (
            <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border">
              <Image src={block.imageUrl} alt={block.imageAlt ?? ""} fill className="object-cover" unoptimized />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold">alt テキスト</Label>
          <Input value={block.imageAlt ?? ""} onChange={(e) => onChange({ imageAlt: e.target.value })} placeholder="画像の説明" className="text-sm" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold">キャプション（任意）</Label>
          <Input value={block.imageCaption ?? ""} onChange={(e) => onChange({ imageCaption: e.target.value })} placeholder="画像のキャプション" className="text-sm" />
        </div>
      </div>
    )
  }

  if (block.type === "fund_usage") {
    const items: FundItem[] = block.items ?? []
    const total = items.reduce((s, i) => s + (i.percent || 0), 0)

    const updateItem = (idx: number, patch: Partial<FundItem>) => {
      const next = items.map((it, i) => i === idx ? { ...it, ...patch } : it)
      onChange({ items: next })
    }
    const addItem = () => onChange({
      items: [...items, { label: "", percent: 0, color: FUND_COLORS[items.length % FUND_COLORS.length], description: "" }]
    })
    const removeItem = (idx: number) => onChange({ items: items.filter((_, i) => i !== idx) })

    return (
      <div className="p-3 space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold">資金内訳</Label>
          <span className={`text-xs font-bold ${total !== 100 ? "text-amber-500" : "text-brand-green"}`}>
            合計: {total}% {total !== 100 && "（100%にしてください）"}
          </span>
        </div>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-muted/40 rounded-xl p-2">
              <input
                type="color"
                value={item.color}
                onChange={(e) => updateItem(idx, { color: e.target.value })}
                className="w-8 h-8 rounded-lg border-0 cursor-pointer p-0.5 bg-transparent"
              />
              <Input
                value={item.label}
                onChange={(e) => updateItem(idx, { label: e.target.value })}
                placeholder="項目名（例：会場費）"
                className="flex-1 h-8 text-sm"
              />
              <Input
                type="number"
                value={item.percent}
                onChange={(e) => updateItem(idx, { percent: Number(e.target.value) })}
                className="w-20 h-8 text-sm text-center"
                min={0}
                max={100}
              />
              <span className="text-xs text-muted-foreground w-4">%</span>
              <Input
                value={item.description ?? ""}
                onChange={(e) => updateItem(idx, { description: e.target.value })}
                placeholder="説明（任意）"
                className="flex-1 h-8 text-sm"
              />
              <button type="button" onClick={() => removeItem(idx)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addItem} className="w-full rounded-xl border-dashed">
          <Plus className="w-4 h-4 mr-1.5" />項目を追加
        </Button>
      </div>
    )
  }

  // about / rich_text
  return (
    <div className="p-3 space-y-2">
      <Label className="text-xs font-bold">
        {block.type === "about" ? "プロジェクト説明（公開ページの About に表示）" : "テキスト内容"}
      </Label>
      <RichTextEditor
        value={block.content ?? ""}
        onChange={(html) => onChange({ content: html })}
        placeholder={block.type === "about" ? "プロジェクトの詳細な説明を入力..." : "テキストを入力..."}
        onImageUpload={onImageUpload}
      />
    </div>
  )
}

// ブロック1つのカード
function BlockCard({
  block,
  index,
  total,
  onMove,
  onDelete,
  onChange,
  onImageUpload,
}: {
  block: PageBlock
  index: number
  total: number
  onMove: (dir: -1 | 1) => void
  onDelete: () => void
  onChange: (patch: Partial<PageBlock>) => void
  onImageUpload: (file: File) => Promise<string>
}) {
  const [collapsed, setCollapsed] = useState(false)
  const meta = BLOCK_TYPES.find(b => b.type === block.type)
  const Icon = meta?.icon ?? FileText

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
        <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0" />
        <Icon className="w-4 h-4 text-brand-green shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">{meta?.label}</span>
            <span className="text-xs text-muted-foreground">#{index + 1}</span>
          </div>
          {block.title && <p className="text-xs text-muted-foreground truncate">{block.title}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* タイトル入力 */}
          {(block.type === "about" || block.type === "rich_text" || block.type === "fund_usage") && (
            <Input
              value={block.title ?? ""}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="セクションタイトル（任意）"
              className="h-7 w-44 text-xs"
            />
          )}
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0}
            className="p-1 rounded hover:bg-accent disabled:opacity-30">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1}
            className="p-1 rounded hover:bg-accent disabled:opacity-30">
            <ChevronDown className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => setCollapsed(v => !v)}
            className="p-1 rounded hover:bg-accent text-xs font-bold text-muted-foreground w-12">
            {collapsed ? "展開" : "折畳"}
          </button>
          <button type="button" onClick={onDelete}
            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {!collapsed && (
        <BlockContent block={block} onChange={onChange} onImageUpload={onImageUpload} />
      )}
    </div>
  )
}

// メインのBlockEditor
interface BlockEditorProps {
  initialBlocks: PageBlock[]
  onChange: (blocks: PageBlock[]) => void
  onImageUpload: (file: File) => Promise<string>
}

export default function BlockEditor({ initialBlocks, onChange, onImageUpload }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<PageBlock[]>(initialBlocks)
  const [showAddMenu, setShowAddMenu] = useState(false)

  const update = (newBlocks: PageBlock[]) => {
    setBlocks(newBlocks)
    onChange(newBlocks)
  }

  const addBlock = (type: BlockType) => {
    const defaults: Partial<PageBlock> = {}
    if (type === "fund_usage") {
      defaults.items = [
        { label: "会場・運営費", percent: 40, color: "#2D6A4F", description: "会場費・設営費など" },
        { label: "出演者報酬", percent: 30, color: "#40916C", description: "アーティスト・演者報酬" },
        { label: "宣伝・広報費", percent: 20, color: "#74C69D", description: "SNS・チラシ制作" },
        { label: "予備費", percent: 10, color: "#D4A017", description: "緊急対応費など" },
      ]
    }
    const newBlock: PageBlock = { id: uid(), type, ...defaults }
    update([...blocks, newBlock])
    setShowAddMenu(false)
  }

  const moveBlock = (idx: number, dir: -1 | 1) => {
    const arr = [...blocks]
    const target = idx + dir
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]]
    update(arr)
  }

  const deleteBlock = (idx: number) => {
    if (!confirm("このブロックを削除しますか？")) return
    update(blocks.filter((_, i) => i !== idx))
  }

  const patchBlock = (idx: number, patch: Partial<PageBlock>) => {
    const arr = blocks.map((b, i) => i === idx ? { ...b, ...patch } : b)
    update(arr)
  }

  return (
    <div className="space-y-3">
      {blocks.length === 0 && (
        <div className="border-2 border-dashed border-border rounded-2xl p-10 text-center text-muted-foreground text-sm">
          ブロックを追加してページレイアウトを構成してください
        </div>
      )}

      {blocks.map((block, idx) => (
        <BlockCard
          key={block.id}
          block={block}
          index={idx}
          total={blocks.length}
          onMove={(dir) => moveBlock(idx, dir)}
          onDelete={() => deleteBlock(idx)}
          onChange={(patch) => patchBlock(idx, patch)}
          onImageUpload={onImageUpload}
        />
      ))}

      {/* ブロック追加 */}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowAddMenu(v => !v)}
          className="w-full rounded-2xl border-dashed border-2 h-12 text-muted-foreground hover:text-foreground hover:border-brand-green hover:text-brand-green transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          ブロックを追加
        </Button>

        {showAddMenu && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-2xl shadow-xl p-3 z-50 grid grid-cols-2 gap-2">
            {BLOCK_TYPES.map(({ type, label, icon: Icon, desc }) => (
              <button
                key={type}
                type="button"
                onClick={() => addBlock(type)}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted text-left transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-green/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-brand-green" />
                </div>
                <div>
                  <p className="text-sm font-bold">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
