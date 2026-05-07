export function detectPlatform(userAgent: string): string {
  if (!userAgent) return "Unknown"

  const ua = userAgent.toLowerCase()

  // iOS
  if (ua.includes("iphone") || ua.includes("ipad")) return "iOS"
  // Android
  if (ua.includes("android")) return "Android"
  // Windows
  if (ua.includes("windows") || ua.includes("win32")) return "Windows"
  // macOS
  if (ua.includes("macintosh") || ua.includes("mac os x")) return "macOS"
  // Linux
  if (ua.includes("linux")) return "Linux"

  return "Unknown"
}
