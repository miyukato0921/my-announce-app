import { formatYen } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

interface Pledge {
  id: number
  supporter_name: string | null
  supporter_email: string | null
  amount: number
  payment_status: string
  reward_title: string | null
  is_anonymous: boolean
  created_at: string
}

interface Props {
  pledges: Pledge[]
}

const statusConfig: Record<string, { label: string; className: string }> = {
  completed: { label: "完了", className: "bg-green-100 text-green-800 border-green-200" },
  pending: { label: "保留中", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  failed: { label: "失敗", className: "bg-red-100 text-red-800 border-red-200" },
  refunded: { label: "返金済", className: "bg-gray-100 text-gray-700 border-gray-200" },
}

export default function AdminRecentPledges({ pledges }: Props) {
  if (pledges.length === 0) {
    return <p className="text-muted-foreground text-sm text-center py-6">支援データがありません。</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">支援者</th>
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">リターン</th>
            <th className="text-right py-2 px-3 text-muted-foreground font-medium">金額</th>
            <th className="text-center py-2 px-3 text-muted-foreground font-medium">ステータス</th>
            <th className="text-right py-2 px-3 text-muted-foreground font-medium">日時</th>
          </tr>
        </thead>
        <tbody>
          {pledges.map((pledge) => {
            const status = statusConfig[pledge.payment_status] ?? { label: pledge.payment_status, className: "bg-gray-100" }
            return (
              <tr key={pledge.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-3 px-3">
                  <p className="font-medium text-foreground">
                    {pledge.is_anonymous ? "匿名" : (pledge.supporter_name || "未設定")}
                  </p>
                  <p className="text-xs text-muted-foreground">{pledge.supporter_email}</p>
                </td>
                <td className="py-3 px-3 text-muted-foreground">
                  {pledge.reward_title ?? "応援支援"}
                </td>
                <td className="py-3 px-3 text-right font-bold text-brand-green">
                  {formatYen(pledge.amount)}
                </td>
                <td className="py-3 px-3 text-center">
                  <Badge className={`text-xs border ${status.className}`}>
                    {status.label}
                  </Badge>
                </td>
                <td className="py-3 px-3 text-right text-xs text-muted-foreground">
                  {format(new Date(pledge.created_at), "M/d HH:mm", { locale: ja })}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
