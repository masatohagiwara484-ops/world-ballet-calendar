'use client'

/**
 * ShareThisWeek — the share affordances for the weekly card (#10).
 *
 * Ballet & opera are intensely visual; the auto-generated "this week" card is a
 * shareable edge an aggregator can't match. This turns the page into a one-tap
 * share: native share where available, else X intent + copy-link, plus a direct
 * download of the generated card image.
 */
import { useState } from 'react'
import { Share2, ExternalLink, Link2, Download, Check } from 'lucide-react'

export default function ShareThisWeek({ shareUrl }: { shareUrl: string }) {
  const [copied, setCopied] = useState(false)
  const text = 'This week on stage — ballet & opera worth the journey, on première.'

  async function nativeShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'This week on stage — première', text, url: shareUrl })
      } catch {
        /* user dismissed — no-op */
      }
    } else {
      copy()
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={nativeShare}
        className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-[11px] tracking-[0.2em] uppercase text-stage font-medium hover:bg-gold-bright transition-colors"
      >
        <Share2 size={15} />
        Share this week
      </button>
      <a
        href={xUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="glass-pill holo-edge inline-flex items-center gap-2 px-5 py-3 text-[11px] tracking-[0.18em] uppercase text-ivory/70 hover:text-gold transition-colors"
      >
        <ExternalLink size={15} />
        Post
      </a>
      <button
        onClick={copy}
        className="glass-pill holo-edge inline-flex items-center gap-2 px-5 py-3 text-[11px] tracking-[0.18em] uppercase text-ivory/70 hover:text-gold transition-colors"
      >
        {copied ? <Check size={15} /> : <Link2 size={15} />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
      <a
        href="/this-week/opengraph-image"
        download="premiere-this-week.png"
        className="glass-pill holo-edge inline-flex items-center gap-2 px-5 py-3 text-[11px] tracking-[0.18em] uppercase text-ivory/70 hover:text-gold transition-colors"
      >
        <Download size={15} />
        Card
      </a>
    </div>
  )
}
