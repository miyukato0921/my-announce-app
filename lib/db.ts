import { neon, type NeonQueryFunction } from "@neondatabase/serverless"

let sql: NeonQueryFunction<false, false> | null = null

export function getDb(): NeonQueryFunction<false, false> {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set")
    }
    sql = neon(process.env.DATABASE_URL)
  }
  return sql
}

// For backward compatibility - creates a proxy that lazily initializes
const handler: ProxyHandler<object> = {
  apply(_target, _thisArg, args) {
    return getDb()(...args as [TemplateStringsArray, ...unknown[]])
  },
  get(_target, prop) {
    return Reflect.get(getDb(), prop)
  }
}

const sqlProxy = new Proxy(function() {} as unknown as NeonQueryFunction<false, false>, handler)

export default sqlProxy

export type Campaign = {
  id: number
  title: string
  description: string
  short_description: string
  goal_amount: number
  current_amount: number
  start_date: string
  end_date: string
  status: string
  hero_image_url: string
  supporter_count: number
  created_at: string
  updated_at: string
  // マイグレーションで追加されたカラム
  page_blocks: unknown
  description_html: string | null
  fund_usage_html: string | null
  event_date: string | null
  event_venue: string | null
  title_en: string | null
  title_ko: string | null
  title_zh: string | null
  short_description_en: string | null
  short_description_ko: string | null
  short_description_zh: string | null
}

export type RewardTier = {
  id: number
  campaign_id: number
  title: string
  description: string
  amount: number
  limit_count: number | null
  claimed_count: number
  image_url: string
  delivery_date: string
  sort_order: number
  is_active: boolean
}

export type Pledge = {
  id: number
  campaign_id: number
  reward_tier_id: number | null
  supporter_name: string | null
  supporter_email: string | null
  amount: number
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  payment_status: string
  message: string | null
  is_anonymous: boolean
  created_at: string
}

export type AdminUser = {
  id: number
  email: string
  name: string
  role: string
  created_at: string
}

export type Product = {
  id: number
  name: string
  description: string | null
  price: number
  stock_count: number | null
  image_url: string | null
  category: string | null
  stripe_price_id: string | null
  is_active: boolean
  created_at: string
}

export type Announcement = {
  id: string
  title: string
  body: string | null
  published: boolean
  created_at: string
  updated_at: string
}
