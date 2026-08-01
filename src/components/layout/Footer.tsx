import Link from 'next/link'

const NAV = [
  { href: '/', label: 'Globe' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/companies', label: 'Companies' },
  { href: '/trips', label: 'Trips' },
  { href: '/partners', label: 'Partners' },
]

/** Contact + the legal pages, kept quiet but always reachable (ROADMAP M5/M7). */
const LEGAL = [
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/disclosure', label: 'Disclosure' },
]

export default function Footer() {
  return (
    <footer className="mt-24 px-4 pb-6">
      <div className="glass-panel specular mx-auto max-w-7xl px-6 md:px-12 py-14">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
          <div className="max-w-xl">
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/premiere-mark-gold.png"
                alt=""
                aria-hidden
                className="h-14 w-auto"
              />
              <p className="font-serif text-[3.25rem] leading-none lowercase tracking-[0.01em] text-gradient-gold">
                premi&egrave;re
              </p>
            </div>
            <p className="font-playfair font-bold mt-6 text-ivory/70 text-[1.75rem] leading-snug">
              The world&rsquo;s great ballet and opera, gathered into one
              living season — discover by globe, plan by calendar, follow the
              companies you love.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-col gap-3">
            <p
              className="mb-1"
              style={{
                color: 'rgba(26,26,26,0.45)',
                fontSize: '10px',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
              }}
            >
              Explore
            </p>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-ivory/70 text-sm hover:text-gold-deep transition-colors duration-300 w-fit"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div
          className="mt-12 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          style={{ borderTop: '1px solid rgba(26,22,15,0.10)' }}
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p
              style={{
                color: 'rgba(26,26,26,0.45)',
                fontSize: '12px',
              }}
            >
              premi&egrave;re &copy; 2026
            </p>
            {/* Contact and the legal pages: quiet, but always reachable — a
                product that promises verified dates needs an obvious way to
                report a wrong one. */}
            {LEGAL.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-gold-deep transition-colors duration-300"
                style={{ color: 'rgba(26,26,26,0.55)', fontSize: '15px' }}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <p
            style={{
              color: 'rgba(26,26,26,0.40)',
              fontSize: '10px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            Designed for lovers of the stage
          </p>
        </div>
      </div>
    </footer>
  )
}
