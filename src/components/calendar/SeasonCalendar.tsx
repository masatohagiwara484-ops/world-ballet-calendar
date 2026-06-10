'use client'

import { useMemo, useState } from 'react'
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import clsx from 'clsx'
import { useCompanies, usePerformances } from '@/hooks/useCompanies'
import { formatRange } from '@/components/shared/format'
import { KIND_LABEL, bookingUrl } from '@/components/shared/design'
import type { PerformanceWithCompany } from '@/lib/types'

type KindFilter = 'all' | 'ballet' | 'opera'
type ViewMode = 'grid' | 'season'

const SEASON_START = new Date(2026, 5, 1) // June 2026
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function toISO(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

/** Does a performance run cover this calendar day? */
function runCoversDay(p: PerformanceWithCompany, dayIso: string): boolean {
  return p.start_date <= dayIso && p.end_date >= dayIso
}

export default function SeasonCalendar() {
  const [month, setMonth] = useState<Date>(SEASON_START)
  const [kind, setKind] = useState<KindFilter>('all')
  const [country, setCountry] = useState<string>('')
  const [companySlug, setCompanySlug] = useState<string>('')
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [view, setView] = useState<ViewMode>('grid')

  const { companies } = useCompanies()

  // Query the whole visible month (with grid spill) so cells can be marked.
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })

  const { performances, loading } = usePerformances({
    start_date: toISO(gridStart),
    end_date: toISO(gridEnd),
    kind: kind === 'all' ? undefined : kind,
    country: country || undefined,
    company_slug: companySlug || undefined,
  })

  // For the season (list) view, fetch the whole season span.
  const { performances: seasonPerfs } = usePerformances({
    start_date: '2026-06-01',
    end_date: '2027-07-31',
    kind: kind === 'all' ? undefined : kind,
    country: country || undefined,
    company_slug: companySlug || undefined,
  })

  const countries = useMemo(
    () => Array.from(new Set(companies.map((c) => c.country))).sort(),
    [companies]
  )

  const days = useMemo(() => {
    const out: Date[] = []
    let d = gridStart
    while (d <= gridEnd) {
      out.push(d)
      d = new Date(d.getTime() + 86_400_000)
    }
    return out
  }, [gridStart, gridEnd])

  const perfsByDay = useMemo(() => {
    const map = new Map<string, PerformanceWithCompany[]>()
    for (const day of days) {
      const iso = toISO(day)
      const list = performances.filter((p) => runCoversDay(p, iso))
      if (list.length) map.set(iso, list)
    }
    return map
  }, [days, performances])

  const selectedList = selectedDay ? perfsByDay.get(selectedDay) ?? [] : []

  const hasFilters = kind !== 'all' || country !== '' || companySlug !== ''
  function clearFilters() {
    setKind('all')
    setCountry('')
    setCompanySlug('')
  }

  // Group season list by month.
  const seasonGroups = useMemo(() => {
    const groups = new Map<string, PerformanceWithCompany[]>()
    for (const p of seasonPerfs) {
      const key = format(parseISO(p.start_date), 'yyyy-MM')
      const arr = groups.get(key) ?? []
      arr.push(p)
      groups.set(key, arr)
    }
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [seasonPerfs])

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10">
      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
        <div className="flex flex-wrap items-end gap-4">
          {/* Kind toggle */}
          <div
            role="group"
            aria-label="Filter by type"
            className="inline-flex border border-[#1A1A1A]/[0.12] rounded overflow-hidden"
          >
            {(['all', 'ballet', 'opera'] as KindFilter[]).map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                aria-pressed={kind === k}
                className={clsx(
                  'px-5 py-2.5 text-[11px] tracking-[0.18em] uppercase transition-colors',
                  kind === k
                    ? 'bg-[#1B2A4A] text-white'
                    : 'bg-white text-[#1A1A1A]/55 hover:text-[#1A1A1A]'
                )}
              >
                {k === 'all' ? 'All' : KIND_LABEL[k]}
              </button>
            ))}
          </div>

          <FilterSelect
            label="Country"
            value={country}
            onChange={setCountry}
            options={[{ value: '', label: 'All countries' }, ...countries.map((c) => ({ value: c, label: c }))]}
          />
          <FilterSelect
            label="Company"
            value={companySlug}
            onChange={setCompanySlug}
            options={[
              { value: '', label: 'All companies' },
              ...companies.map((c) => ({ value: c.slug, label: c.name })),
            ]}
          />

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-[#1A1A1A]/45 text-[11px] tracking-[0.18em] uppercase hover:text-[#D4AF37] transition-colors py-2.5"
            >
              Clear
            </button>
          )}
        </div>

        {/* View toggle */}
        <div
          role="group"
          aria-label="Calendar view"
          className="inline-flex border border-[#1A1A1A]/[0.12] rounded overflow-hidden self-start"
        >
          {(['grid', 'season'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={clsx(
                'px-5 py-2.5 text-[11px] tracking-[0.18em] uppercase transition-colors',
                view === v
                  ? 'bg-[#D4AF37] text-white'
                  : 'bg-white text-[#1A1A1A]/55 hover:text-[#1A1A1A]'
              )}
            >
              {v === 'grid' ? 'Month' : 'Season'}
            </button>
          ))}
        </div>
      </div>

      {view === 'grid' ? (
        <GridView
          month={month}
          setMonth={setMonth}
          days={days}
          perfsByDay={perfsByDay}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          loading={loading}
        />
      ) : (
        <SeasonView groups={seasonGroups} />
      )}

      {/* Detail side panel / bottom sheet */}
      {selectedDay && (
        <DayPanel
          dayIso={selectedDay}
          list={selectedList}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  )
}

/* ---------------- Grid view ---------------- */

function GridView({
  month,
  setMonth,
  days,
  perfsByDay,
  selectedDay,
  setSelectedDay,
  loading,
}: {
  month: Date
  setMonth: (d: Date) => void
  days: Date[]
  perfsByDay: Map<string, PerformanceWithCompany[]>
  selectedDay: string | null
  setSelectedDay: (d: string | null) => void
  loading: boolean
}) {
  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setMonth(addMonths(month, -1))}
          aria-label="Previous month"
          className="p-2 text-[#1A1A1A]/50 hover:text-[#D4AF37] transition-colors"
        >
          <ChevronLeft size={22} />
        </button>
        <h2 className="font-serif text-3xl md:text-4xl font-light text-[#1A1A1A]">
          {format(month, 'MMMM yyyy')}
        </h2>
        <button
          onClick={() => setMonth(addMonths(month, 1))}
          aria-label="Next month"
          className="p-2 text-[#1A1A1A]/50 hover:text-[#D4AF37] transition-colors"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Desktop / tablet grid */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="text-center text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/35 py-2"
            >
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-[#1A1A1A]/[0.07] border border-[#1A1A1A]/[0.07] rounded-md overflow-hidden">
          {days.map((day) => {
            const iso = format(day, 'yyyy-MM-dd')
            const inMonth = isSameMonth(day, month)
            const list = perfsByDay.get(iso) ?? []
            const hasPerf = list.length > 0
            return (
              <button
                key={iso}
                onClick={() => hasPerf && setSelectedDay(iso)}
                aria-label={`${format(day, 'd MMMM yyyy')}${hasPerf ? `, ${list.length} performances` : ''}`}
                disabled={!hasPerf}
                className={clsx(
                  'min-h-[112px] text-left p-2.5 transition-colors',
                  inMonth ? 'bg-white' : 'bg-[#FAF8F5]',
                  hasPerf && 'hover:bg-[#D4AF37]/[0.06] cursor-pointer',
                  selectedDay === iso && 'ring-1 ring-inset ring-[#D4AF37] shadow-[inset_0_0_20px_rgba(212,175,55,0.18)]'
                )}
              >
                <span
                  className={clsx(
                    'text-xs tabular-nums',
                    inMonth ? 'text-[#1A1A1A]/70' : 'text-[#1A1A1A]/25',
                    hasPerf && 'font-medium text-[#1A1A1A]'
                  )}
                >
                  {format(day, 'd')}
                </span>
                <div className="mt-1.5 space-y-1">
                  {list.slice(0, 3).map((p) => (
                    <div key={p.id} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0" />
                      <span className="text-[11px] text-[#1A1A1A]/70 truncate leading-tight">
                        {p.title}
                      </span>
                    </div>
                  ))}
                  {list.length > 3 && (
                    <span className="text-[10px] text-[#D4AF37] tracking-wide">
                      +{list.length - 3} more
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Mobile agenda — only days in this month with performances */}
      <div className="sm:hidden">
        {days
          .filter((d) => isSameMonth(d, month) && (perfsByDay.get(format(d, 'yyyy-MM-dd'))?.length ?? 0) > 0)
          .map((day) => {
            const iso = format(day, 'yyyy-MM-dd')
            const list = perfsByDay.get(iso) ?? []
            return (
              <button
                key={iso}
                onClick={() => setSelectedDay(iso)}
                className="w-full text-left flex gap-4 py-4 border-b border-[#1A1A1A]/[0.08]"
              >
                <div className="w-12 shrink-0 text-center">
                  <p className="font-serif text-2xl font-light text-[#1A1A1A] leading-none">
                    {format(day, 'd')}
                  </p>
                  <p className="text-[10px] tracking-[0.15em] uppercase text-[#1A1A1A]/40 mt-1">
                    {format(day, 'EEE')}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  {list.slice(0, 3).map((p) => (
                    <p key={p.id} className="text-sm text-[#1A1A1A]/75 truncate">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#D4AF37] mr-2 align-middle" />
                      {p.title}
                    </p>
                  ))}
                  {list.length > 3 && (
                    <p className="text-[11px] text-[#D4AF37] mt-1">+{list.length - 3} more</p>
                  )}
                </div>
              </button>
            )
          })}
        {days.filter((d) => isSameMonth(d, month) && (perfsByDay.get(format(d, 'yyyy-MM-dd'))?.length ?? 0) > 0).length === 0 &&
          !loading && (
            <p className="py-16 text-center text-[#1A1A1A]/40 text-sm">
              No performances this month with the current filters.
            </p>
          )}
      </div>
    </div>
  )
}

/* ---------------- Season (list) view ---------------- */

function SeasonView({
  groups,
}: {
  groups: [string, PerformanceWithCompany[]][]
}) {
  if (groups.length === 0) {
    return (
      <p className="py-20 text-center text-[#1A1A1A]/40 text-sm">
        No performances match the current filters.
      </p>
    )
  }
  return (
    <div className="space-y-14">
      {groups.map(([key, list]) => (
        <div key={key}>
          <h2 className="font-serif text-3xl font-light text-[#1A1A1A] mb-2">
            {format(parseISO(`${key}-01`), 'MMMM yyyy')}
          </h2>
          <div className="border-t border-[#1A1A1A]/[0.08]">
            {list.map((p) => (
              <a
                key={p.id}
                href={`/performances/${p.id}`}
                className="group grid grid-cols-[7rem_1fr] sm:grid-cols-[10rem_1fr] gap-4 sm:gap-8 py-5 border-b border-[#1A1A1A]/[0.08] hover:bg-white/60 transition-colors px-2 -mx-2"
              >
                <p className="text-[#1A1A1A]/70 text-sm tabular-nums pt-0.5">
                  {formatRange(p.start_date, p.end_date)}
                </p>
                <div>
                  <h3 className="font-serif text-lg font-light text-[#1A1A1A] group-hover:text-[#1B2A4A] transition-colors">
                    {p.title}
                  </h3>
                  <p className="text-[#1A1A1A]/50 text-sm mt-0.5">
                    {p.company.name} · {KIND_LABEL[p.kind]}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------------- Day detail panel ---------------- */

function DayPanel({
  dayIso,
  list,
  onClose,
}: {
  dayIso: string
  list: PerformanceWithCompany[]
  onClose: () => void
}) {
  const heading = format(parseISO(dayIso), 'EEEE, d MMMM yyyy')
  return (
    <div
      className="fixed inset-0 z-50 flex sm:items-stretch sm:justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={`Performances on ${heading}`}
    >
      <div
        className="absolute inset-0 bg-[#1A1A1A]/30 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative mt-auto sm:mt-0 w-full sm:w-[420px] max-h-[80vh] sm:max-h-none bg-white sm:h-full overflow-y-auto shadow-card-hover animate-fade-in-up sm:animate-fade-in rounded-t-xl sm:rounded-none">
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-[#1A1A1A]/[0.08] px-6 py-5 flex items-start justify-between">
          <div>
            <p className="text-[#D4AF37] text-[10px] tracking-[0.3em] uppercase mb-1">
              {list.length} {list.length === 1 ? 'performance' : 'performances'}
            </p>
            <h3 className="font-serif text-xl font-light text-[#1A1A1A]">{heading}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors mt-1"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-2">
          {list.map((p) => {
            const url = bookingUrl(p)
            return (
              <div key={p.id} className="py-6 border-b border-[#1A1A1A]/[0.07] last:border-0">
                <p className="text-[#D4AF37] text-[10px] tracking-[0.28em] uppercase mb-2">
                  {KIND_LABEL[p.kind]} · {formatRange(p.start_date, p.end_date)}
                </p>
                <a
                  href={`/performances/${p.id}`}
                  className="font-serif text-xl font-light text-[#1A1A1A] hover:text-[#1B2A4A] transition-colors block"
                >
                  {p.title}
                </a>
                <p className="text-[#1A1A1A]/55 text-sm mt-1">
                  {p.company.name}
                  {p.venue ? ` · ${p.venue}` : ''}
                </p>
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 px-5 py-2 bg-[#D4AF37] text-white text-[11px] tracking-[0.2em] uppercase hover:bg-[#B8941F] transition-colors"
                  >
                    Book tickets
                  </a>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ---------------- Filter select ---------------- */

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/35">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white border border-[#1A1A1A]/[0.12] rounded px-4 py-2 text-sm text-[#1A1A1A] focus:border-[#D4AF37] outline-none min-w-[10rem] cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
