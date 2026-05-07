"use client"

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

interface Props {
  data: { date: string; daily_amount: number; daily_count: number }[]
}

export default function AdminFundingChart({ data }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    label: format(new Date(d.date), "M/d", { locale: ja }),
    amount: Number(d.daily_amount),
  }))

  if (formatted.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
        データがありません
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={formatted} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="oklch(0.42 0.15 152)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="oklch(0.42 0.15 152)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`}
          width={48}
        />
        <Tooltip
          formatter={(value: number) => [`¥${value.toLocaleString("ja-JP")}`, "支援額"]}
          labelStyle={{ fontSize: 12 }}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="oklch(0.42 0.15 152)"
          strokeWidth={2}
          fill="url(#colorAmount)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
