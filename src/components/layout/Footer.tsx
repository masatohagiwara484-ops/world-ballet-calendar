import Link from 'next/link'

const NAV = [
  { href: '/', label: 'Globe' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/companies', label: 'Companies' },
  { href: '/partners', label: 'Partners' },
]

export default function Footer() {
  return (
    <footer className="border-t border-[#1A1A1A]/[0.08] bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-14">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
          <div className="max-w-sm">
            <p className="font-serif text-xl font-light text-[#1A1A1A]">
              World Ballet &amp; Opera Calendar
            </p>
            <p className="mt-3 text-[#1A1A1A]/50 text-sm leading-relaxed">
              The world&rsquo;s great ballet and opera, gathered into one
              living season — discover by globe, plan by calendar, follow the
              companies you love.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-col gap-3">
            <p className="text-[#1A1A1A]/35 text-[10px] tracking-[0.3em] uppercase mb-1">
              Explore
            </p>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[#1A1A1A]/60 text-sm hover:text-[#D4AF37] transition-colors w-fit"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-12 pt-6 border-t border-[#1A1A1A]/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-[#1A1A1A]/30 text-xs">
            World Ballet &amp; Opera Calendar &copy; 2026
          </p>
          <p className="text-[#1A1A1A]/30 text-[10px] tracking-[0.2em] uppercase">
            Designed for lovers of the stage
          </p>
        </div>
      </div>
    </footer>
  )
}
