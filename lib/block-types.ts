// ブロックの型定義（管理画面・公開ページ共通）
export type BlockType = "about" | "fund_usage" | "rich_text" | "image" | "divider" | "heading"

export interface FundItem {
  label: string
  percent: number
  color: string
  description?: string
}

export interface PageBlock {
  id: string
  type: BlockType
  title?: string
  content?: string   // HTML (rich_text / about) or plain text (heading)
  imageUrl?: string
  imageAlt?: string
  imageCaption?: string
  items?: FundItem[]
}
