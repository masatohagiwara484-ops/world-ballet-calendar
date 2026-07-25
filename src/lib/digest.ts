/**
 * Weekly digest — the calendar letter that replaced per-approval alerts.
 *
 * Why weekly: the crawl runs daily (freshness + retiring past runs), but a
 * reader who follows twenty houses must not receive twenty emails a day. The
 * letter is a calendar, not a changelog — its value is "what is on, and what
 * is worth the journey", which is worth reading even in a week when the crawl
 * found nothing new.
 *
 * Three movements per reader:
 *   1. This week on stage — followed companies, playing in the next 7 days.
 *      Listed as work — company (never exploded per date), so a run appearing
 *      in two consecutive letters reads as a calendar, not as spam.
 *   2. Worth the journey — curated across EVERY house, 1–12 weeks out, one per
 *      company, and never recommended to the same reader twice
 *      (digest_recommendations). This is the discovery engine and the only
 *      section a newsletter-only subscriber receives.
 *   3. Newly announced — followed companies, added in the last 7 days (rare).
 *
 * Nothing to say → no letter that week. An empty email costs more trust than
 * a missed one.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { sendEmail } from './email'
import {
  digestHtml,
  digestText,
  digestSubject,
  SITE_URL,
  type DigestRow,
} from './email-templates'

/** Resend free tier is 100/day — leave headroom for urgent date-change alerts. */
const MAX_SENDS_PER_RUN = 90
/** How far ahead "worth the journey" looks, and how many it carries. */
const HORIZON_WEEKS = 12
const MAX_RECOMMENDATIONS = 5
/** The "this week" window. */
const WEEK_DAYS = 7

interface SubscriberRow {
  email: string
  token: string
  unsubscribed_at: string | null
}

interface FollowRow {
  email: string
  entity_type: string
  entity_slug: string
}

interface PerfRow {
  id: string
  title: string
  start_date: string
  end_date: string
  company_slug: string
  change_kind: string | null
  is_featured: boolean | null
  venue: string | null
  source_url: string | null
  last_verified: string | null
}

interface CompanyRow {
  slug: string
  name: string
  website: string | null
  city: string | null
}

export interface DigestResult {
  /** Readers who received a letter. */
  sent: number
  /** Readers skipped because they had nothing worth saying. */
  empty: number
  /** Readers already sent this week's letter (idempotency). */
  alreadySent: number
  /** Readers deferred past the per-run cap — re-run to continue. */
  overCap: number
  weekKey: string
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDays(d: Date, n: number): Date {
  const nd = new Date(d)
  nd.setUTCDate(nd.getUTCDate() + n)
  return nd
}

/** ISO week key, e.g. "2026-W30" — the digest's idempotency batch id. */
export function isoWeekKey(d: Date): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  // Thursday of the current ISO week determines the year and week number.
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

/** "23–30 July" / "28 July – 4 August" — the letter's masthead date. */
function weekLabel(from: Date, to: Date): string {
  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  const sameMonth = from.getUTCMonth() === to.getUTCMonth()
  const a = from.getUTCDate()
  const b = to.getUTCDate()
  return sameMonth
    ? `${a}–${b} ${MONTHS[to.getUTCMonth()]}`
    : `${a} ${MONTHS[from.getUTCMonth()]} – ${b} ${MONTHS[to.getUTCMonth()]}`
}

function toDigestRow(p: PerfRow, company: CompanyRow | undefined): DigestRow {
  return {
    id: p.id,
    title: p.title,
    start_date: p.start_date,
    end_date: p.end_date,
    companyName: company?.name ?? p.company_slug,
    companyWebsite: company?.website ?? null,
    sourceUrl: p.source_url,
    venue: p.venue,
    city: company?.city ?? null,
  }
}

/**
 * Build and send this week's digests. Idempotent per (week, reader) via
 * notification_log, so a retry or a second cron fire is safe. Never throws.
 */
export async function sendWeeklyDigests(
  client: SupabaseClient,
  opts: { dryRun?: boolean; weekKey?: string; onlyEmail?: string; now?: Date } = {}
): Promise<DigestResult> {
  const now = opts.now ?? new Date()
  const weekKey = opts.weekKey ?? isoWeekKey(now)
  const batchId = `digest:${weekKey}`
  const result: DigestResult = { sent: 0, empty: 0, alreadySent: 0, overCap: 0, weekKey }

  try {
    const today = isoDate(now)
    const weekEnd = isoDate(addDays(now, WEEK_DAYS))
    const horizonEnd = isoDate(addDays(now, HORIZON_WEEKS * 7))
    const announcedSince = new Date(addDays(now, -WEEK_DAYS)).toISOString()

    // --- Readers -----------------------------------------------------------
    let subQuery = client
      .from('subscribers')
      .select('email, token, unsubscribed_at')
      .is('unsubscribed_at', null)
    if (opts.onlyEmail) subQuery = subQuery.eq('email', opts.onlyEmail)
    const { data: subData } = await subQuery
    const subscribers = (subData ?? []) as SubscriberRow[]
    if (subscribers.length === 0) return result

    // Already-sent readers for this week (idempotency).
    const { data: logData } = await client
      .from('notification_log')
      .select('email')
      .eq('batch_id', batchId)
    const alreadySent = new Set(((logData ?? []) as { email: string }[]).map((r) => r.email))

    // --- Follows (company only; work/person/city are not calendar sources) --
    const { data: followData } = await client
      .from('follows')
      .select('email, entity_type, entity_slug')
      .eq('entity_type', 'company')
    const followsByEmail = new Map<string, Set<string>>()
    for (const f of (followData ?? []) as FollowRow[]) {
      if (!followsByEmail.has(f.email)) followsByEmail.set(f.email, new Set())
      followsByEmail.get(f.email)!.add(f.entity_slug)
    }

    // --- Companies (names / websites / cities for every row we may render) --
    const { data: companyData } = await client
      .from('companies')
      .select('slug, name, website, city')
    const companyBySlug = new Map<string, CompanyRow>(
      ((companyData ?? []) as CompanyRow[]).map((c) => [c.slug, c])
    )

    // --- Performance pools -------------------------------------------------
    // On stage during the next 7 days (overlapping runs, not just starting).
    const { data: onStageData } = await client
      .from('performances')
      .select(
        'id, title, start_date, end_date, company_slug, change_kind, is_featured, venue, source_url, last_verified'
      )
      .eq('review_status', 'published')
      .lte('start_date', weekEnd)
      .gte('end_date', today)
      .order('start_date', { ascending: true })
    const onStage = (onStageData ?? []) as PerfRow[]

    // Starting 1–12 weeks out — the recommendation pool (every house).
    const { data: aheadData } = await client
      .from('performances')
      .select(
        'id, title, start_date, end_date, company_slug, change_kind, is_featured, venue, source_url, last_verified'
      )
      .eq('review_status', 'published')
      .gt('start_date', weekEnd)
      .lte('start_date', horizonEnd)
      .order('start_date', { ascending: true })
    const ahead = (aheadData ?? []) as PerfRow[]

    // Newly announced in the last 7 days.
    const { data: freshData } = await client
      .from('performances')
      .select(
        'id, title, start_date, end_date, company_slug, change_kind, is_featured, venue, source_url, last_verified'
      )
      .eq('review_status', 'published')
      .eq('change_kind', 'new')
      .gte('last_verified', announcedSince)
      .gte('end_date', today)
      .order('start_date', { ascending: true })
    const fresh = (freshData ?? []) as PerfRow[]

    // Featured first, then soonest — the editor's hand before the clock.
    const recommendationPool = [...ahead].sort((a, b) => {
      const fa = a.is_featured ? 0 : 1
      const fb = b.is_featured ? 0 : 1
      if (fa !== fb) return fa - fb
      return a.start_date.localeCompare(b.start_date)
    })

    const label = weekLabel(now, addDays(now, WEEK_DAYS))

    for (const sub of subscribers) {
      if (alreadySent.has(sub.email)) {
        result.alreadySent++
        continue
      }
      if (result.sent >= MAX_SENDS_PER_RUN) {
        result.overCap++
        continue
      }

      const followed = followsByEmail.get(sub.email) ?? new Set<string>()

      const thisWeek = onStage
        .filter((p) => followed.has(p.company_slug))
        .map((p) => toDigestRow(p, companyBySlug.get(p.company_slug)))

      const newlyAnnounced = fresh
        .filter((p) => followed.has(p.company_slug))
        .map((p) => toDigestRow(p, companyBySlug.get(p.company_slug)))

      // Recommendations: never repeat one to this reader; one per company.
      const { data: seenData } = await client
        .from('digest_recommendations')
        .select('performance_id')
        .eq('email', sub.email)
      const seen = new Set(
        ((seenData ?? []) as { performance_id: string }[]).map((r) => r.performance_id)
      )
      const usedCompanies = new Set<string>()
      const worthTheJourney: DigestRow[] = []
      for (const p of recommendationPool) {
        if (worthTheJourney.length >= MAX_RECOMMENDATIONS) break
        if (seen.has(p.id) || usedCompanies.has(p.company_slug)) continue
        usedCompanies.add(p.company_slug)
        worthTheJourney.push(toDigestRow(p, companyBySlug.get(p.company_slug)))
      }

      if (thisWeek.length === 0 && worthTheJourney.length === 0 && newlyAnnounced.length === 0) {
        result.empty++
        continue
      }

      const input = {
        weekLabel: label,
        thisWeek,
        worthTheJourney,
        newlyAnnounced,
        unsubscribeUrl: `${SITE_URL}/unsubscribe?token=${sub.token}`,
      }

      if (opts.dryRun) {
        console.log(
          `[digest] (dry) ${sub.email}: ${thisWeek.length} on stage, ${worthTheJourney.length} recommended, ${newlyAnnounced.length} new`
        )
        result.sent++
        continue
      }

      const ok = await sendEmail({
        to: sub.email,
        subject: digestSubject(input),
        html: digestHtml(input),
        text: digestText(input),
        unsubscribeUrl: input.unsubscribeUrl,
      })
      if (!ok) continue

      result.sent++
      // Record AFTER acceptance so a transport failure stays retryable.
      await client.from('notification_log').insert({ batch_id: batchId, email: sub.email })
      if (worthTheJourney.length) {
        await client.from('digest_recommendations').insert(
          worthTheJourney.map((r) => ({ email: sub.email, performance_id: r.id }))
        )
      }
    }

    console.log(
      `[digest] ${weekKey}: ${result.sent} sent, ${result.empty} empty, ${result.alreadySent} already, ${result.overCap} over-cap`
    )
  } catch (err) {
    console.warn(`[digest] failed: ${err instanceof Error ? err.message : String(err)}`)
  }
  return result
}
