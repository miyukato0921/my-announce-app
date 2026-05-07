"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import CampaignHeader from "@/components/campaign/CampaignHeader"

interface Props {
  title: string
  content: string
}

export default function LegalPageClient({ title, content }: Props) {
  return (
    <div className="min-h-screen bg-background">
      <CampaignHeader />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          トップに戻る
        </Link>
        <div className="bg-card rounded-2xl border border-border p-8">
          <h1 className="text-2xl font-black text-foreground mb-6">{title}</h1>
          <div
            className="prose prose-sm max-w-none text-foreground/80
              [&_h2]:text-xl [&_h2]:font-black [&_h2]:mb-4 [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:first:mt-0
              [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-3 [&_h3]:text-foreground [&_h3]:mt-6
              [&_p]:mb-4 [&_p]:leading-relaxed
              [&_table]:w-full [&_table]:border-collapse [&_table]:mb-6
              [&_td]:border [&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td]:text-sm [&_td]:align-top
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ul]:space-y-1
              [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_ol]:space-y-1
              [&_li]:text-sm [&_li]:leading-relaxed
              [&_a]:text-brand-green [&_a]:underline
              [&_strong]:font-bold"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </main>
    </div>
  )
}
