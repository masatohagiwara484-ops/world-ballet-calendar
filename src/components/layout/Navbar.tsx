'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import clsx from 'clsx'

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/search', label: 'Search' },
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
    <div
      className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 pointer-events-none"
      aria-label="Primary navigation region"
    >
      <nav
        aria-label="Primary"
        className={clsx(
          'pointer-events-auto mx-auto max-w-5xl rounded-glass specular',
          'border transition-all duration-500',
          scrolled || open
            ? 'bg-white/[0.07] backdrop-blur-[28px] backdrop-saturate-150 border-white/[0.14] shadow-[0_16px_48px_rgba(0,0,0,0.45)]'
            : 'bg-white/[0.04] backdrop-blur-[20px] backdrop-saturate-150 border-white/[0.10] shadow-[0_8px_28px_rgba(0,0,0,0.35)]'
        )}
      >
        <div className="px-5 sm:px-7 py-3.5 flex items-center justify-between">
          <Link
            href="/"
            className="font-serif text-base sm:text-lg tracking-[0.18em] uppercase text-ivory hover:text-gold transition-colors duration-300"
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
                  'relative text-[11px] tracking-[0.22em] uppercase transition-colors duration-300',
                  isActive(link.href)
                    ? 'text-gold'
                    : 'text-ivory/55 hover:text-ivory'
                )}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-px w-5 bg-gold shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                )}
              </Link>
            ))}
          </div>

          <button
            className="md:hidden text-ivory p-1 hover:text-gold transition-colors duration-300"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open && (
          <div className="md:hidden border-t border-white/[0.10] px-5 pb-3 pt-1">
            <div className="flex flex-col">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={clsx(
                    'py-3 text-sm tracking-[0.18em] uppercase border-b border-white/[0.07] last:border-0 transition-colors duration-300',
                    isActive(link.href)
                      ? 'text-gold'
                      : 'text-ivory/70 hover:text-ivory'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </div>
  )
}
