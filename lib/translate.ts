import { generateText } from "ai"

const langNames: Record<string, string> = {
  en: "English",
  ko: "Korean",
  zh: "Simplified Chinese",
}

/**
 * 複数テキストを指定言語群に翻訳する共通関数。
 * 管理画面・ブロック翻訳・テキスト翻訳のすべてから使用される。
 */
export async function translateTexts(
  texts: Record<string, string>,
  targetLangs: string[] = ["en", "ko", "zh"]
): Promise<Record<string, Record<string, string>>> {
  const entries = Object.entries(texts).filter(([, v]) => v?.trim())
  if (entries.length === 0) return {}

  const langs = targetLangs.filter((l) => langNames[l])
  if (langs.length === 0) return {}

  const prompt = `You are a professional translator specializing in Japanese event/crowdfunding content.
Translate the following Japanese texts into ${langs.map((l) => `${langNames[l]} (${l})`).join(", ")}.

IMPORTANT RULES:
- If a value contains HTML tags (e.g. <p>, <strong>, <h2>, <ul>, <li>, <br>, <a>, <img>), preserve ALL HTML tags exactly as-is. Only translate text between tags.
- Do NOT translate or modify URLs, image paths, or HTML attribute values.
- Do NOT add or remove any HTML tags.
- If texts contain dates, translate the date format naturally for each language (e.g. "2026年3月14日（土）" → "Saturday, March 14, 2026" for English).
- If texts contain Japanese place names, translate or transliterate them naturally (e.g. "代々木公園イベント広場" → "Yoyogi Park Event Plaza" for English).
- Return ONLY a valid JSON object. No markdown, no code fences, no extra text.

Return this exact JSON structure:
{
${langs.map((l) => `  "${l}": { ${entries.map(([k]) => `"${k}": "..."`).join(", ")} }`).join(",\n")}
}

Texts to translate:
${entries.map(([k, v]) => `[${k}]: ${v}`).join("\n")}`

  const { text } = await generateText({
    model: "openai/gpt-4o-mini",
    prompt,
    maxTokens: 4096,
  })

  const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim()
  return JSON.parse(cleaned)
}

/**
 * 複数テキストを単一言語に翻訳する共通関数。
 */
export async function translateToLang(
  texts: Record<string, string>,
  targetLang: string
): Promise<Record<string, string>> {
  const result = await translateTexts(texts, [targetLang])
  return result[targetLang] ?? {}
}
