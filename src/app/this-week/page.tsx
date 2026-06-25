import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { getThisWeek, shortRunLabel } from '@/lib/this-week'
import { KIND_LABEL } from '@/components/shared/design'
import ShareThisWeek from '@/components/audience/ShareThisWeek'

export const revalidate = 3600

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://worldballetoperacalender.vercel.app'

export const metadata: Metadata = {
  title: 'This Week on Stage',
  description:
    'The ballet and opera performances on the world&rsquo;s great stages this week — curated by première. Share the week, plan the trip.',
  alternates: { canonical: '/this-week' },
}

export default async function ThisWeekPage() {
  const { rangeLabel, performances } = await getThisWeek()

  return (
    <main className="min-h-screen pt-28 pb-24 px-6 md:px-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <p className="text-gold-deep text-[11px] tracking-[0.4em] uppercase mb-5">
            {rangeLabel}
          </p>
          <h1 className="font-serif text-5xl md:text-7xl text-gradient-gold leading-[1.05]">
            This week on stage
          </h1>
          <p className="mt-6 text-ivory/60 text-base md:text-lg max-w-xl leading-relaxed">
            The performances worth crossing a border for this week — gathered into
            one beautiful card, made to share.
          </p>
          <div className="mt-8">
            <ShareThisWeek shareUrl={`${SITE}/this-week`} />
          </div>
        </div>

        {/* The auto-generated card preview */}
        <div className="lucid-glass holo-sheen holo-edge overflow-hidden rounded-glass mb-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/this-week/opengraph-image"
            alt={`This week on stage — ${rangeLabel}`}
            width={1200}
            height={630}
            className="w-full h-auto block"
          />
        </div>

        {/* The list */}
        {performances.length > 0 ? (
          <div className="lucid-glass holo-sheen px-5 sm:px-8 py-2">
            {performances.map((p) => (
              <Link
                key={p.id}
                href={`/performances/${p.id}`}
                className="group grid grid-cols-[7rem_1fr_auto] sm:grid-cols-[10rem_1fr_auto] items-start gap-4 sm:gap-8 py-5 border-b border-[rgba(26,22,15,0.10)] last:border-0 hover:bg-gold/[0.04] transition-colors px-3 -mx-3 rounded-glass-sm"
              >
                <p className="text-gold text-sm tabular-nums pt-0.5">
                  {shortRunLabel(p.start_date, p.end_date)}
                </p>
                <div className="min-w-0">
                  <h3 className="font-serif text-lg text-ivory group-hover:text-gold-deep transition-colors">
                    {p.title}
                  </h3>
                  <p className="text-ivory/62 text-sm mt-0.5">
                    {p.company.name} · {KIND_LABEL[p.kind]}
                  </p>
                </div>
                <ArrowUpRight size={18} className="mt-1 text-ivory/30 group-hover:text-gold transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-ivory/55 text-sm lucid-glass holo-sheen rounded-glass">
            The new season is being announced. Check back soon — or follow The
            Première Edit to get the week in your inbox.
          </p>
        )}
      </div>
    </main>
  )
}
