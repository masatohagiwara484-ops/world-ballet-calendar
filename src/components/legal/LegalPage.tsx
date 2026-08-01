import type { ReactNode } from 'react'

/**
 * Shared shell for the legal pages (privacy · terms · disclosure).
 *
 * Type is deliberately larger than the marketing pages: these are documents
 * people actually have to READ, and the site's 14px body copy was too small to
 * read comfortably. Body runs at text-xl (20px) with generous leading.
 */
export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="font-serif text-3xl text-ivory mb-5">{title}</h2>
      <div className="flex flex-col gap-5 text-ivory/75 text-xl leading-relaxed">{children}</div>
    </section>
  )
}

export default function LegalPage({
  eyebrow,
  title,
  lede,
  updated,
  children,
}: {
  eyebrow: string
  title: string
  lede: string
  updated: string
  children: ReactNode
}) {
  return (
    <main className="min-h-screen bg-stage">
      <section className="pt-40 pb-14 px-6 md:px-16 lg:px-24">
        <div className="max-w-3xl mx-auto">
          <p
            className="mb-5"
            style={{
              color: '#A8842A',
              fontSize: '15px',
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
            }}
          >
            {eyebrow}
          </p>
          <h1 className="font-serif text-4xl md:text-6xl text-ivory mb-7 leading-tight">
            {title}
          </h1>
          <p className="text-ivory/75 text-xl md:text-2xl leading-relaxed">{lede}</p>
          <p className="mt-7 text-ivory/50 text-base">Last updated: {updated}</p>
        </div>
      </section>

      <section className="pb-24 px-6 md:px-16 lg:px-24">
        <div className="max-w-3xl mx-auto glass-panel specular px-8 md:px-12 py-12">
          {children}
        </div>
      </section>
    </main>
  )
}
