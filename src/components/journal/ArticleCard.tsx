import Link from 'next/link'
import GradientArt from '@/components/shared/GradientArt'
import type { JournalArticle } from '@/data/journal'

/** An editorial card for a Journal article in the index grid. */
export default function ArticleCard({ article: a }: { article: JournalArticle }) {
  return (
    <Link
      href={`/journal/${a.slug}`}
      className="group glass-card specular block overflow-hidden rounded-glass h-full"
    >
      <GradientArt
        seed={a.heroSeed}
        title={a.title}
        badge={a.category}
        className="aspect-[16/10] w-full"
        monogramClassName="text-6xl"
      />
      <div className="p-6">
        <p className="text-gold text-[10px] tracking-[0.3em] uppercase mb-3">
          {a.category} · {a.readingTime}
        </p>
        <h3 className="font-serif text-xl md:text-2xl text-ivory leading-tight group-hover:text-gold-deep transition-colors line-clamp-2">
          {a.title}
        </h3>
        <p className="mt-3 text-ivory/60 text-sm leading-relaxed line-clamp-3">{a.dek}</p>
        <span className="mt-5 inline-block text-gold text-[11px] tracking-[0.18em] uppercase opacity-0 group-hover:opacity-100 transition-opacity">
          Read &rarr;
        </span>
      </div>
    </Link>
  )
}
