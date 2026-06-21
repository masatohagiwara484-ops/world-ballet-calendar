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
            ? [
                'backdrop-blur-[28px] backdrop-saturate-[140%]',
                'shadow-[0_16px_48px_rgba(26,22,15,0.14),inset_0_1px_0_rgba(255,255,255,0.95)]',
                'bg-white/80 border-[rgba(26,22,15,0.10)]',
              ]
            : [
                'backdrop-blur-[20px] backdrop-saturate-[140%]',
                'shadow-[0_8px_28px_rgba(26,22,15,0.09),inset_0_1px_0_rgba(255,255,255,0.85)]',
                'bg-white/62 border-[rgba(26,22,15,0.08)]',
              ]
        )}
      >
        <div className="px-5 sm:px-7 py-3.5 flex items-center justify-between">
          {/* Brand lockup — première monogram + wordmark */}
          <Link
            href="/"
            aria-label="première — home"
            className="group flex items-center gap-2.5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/premiere-mark-ink.png"
              alt=""
              aria-hidden
              className="h-7 sm:h-8 w-auto transition-opacity duration-300 group-hover:opacity-80"
            />
            <span className="flex flex-col leading-none">
              <span className="font-serif text-lg sm:text-xl lowercase tracking-[0.04em] text-ivory transition-colors duration-300 group-hover:text-gold-deep">
                premi&egrave;re
              </span>
              <span className="hidden sm:block text-[8px] tracking-[0.34em] uppercase text-ivory/45 mt-0.5">
                Ballet &amp; Opera
              </span>
            </span>
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
                    ? 'text-gold-deep'
                    : 'text-ivory/70 hover:text-ivory'
                )}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-px w-5 bg-gold-deep" />
                )}
              </Link>
            ))}
          </div>

          <button
            className="md:hidden text-ivory p-1 hover:text-gold-deep transition-colors duration-300"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu — solid light background for readability */}
        {open && (
          <div
            className="md:hidden px-5 pb-4 pt-1"
            style={{
              borderTop: '1px solid rgba(26,22,15,0.09)',
              background: 'rgba(255,255,255,0.96)',
              borderBottomLeftRadius: '20px',
              borderBottomRightRadius: '20px',
            }}
          >
            <div className="flex flex-col">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={clsx(
                    'py-3 text-sm tracking-[0.18em] uppercase transition-colors duration-300',
                    'border-b last:border-0',
                    isActive(link.href)
                      ? 'text-gold-deep border-[rgba(26,22,15,0.08)]'
                      : 'text-ivory/80 hover:text-ivory border-[rgba(26,22,15,0.06)]'
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
