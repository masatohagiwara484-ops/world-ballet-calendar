/**
 * TripBundleStrip — the travel bundle, rendered as ordered steps:
 * (Tickets →) Hotel → Experiences → Flight → Attractions.
 *
 * One component serves every surface: `vertical` is the compact sidebar list
 * (performance pages), `grid` is the numbered step board on /trips pages.
 * Links and live/pending state come from tripBundle() in src/lib/affiliate.ts,
 * so ordering and disclosure can never drift between surfaces.
 */
import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  Building2,
  Compass,
  Plane,
  Landmark,
  Ticket,
  ExternalLink,
} from 'lucide-react'
import { tripBundle, type BundleKey, type TripContext } from '@/lib/affiliate'

const ICONS: Record<BundleKey, typeof Building2> = {
  hotels: Building2,
  experiences: Compass,
  flights: Plane,
  attractions: Landmark,
}

interface Step {
  key: string
  label: string
  sub: string
  href: string
  Icon: typeof Building2
  external: boolean
  sponsored: boolean
}

export interface TicketsStep {
  href: string
  label: string
  sub?: string
  /** Internal links render with next/link and no sponsored rel. */
  external?: boolean
}

interface Props {
  ctx: TripContext
  variant?: 'vertical' | 'grid'
  /** Optional first step — where to buy the performance ticket (page-specific). */
  tickets?: TicketsStep
  /** Hide the referral-fee disclosure (when the page renders its own). */
  hideDisclosure?: boolean
}

/** External steps get a sponsored-aware anchor; internal steps a next/link. */
function StepLink({
  step,
  className,
  children,
}: {
  step: Step
  className: string
  children: ReactNode
}) {
  if (!step.external) {
    return (
      <Link href={step.href} className={className}>
        {children}
      </Link>
    )
  }
  return (
    <a
      href={step.href}
      target="_blank"
      rel={step.sponsored ? 'noopener noreferrer sponsored' : 'noopener noreferrer'}
      className={className}
    >
      {children}
    </a>
  )
}

export default function TripBundleStrip({
  ctx,
  variant = 'vertical',
  tickets,
  hideDisclosure,
}: Props) {
  const steps: Step[] = []

  if (tickets) {
    steps.push({
      key: 'tickets',
      label: tickets.label,
      sub: tickets.sub ?? 'Step one — the performance',
      href: tickets.href,
      Icon: Ticket,
      external: tickets.external ?? false,
      sponsored: false,
    })
  }
  for (const link of tripBundle(ctx)) {
    steps.push({
      key: link.key,
      label: link.label,
      sub: link.partner,
      href: link.href,
      Icon: ICONS[link.key],
      external: true,
      sponsored: true,
    })
  }

  const disclosure = !hideDisclosure && (
    <p className="mt-4 text-ivory/35 text-[10px] leading-relaxed">
      We may earn a referral fee on bookings made through these links — at no
      extra cost to you.
    </p>
  )

  if (variant === 'grid') {
    return (
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {steps.map((step, i) => (
            <StepCard key={step.key} step={step} index={i} />
          ))}
        </div>
        {disclosure}
      </div>
    )
  }

  return (
    <div>
      <ul className="space-y-2.5">
        {steps.map((step) => {
          const { Icon } = step
          return (
            <li key={step.key}>
              <StepLink
                step={step}
                className="flex items-center gap-3 rounded-xl px-3 py-3 bg-white/[0.03] hover:bg-white/[0.06] transition-colors group"
              >
                <Icon size={18} className="text-gold-deep shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="block text-ivory text-sm">{step.label}</span>
                  <span className="block text-ivory/40 text-[11px]">{step.sub}</span>
                </span>
                <ExternalLink
                  size={13}
                  className="text-ivory/30 group-hover:text-gold-deep transition-colors"
                />
              </StepLink>
            </li>
          )
        })}
      </ul>
      {disclosure}
    </div>
  )
}

function StepCard({ step, index }: { step: Step; index: number }) {
  const { Icon } = step
  return (
    <StepLink step={step} className="glass-card specular rounded-glass p-6 block group">
      <div className="flex items-start justify-between mb-5">
        <span className="font-serif text-gold-deep/60 text-2xl leading-none tabular-nums">
          {String(index + 1).padStart(2, '0')}
        </span>
        <Icon size={20} className="text-gold-deep" />
      </div>
      <p className="text-ivory text-base font-medium leading-snug mb-1 group-hover:text-gold transition-colors">
        {step.label}
      </p>
      <p className="text-ivory/45 text-[11px] tracking-[0.12em] uppercase flex items-center gap-1.5">
        {step.sub}
        <ExternalLink
          size={11}
          className="text-ivory/30 group-hover:text-gold-deep transition-colors"
        />
      </p>
    </StepLink>
  )
}
