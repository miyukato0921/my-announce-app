import { notFound } from "next/navigation"
import sql from "@/lib/db"
import type { Campaign } from "@/lib/db"
import { formatYen, calcProgress, calcDaysLeft } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, TrendingUp, Users, Clock, Target, Gift, CheckCircle2, AlertCircle } from "lucide-react"
import AdminFundingChart from "@/components/admin/AdminFundingChart"

export default async function CampaignStatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rows = await sql<Campaign[]>`SELECT * FROM campaigns WHERE id = ${Number(id)} LIMIT 1`
  const campaign = rows[0]
  if (!campaign) notFound()

  const pledgeStats = await sql`
    SELECT
      COUNT(*) FILTER (WHERE payment_status = 'completed') as completed_count,
      COUNT(*) FILTER (WHERE payment_status = 'pending') as pending_count,
      COUNT(*) FILTER (WHERE payment_status = 'failed') as failed_count,
      COALESCE(SUM(amount) FILTER (WHERE payment_status = 'completed'), 0) as total_revenue,
      COALESCE(AVG(amount) FILTER (WHERE payment_status = 'completed'), 0) as avg_amount
    FROM pledges WHERE campaign_id = ${campaign.id}
  `
  const s = pledgeStats[0] as any

  const rewardBreakdown = await sql`
    SELECT rt.title, rt.amount, rt.claimed_count, rt.limit_count,
      COUNT(p.id) FILTER (WHERE p.payment_status = 'completed') as pledge_count,
      COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status = 'completed'), 0) as tier_revenue
    FROM reward_tiers rt
    LEFT JOIN pledges p ON p.reward_tier_id = rt.id AND p.campaign_id = ${campaign.id}
    WHERE rt.campaign_id = ${campaign.id}
    GROUP BY rt.id, rt.title, rt.amount, rt.claimed_count, rt.limit_count
    ORDER BY rt.sort_order
  `

  const dailyStats = await sql`
    SELECT
      DATE(created_at) as date,
      COALESCE(SUM(amount) FILTER (WHERE payment_status = 'completed'), 0) as daily_amount,
      COUNT(*) FILTER (WHERE payment_status = 'completed') as daily_count
    FROM pledges
    WHERE campaign_id = ${campaign.id} AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `

  const actualRevenue = Number(s?.total_revenue ?? 0)
  const actualCount = Number(s?.completed_count ?? 0)
  const progress = calcProgress(actualRevenue, campaign.goal_amount)
  const daysLeft = calcDaysLeft(campaign.end_date)

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="sm" className="rounded-xl" asChild>
          <Link href="/admin/campaigns">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            戻る
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black text-foreground">キャンペーン統計</h1>
          <p className="text-muted-foreground mt-0.5 line-clamp-1">{campaign.title}</p>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "総支援額", value: formatYen(actualRevenue), icon: TrendingUp, color: "text-brand-green", bg: "bg-brand-green/10", sub: `目標の${progress}%` },
          { label: "支援者数", value: `${actualCount}人`, icon: Users, color: "text-blue-500", bg: "bg-blue-50", sub: `平均 ${formatYen(Math.round(Number(s?.avg_amount ?? 0)))}` },
          { label: "残り日数", value: `${daysLeft}日`, icon: Clock, color: "text-orange-500", bg: "bg-orange-50", sub: "キャンペーン終了まで" },
          { label: "達成率", value: `${progress}%`, icon: Target, color: "text-purple-500", bg: "bg-purple-50", sub: `目標 ${formatYen(campaign.goal_amount)}` },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-2xl border border-border p-5">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-black text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            <p className="text-xs text-muted-foreground">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="bg-card rounded-2xl border border-border p-6 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-foreground flex items-center gap-2"><Target className="w-5 h-5 text-brand-green" />目標達成状況</h2>
          <span className="text-sm font-bold text-brand-green">{progress}%</span>
        </div>
        <div className="h-4 bg-muted rounded-full overflow-hidden mb-2">
          <div className="h-full rounded-full" style={{ width: `${progress}%`, background: "linear-gradient(90deg, oklch(0.42 0.15 152), oklch(0.55 0.16 152))" }} />
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{formatYen(actualRevenue)} 集まっています</span>
          <span>目標 {formatYen(campaign.goal_amount)}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card rounded-2xl border border-border p-6 mb-6">
        <h2 className="font-bold text-foreground mb-4">直近30日間の支援推移</h2>
        <AdminFundingChart data={dailyStats as any[]} />
      </div>

      {/* Payment status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-bold text-foreground mb-4">決済ステータス</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /><span className="text-sm font-medium text-green-800">完了</span></div>
              <span className="font-bold text-green-700">{s?.completed_count ?? 0}件</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
              <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-yellow-600" /><span className="text-sm font-medium text-yellow-800">保留中</span></div>
              <span className="font-bold text-yellow-700">{s?.pending_count ?? 0}件</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
              <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-500" /><span className="text-sm font-medium text-red-700">失敗</span></div>
              <span className="font-bold text-red-600">{s?.failed_count ?? 0}件</span>
            </div>
          </div>
        </div>

        {/* Reward breakdown */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2"><Gift className="w-5 h-5 text-brand-green" />リターン別支援状況</h2>
          <div className="space-y-3">
            {(rewardBreakdown as any[]).map((r) => (
              <div key={r.title} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="min-w-0 flex-1 mr-3">
                  <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{formatYen(r.amount)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-brand-green">{r.pledge_count}人</p>
                  <p className="text-xs text-muted-foreground">{formatYen(Number(r.tier_revenue))}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
