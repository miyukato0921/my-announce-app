import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/auth"
import { translateTexts } from "@/lib/translate"

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { texts } = await req.json()
  const entries = Object.entries(texts as Record<string, string>).filter(([, v]) => v?.trim())
  if (entries.length === 0) return NextResponse.json({ translations: {} })

  try {
    const translations = await translateTexts(texts)
    return NextResponse.json({ translations })
  } catch (err) {
    console.error("[admin/translate] Error:", err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: "Translation failed", detail: message }, { status: 500 })
  }
}
