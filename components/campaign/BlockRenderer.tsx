import type { PageBlock, FundItem } from "@/lib/block-types"
import Image from "next/image"

// ─── SVGドーナツグラフ ───
function DonutChart({ items }: { items: FundItem[] }) {
  const size = 160
  const cx = size / 2
  const cy = size / 2
  const r = 60
  const inner = 38

  let cumulative = 0
  const slices = items.map((item) => {
    const startAngle = (cumulative / 100) * 360 - 90
    cumulative += item.percent
    const endAngle = (cumulative / 100) * 360 - 90
    return { ...item, startAngle, endAngle }
  })

  const polarToCartesian = (angle: number, radius: number) => {
    const rad = (angle * Math.PI) / 180
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }

  const describeArc = (startAngle: number, endAngle: number, outerR: number, innerR: number) => {
    if (endAngle - startAngle >= 360) endAngle = startAngle + 359.99
    const s1 = polarToCartesian(startAngle, outerR)
    const e1 = polarToCartesian(endAngle, outerR)
    const s2 = polarToCartesian(endAngle, innerR)
    const e2 = polarToCartesian(startAngle, innerR)
    const largeArc = endAngle - startAngle > 180 ? 1 : 0
    return [
      `M ${s1.x} ${s1.y}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${e1.x} ${e1.y}`,
      `L ${s2.x} ${s2.y}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${e2.x} ${e2.y}`,
      "Z",
    ].join(" ")
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((slice, i) => (
        <path
          key={i}
          d={describeArc(slice.startAngle, slice.endAngle, r, inner)}
          fill={slice.color}
          stroke="var(--background)"
          strokeWidth={2}
        />
      ))}
      <circle cx={cx} cy={cy} r={inner} fill="var(--background)" />
    </svg>
  )
}

function FundUsageBlock({ block }: { block: PageBlock }) {
  const items: FundItem[] = block.items ?? []
  return (
    <div className="flex flex-col sm:flex-row items-center gap-8">
      {items.length > 0 && <DonutChart items={items} />}
      <div className="flex-1 space-y-3 w-full">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="mt-1.5 w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-foreground">{item.label}</span>
                <span className="text-sm font-black text-foreground shrink-0">{item.percent}%</span>
              </div>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface Props {
  blocks: PageBlock[]
  fallbackAboutHtml?: string
}

export default function BlockRenderer({ blocks, fallbackAboutHtml }: Props) {
  if (!blocks || blocks.length === 0) {
    if (fallbackAboutHtml) {
      return (
        <section className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-black text-foreground">About This Project</h2>
          </div>
          <div
            className="p-6 text-sm leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: fallbackAboutHtml }}
          />
        </section>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      {blocks.map((block) => {
        if (block.type === "divider") {
          return <hr key={block.id} className="border-border my-2" />
        }
        if (block.type === "heading") {
          return (
            <h2 key={block.id} className="text-xl font-black text-foreground pt-4">
              {block.content}
            </h2>
          )
        }
        if (block.type === "image") {
          return (
            <figure key={block.id} className="space-y-2">
              {block.imageUrl && (
                <div className="relative w-full rounded-2xl overflow-hidden border border-border">
                  <Image
                    src={block.imageUrl}
                    alt={block.imageAlt ?? ""}
                    width={800}
                    height={450}
                    className="w-full object-cover"
                    unoptimized
                  />
                </div>
              )}
              {block.imageCaption && (
                <figcaption className="text-xs text-muted-foreground text-center">
                  {block.imageCaption}
                </figcaption>
              )}
            </figure>
          )
        }
        if (block.type === "fund_usage") {
          return (
            <section key={block.id} className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="font-black text-foreground">{block.title ?? "資金の使い道"}</h2>
              </div>
              <div className="p-6">
                <FundUsageBlock block={block} />
              </div>
            </section>
          )
        }
        // about / rich_text
        const html = block.content ?? ""
        if (!html && !block.title) return null
        return (
          <section key={block.id} className="bg-card rounded-2xl border border-border overflow-hidden">
            {block.title && (
              <div className="px-6 py-4 border-b border-border">
                <h2 className="font-black text-foreground">{block.title}</h2>
              </div>
            )}
            {html && (
              <div
                className="p-6 text-sm leading-relaxed prose prose-sm max-w-none text-foreground/80
                  [&_h1]:text-2xl [&_h1]:font-black [&_h1]:mb-3 [&_h1]:text-foreground
                  [&_h2]:text-xl [&_h2]:font-black [&_h2]:mb-2 [&_h2]:text-foreground
                  [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:text-foreground
                  [&_p]:mb-3 [&_p]:leading-relaxed
                  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3
                  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3
                  [&_blockquote]:border-l-4 [&_blockquote]:border-brand-green [&_blockquote]:pl-4 [&_blockquote]:italic
                  [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-3
                  [&_a]:text-brand-green [&_a]:underline
                  [&_strong]:font-bold [&_em]:italic"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            )}
          </section>
        )
      })}
    </div>
  )
}
