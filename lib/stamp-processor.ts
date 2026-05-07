/**
 * Process a stamp/seal image: remove white background and resize
 * Runs client-side using Canvas API
 */
export async function processStampImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      const size = 150
      const canvas = document.createElement("canvas")
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext("2d")
      if (!ctx) { reject(new Error("Canvas not supported")); return }

      // Draw resized image centered
      const scale = Math.min(size / img.width, size / img.height)
      const w = img.width * scale
      const h = img.height * scale
      const x = (size - w) / 2
      const y = (size - h) / 2

      ctx.clearRect(0, 0, size, size)
      ctx.drawImage(img, x, y, w, h)

      // Remove white/near-white pixels (make transparent)
      const imageData = ctx.getImageData(0, 0, size, size)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        // If pixel is near-white, make it transparent
        if (r > 230 && g > 230 && b > 230) {
          data[i + 3] = 0 // set alpha to 0
        }
        // Gradual transparency for slightly off-white pixels
        else if (r > 200 && g > 200 && b > 200) {
          const brightness = (r + g + b) / 3
          data[i + 3] = Math.round(255 * (1 - (brightness - 200) / 55))
        }
      }
      ctx.putImageData(imageData, 0, 0)

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error("Failed to create blob"))
        },
        "image/png"
      )
    }
    img.onerror = () => reject(new Error("画像の読み込みに失敗しました"))
    img.src = URL.createObjectURL(file)
  })
}
