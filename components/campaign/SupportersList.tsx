import { formatYen } from "@/lib/utils"
import { Heart } from "lucide-react"

interface Supporter {
  supporter_name: string | null
  amount: number
  message: string | null
  is_anonymous: boolean
  created_at: string
}

interface Props {
  supporters: Supporter[]
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`
}

export default function SupportersList({ supporters }: Props) {
  if (supporters.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 text-center">
        <Heart className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-muted-foreground">まだ支援者はいません</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h2 className="text-xl font-bold text-foreground mb-5 pb-4 border-b border-border flex items-center gap-2">
        <Heart className="w-5 h-5 text-brand-gold fill-brand-gold" />
        支援者一覧
      </h2>
      <div className="space-y-4">
        {supporters.map((s, i) => (
          <div key={i} className="flex gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${s.is_anonymous ? "bg-muted text-muted-foreground" : "bg-brand-green/20 text-brand-green"}`}>
              {s.is_anonymous ? "?" : (s.supporter_name?.charAt(0) ?? "?")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <span className={`font-bold text-sm ${s.is_anonymous ? "text-muted-foreground italic" : "text-foreground"}`}>
                  {s.is_anonymous ? "匿名" : (s.supporter_name ?? "匿名")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(s.created_at)}
                </span>
              </div>
              <span className="text-brand-green font-bold text-sm">{formatYen(s.amount)}</span>
              {s.message && (
                <p className="text-sm text-foreground/70 mt-1 leading-relaxed">{s.message}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
