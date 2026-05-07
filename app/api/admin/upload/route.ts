import { type NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "ファイルが指定されていません" }, { status: 400 })
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: `許可されていないファイル形式です: ${file.type || "不明"}` }, { status: 400 })
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "ファイルサイズは5MB以下にしてください" }, { status: 400 })
    }

    const ext = file.name.split(".").pop() || "png"
    const filename = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    // Try Vercel Blob first
    try {
      const { put } = await import("@vercel/blob")
      const blob = await put(filename, file, { access: "public" })
      return NextResponse.json({ url: blob.url })
    } catch (blobError: any) {
      console.error("Vercel Blob error:", blobError?.message || blobError)

      // Fallback: convert to data URL
      const buffer = Buffer.from(await file.arrayBuffer())
      const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`
      return NextResponse.json({ url: dataUrl })
    }
  } catch (error: any) {
    console.error("Upload error:", error?.message || error)
    return NextResponse.json({ error: `アップロードに失敗しました: ${error?.message || "不明なエラー"}` }, { status: 500 })
  }
}
