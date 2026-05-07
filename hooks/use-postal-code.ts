import { useState, useCallback } from "react"

interface PostalResult {
  prefecture: string   // 都道府県
  city: string         // 市区町村
  town: string         // 住所（町名以降）
}

interface UsePostalCodeReturn {
  lookupPostal: (postalCode: string) => Promise<void>
  isLooking: boolean
  lookupError: string
}

export function usePostalCode(
  onResult: (result: PostalResult) => void
): UsePostalCodeReturn {
  const [isLooking, setIsLooking] = useState(false)
  const [lookupError, setLookupError] = useState("")

  const lookupPostal = useCallback(async (postalCode: string) => {
    const digits = postalCode.replace(/-/g, "")
    if (digits.length !== 7) return

    setIsLooking(true)
    setLookupError("")
    try {
      const res = await fetch(
        `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${digits}`
      )
      const data = await res.json()
      if (data.status !== 200 || !data.results) {
        setLookupError("住所が見つかりませんでした")
        return
      }
      const r = data.results[0]
      onResult({
        prefecture: r.address1,
        city: r.address2,
        town: r.address3,
      })
    } catch {
      setLookupError("住所の取得に失敗しました")
    } finally {
      setIsLooking(false)
    }
  }, [onResult])

  return { lookupPostal, isLooking, lookupError }
}
