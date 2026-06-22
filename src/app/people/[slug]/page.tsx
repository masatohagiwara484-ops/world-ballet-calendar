import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import { buildGraph, buildGraphAsync } from '@/lib/graph'
import { searchAsync } from '@/lib/search'
import { gradientFor, monogram } from '@/components/shared/design'
import EntityPerformanceRow from '@/components/entity/EntityPerformanceRow'
import FollowButton from '@/components/audience/FollowButton'
import type { PersonRole, SearchResultItem } from '@/lib/types'

export const revalidate = 3600
export const dynamicParams = true

interface Props {
  params: { slug: string }
}

/** Human-readable role labels for display. */
const ROLE_DISPLAY: Record<PersonRole, string> = {
  choreographer: 'Choreographer',
  composer: 'Composer',
  dancer: 'Dancer',
  conductor: 'Conductor',
  director: 'Director',
  singer: 'Singer',
  musician: 'Musician',
}

/** Ordered display priority for roles. */
const ROLE_ORDER: PersonRole[] = [
  'composer',
  'choreographer',
  'conductor',
  'director',
  'dancer',
  'singer',
  'musician',
]

function humanizeRoles(roles: PersonRole[]): string {
  const ordered = ROLE_ORDER.filter((r) => roles.includes(r))
  return ordered.map((r) => ROLE_DISPLAY[r]).join(' · ')
}

export async function generateStaticParams() {
  const { people } = buildGraph()
  return people.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { personBySlug } = await buildGraphAsync()
  const person = personBySlug.get(params.slug)
  if (!person) return {}

  const roleStr = humanizeRoles(person.roles)
  const title = person.name
  const description = `${person.name}${roleStr ? ` — ${roleStr}` : ''}: browse every production and performance on première.`
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: 'summary', title, description },
  }
}

export default async function PersonPage({ params }: Props) {
  const { personBySlug } = await buildGraphAsync()
  const person = personBySlug.get(params.slug)
  if (!person) notFound()

  // Fetch every performance credited to this person
  const { items, total } = await searchAsync({ person_slug: params.slug, page_size: 200 })

  // Group performances by the primary role the person holds in each
  // We inspect item.credits to find this person and group by role
  const byRole = new Map<PersonRole, SearchResultItem[]>()
  for (const item of items) {
    // Find which role(s) this person appears in for this item
    const matchingRoles: PersonRole[] = []
    for (const group of item.credits) {
      if (group.people.some((p) => p.slug === params.slug)) {
        matchingRoles.push(group.role)
      }
    }
    // Assign to the first matched role (or fallback to any role the person holds)
    const role: PersonRole = matchingRoles[0] ?? person.roles[0]
    const group = byRole.get(role) ?? []
    group.push(item)
    byRole.set(role, group)
  }

  // Sort role groups by display order
  const roleGroups = ROLE_ORDER.filter((r) => byRole.has(r)).map((r) => ({
    role: r,
    items: byRole.get(r)!.sort((a, b) => a.start_date.localeCompare(b.start_date)),
  }))

  // If no role grouping found (shouldn't happen but defensive), show all flat
  const hasGroups = roleGroups.length > 0
  const flatItems = hasGroups ? [] : items

  const gradient = gradientFor(params.slug)
  const roleStr = humanizeRoles(person.roles)

  // JSON-LD
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    ...(roleStr ? { jobTitle: roleStr } : {}),
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://worldballetoperacalender.vercel.app'}/people/${person.slug}`,
  }

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Gradient hero */}
      <section
        className="relative pt-36 pb-24 px-6 md:px-10 overflow-hidden"
        style={{ background: gradient }}
      >
        {/* Gold aura */}
        <div
          aria-hidden
          className="absolute -top-24 -right-24 w-[34rem] h-[34rem] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)' }}
        />
        {/* Watermark monogram */}
        <span
          aria-hidden
          className="absolute -bottom-16 -left-6 font-serif font-light text-white/[0.06] leading-none select-none pointer-events-none"
          style={{ fontSize: 'clamp(14rem, 40vw, 38rem)' }}
        >
          {monogram(person.name)}
        </span>

        <div className="relative max-w-5xl mx-auto">
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 text-gold text-[11px] tracking-[0.2em] uppercase hover:text-gold-bright transition-colors mb-6"
          >
            <ArrowLeft size={14} />
            Search
          </Link>

          {roleStr && (
            <p className="text-gold text-[11px] tracking-[0.4em] uppercase mb-5">
              {roleStr}
            </p>
          )}

          <h1 className="font-serif text-5xl md:text-7xl text-gradient-gold leading-[1.05]">
            {person.name}
          </h1>

          {/* Tasteful bio placeholder — no fabricated facts */}
          <p className="mt-6 text-white/60 text-base md:text-lg font-light max-w-2xl leading-relaxed">
            A celebrated figure in the world of ballet and opera, whose work
            continues to grace stages across the globe.
          </p>

          <div className="mt-8 flex items-center gap-6">
            <span className="text-white/55 text-sm">
              {total}{' '}
              {total === 1 ? 'production' : 'productions'} in the catalogue
            </span>
          </div>
        </div>
      </section>

      {/* Performance list grouped by role */}
      <section className="py-20 md:py-28 px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 pb-10 border-b border-black/[0.08] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <p className="text-gold-deep text-[11px] tracking-[0.4em] uppercase mb-1.5">
                Never miss a performance
              </p>
              <p className="text-ivory/60 text-sm">
                Follow {person.name} and we’ll email you when new dates are announced.
              </p>
            </div>
            <FollowButton entityType="person" entitySlug={params.slug} entityLabel={person.name} />
          </div>
          {total === 0 ? (
            <>
              <div className="mb-10">
                <p className="text-gold-deep text-[11px] tracking-[0.4em] uppercase mb-2">
                  Productions
                </p>
                <h2 className="font-serif text-3xl md:text-4xl text-ivory">
                  Programme
                </h2>
              </div>
              <div className="glass-panel py-20 text-center">
                <p className="text-ivory/40 text-xs tracking-[0.3em] uppercase mb-3">
                  No productions listed yet
                </p>
                <p className="text-ivory/55 text-sm">
                  Productions featuring {person.name} will appear here as the catalogue grows.
                </p>
              </div>
            </>
          ) : hasGroups ? (
            roleGroups.map(({ role, items: roleItems }) => (
              <div key={role} className="mb-16">
                <div className="mb-8">
                  <p className="text-gold-deep text-[11px] tracking-[0.4em] uppercase mb-2">
                    {ROLE_DISPLAY[role]}
                  </p>
                  <h2 className="font-serif text-3xl md:text-4xl text-ivory">
                    As {ROLE_DISPLAY[role]}
                  </h2>
                  <p className="text-ivory/45 text-sm mt-1">
                    {roleItems.length}{' '}
                    {roleItems.length === 1 ? 'production' : 'productions'}
                  </p>
                </div>

                <div className="glass-panel specular px-5 sm:px-8 py-2">
                  {roleItems.map((item) => (
                    <EntityPerformanceRow
                      key={item.id}
                      item={item}
                      highlightRole={role}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <>
              <div className="mb-10">
                <p className="text-gold-deep text-[11px] tracking-[0.4em] uppercase mb-2">
                  Productions
                </p>
                <h2 className="font-serif text-3xl md:text-4xl text-ivory">
                  Programme
                </h2>
                <p className="text-ivory/45 text-sm mt-1">
                  {total} {total === 1 ? 'production' : 'productions'}
                </p>
              </div>
              <div className="glass-panel specular px-5 sm:px-8 py-2">
                {flatItems.map((item) => (
                  <EntityPerformanceRow key={item.id} item={item} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  )
}
