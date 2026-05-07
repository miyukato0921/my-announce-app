"use client"

import { useState } from "react"
import { Heart } from "lucide-react"

export default function HeartButton({ id, initialLikes }: { id: string; initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes)
  const [liked, setLiked] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (liked || loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/announcements/${id}/like`, { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setLikes(data.likes)
        setLiked(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={liked || loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all
        ${liked
          ? "bg-red-100 text-red-500 cursor-default"
          : "bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-400 active:scale-95"
        }`}
    >
      <Heart className={`w-4 h-4 transition-all ${liked ? "fill-red-500 text-red-500" : ""}`} />
      {likes}
    </button>
  )
}
