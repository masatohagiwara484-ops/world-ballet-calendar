'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import clsx from 'clsx'

const LINKS = [
  { href: '/', label: 'Globe' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/companies', label: 'Companies' },
  { href: '/partners', label: 'Partners' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 32)
    handler()
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Close mobile menu on route change.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <nav
      aria-label="Primary"
      className={clsx(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        scrolled || open
          ? 'bg-white/[0.92] backdrop-blur-md border-b border-[#1A1A1A]/[0.08] shadow-sm'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="font-serif text-lg font-light tracking-wider text-[#1A1A1A] hover:text-[#D4AF37] transition-colors"
        >
          Ballet &amp; Opera
        </Link>

        <div className="hidden md:flex items-center gap-9">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={clsx(
                'text-xs tracking-[0.2em] uppercase transition-colors',
                isActive(link.href)
                  ? 'text-[#D4AF37]'
                  : 'text-[#1A1A1A]/45 hover:text-[#1A1A1A]'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <button
          className="md:hidden text-[#1A1A1A] p-1"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-[#1A1A1A]/[0.06] bg-white/95 backdrop-blur-md">
          <div className="px-6 py-4 flex flex-col">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={clsx(
                  'py-3 text-sm tracking-[0.15em] uppercase border-b border-[#1A1A1A]/[0.06] last:border-0',
                  isActive(link.href) ? 'text-[#D4AF37]' : 'text-[#1A1A1A]/70'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
