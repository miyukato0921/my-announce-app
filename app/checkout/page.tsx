import { Suspense } from "react"
import sql from "@/lib/db"
import type { Campaign, RewardTier } from "@/lib/db"
import CheckoutForm from "@/components/checkout/CheckoutForm"
import CampaignHeader from "@/components/campaign/CampaignHeader"
import CheckoutPageClient from "@/components/checkout/CheckoutPageClient"
import { formatYen } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface SearchParams {
  campaign_id?: string
  reward_id?: string
  amount?: string
  custom?: string
}

async function getData(params: SearchParams) {
  const campaignId = params.campaign_id ? parseInt(params.campaign_id) : null
  const rewardId = params.reward_id ? parseInt(params.reward_id) : null

  if (!campaignId) return { campaign: null, reward: null }

  const campaigns = await sql<Campaign[]>`SELECT * FROM campaigns WHERE id = ${campaignId} LIMIT 1`
  const campaign = campaigns[0] ?? null

  let reward: RewardTier | null = null
  if (rewardId) {
    const rewards = await sql<RewardTier[]>`SELECT * FROM reward_tiers WHERE id = ${rewardId} LIMIT 1`
    reward = rewards[0] ?? null
  }

  return { campaign, reward }
}

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const { campaign, reward } = await getData(params)
  const isCustom = params.custom === "true"
  const defaultAmount = params.amount ? parseInt(params.amount) : (isCustom ? 1000 : null)

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background">
        <CampaignHeader />
        <CheckoutPageClient type="no_campaign" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <CampaignHeader />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <CheckoutPageClient
          type="checkout"
          campaign={campaign}
          reward={reward}
          isCustom={isCustom}
          defaultAmount={defaultAmount}
        />
      </main>
    </div>
  )
}
