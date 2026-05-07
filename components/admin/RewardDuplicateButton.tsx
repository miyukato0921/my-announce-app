"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Copy, Loader2 } from "lucide-react"

export default function RewardDuplicateButton({ id }: { id: number }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDuplicate = async () => {
    if (!confirm("このリターンを複製しますか？")) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/rewards/${id}/duplicate`, { method: "POST" })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      alert("複製に失敗しました。")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-xl text-muted-foreground hover:text-brand-green"
      onClick={handleDuplicate}
      disabled={loading}
      title="複製する"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
    </Button>
  )
}
