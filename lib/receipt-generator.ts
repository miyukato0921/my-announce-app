import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import fontkit from "@pdf-lib/fontkit"
import { readFileSync } from "fs"
import { join } from "path"

let cachedFont: Buffer | null = null

function getJapaneseFont(): Buffer {
  if (cachedFont) return cachedFont
  cachedFont = readFileSync(join(process.cwd(), "public/fonts/NotoSansJP-Regular.woff"))
  return cachedFont
}

export interface ReceiptPDFData {
  receipt_number: string
  supporter_name: string
  amount: number
  proviso: string
  issued_date: string
  issuer_name: string
  issuer_address?: string | null
  issuer_tel?: string | null
  issuer_email?: string | null
  reissued?: boolean
}

export async function generateReceiptPDF(data: ReceiptPDFData): Promise<{
  filename: string
  buffer: Buffer
}> {
  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)

  let font: any
  let fontBold: any
  try {
    const fontBytes = getJapaneseFont()
    font = await pdfDoc.embedFont(fontBytes)
    fontBold = font
  } catch {
    font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  }

  const page = pdfDoc.addPage([595, 842]) // A4
  const { width, height } = page.getSize()
  const margin = 60
  let y = height - margin

  const black = rgb(0, 0, 0)
  const gray = rgb(0.4, 0.4, 0.4)
  const red = rgb(0.86, 0.15, 0.15)

  // Helper: draw centered text
  const drawCenter = (text: string, yPos: number, size: number, color = black) => {
    const w = font.widthOfTextAtSize(text, size)
    page.drawText(text, { x: (width - w) / 2, y: yPos, size, font, color })
  }

  // Helper: draw right-aligned text
  const drawRight = (text: string, yPos: number, size: number, color = black) => {
    const w = font.widthOfTextAtSize(text, size)
    page.drawText(text, { x: width - margin - w, y: yPos, size, font, color })
  }

  // Title
  const title = "領　収　書"
  drawCenter(title, y, 24)
  y -= 8

  // Double line under title
  const titleW = font.widthOfTextAtSize(title, 24)
  const titleX = (width - titleW) / 2
  page.drawLine({ start: { x: titleX, y }, end: { x: titleX + titleW, y }, thickness: 1.5, color: black })
  page.drawLine({ start: { x: titleX, y: y - 3 }, end: { x: titleX + titleW, y: y - 3 }, thickness: 0.5, color: black })
  y -= 30

  // Reissue mark
  if (data.reissued) {
    drawCenter("（再発行）", y, 14, red)
    y -= 25
  }

  // Receipt number and date
  const issuedDate = new Date(data.issued_date).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })
  drawRight(`No. ${data.receipt_number}　　発行日: ${issuedDate}`, y, 10, gray)
  y -= 35

  // Recipient
  const recipientText = `${data.supporter_name}　様`
  page.drawText(recipientText, { x: margin, y, size: 18, font, color: black })
  y -= 6
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.8, color: black })
  y -= 40

  // Amount box
  const boxH = 70
  page.drawRectangle({ x: margin, y: y - boxH, width: width - margin * 2, height: boxH, borderColor: black, borderWidth: 1.5 })

  const amountLabel = "金額"
  const amountLabelW = font.widthOfTextAtSize(amountLabel, 10)
  page.drawText(amountLabel, { x: (width - amountLabelW) / 2, y: y - 18, size: 10, font, color: gray })

  const amountText = `¥${Number(data.amount).toLocaleString("ja-JP")}−`
  const amountW = font.widthOfTextAtSize(amountText, 28)
  page.drawText(amountText, { x: (width - amountW) / 2, y: y - 50, size: 28, font, color: black })
  y -= boxH + 30

  // Details table
  const details = [
    ["但し書き", data.proviso],
    ["発行日", issuedDate],
    ["領収書番号", data.receipt_number],
  ]
  for (const [label, value] of details) {
    page.drawText(label, { x: margin, y, size: 11, font, color: gray })
    page.drawText(value, { x: margin + 100, y, size: 11, font, color: black })
    y -= 8
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.3, color: rgb(0.9, 0.9, 0.9) })
    y -= 18
  }
  y -= 20

  // Issuer (right-aligned)
  drawRight(data.issuer_name, y, 15)
  y -= 20
  if (data.issuer_address) {
    drawRight(data.issuer_address, y, 10, gray)
    y -= 16
  }
  if (data.issuer_tel) {
    drawRight(`TEL: ${data.issuer_tel}`, y, 10, gray)
    y -= 16
  }
  if (data.issuer_email) {
    drawRight(`Email: ${data.issuer_email}`, y, 10, gray)
    y -= 16
  }

  // Reissue stamp circle (if reissued)
  if (data.reissued) {
    const stampX = width - margin - 50
    const stampY = y + 10
    const stampR = 28
    // Draw circle
    page.drawCircle({ x: stampX, y: stampY, size: stampR, borderColor: red, borderWidth: 2 })
    // Draw text in circle
    const reissueText = "再発行"
    const rw = font.widthOfTextAtSize(reissueText, 10)
    page.drawText(reissueText, { x: stampX - rw / 2, y: stampY - 4, size: 10, font, color: red })
  }

  const pdfBytes = await pdfDoc.save()

  return {
    filename: `receipt-${data.receipt_number}.pdf`,
    buffer: Buffer.from(pdfBytes),
  }
}

export function formatAmount(amount: number): string {
  return "金" + amount.toLocaleString("ja-JP") + "円"
}

export function generateReceiptNumber(date: Date, sequence: number): string {
  const dateStr = date.toISOString().split("T")[0].replace(/-/g, "")
  return `GIF-${dateStr}-${String(sequence).padStart(4, "0")}`
}
