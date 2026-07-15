import type { Metadata } from 'next'
import { Manrope, Cormorant_Garamond, Italiana, Fraunces, Playfair_Display } from 'next/font/google'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import NewsletterPopup from '@/components/audience/NewsletterPopup'
import './globals.css'

// Body / UI — Manrope (refined geometric sans, weights 300–700)
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
})

// Display / headlines — Cormorant Garamond (couture serif, 400–600)
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

// "The Seasons" substitute — Italiana (delicate high-fashion display serif)
// Scoped to the hero headline/tagline and footer brand text only.
const italiana = Italiana({
  subsets: ['latin'],
  variable: '--font-seasons',
  display: 'swap',
  weight: ['400'],
})

// "Warbler" substitute — Fraunces, soft axis (vintage-feel display serif)
// Scoped to company names and descriptions only.
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-warbler',
  display: 'swap',
  weight: 'variable',
  style: ['normal', 'italic'],
  axes: ['SOFT', 'opsz'],
})

// Footer brand serif — Playfair Display (elegant high-contrast serif with TRUE
// bold weights, so the footer can read at ~700 instead of faux-bolding Italiana).
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '600', '700', '800'],
})

export const metadata: Metadata = {
  // Required so file-based opengraph-image URLs resolve to absolute URLs that
  // social scrapers (X, LINE, iMessage, Slack…) can fetch. Without this, OG
  // image links are relative and previews silently fail.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://worldballetoperacalender.vercel.app'
  ),
  title: {
    template: '%s — première',
    default: 'première — the world’s great stages, worth the journey',
  },
  description: 'première — the world’s great ballet and opera stages, worth the journey. Discover verified performances, plan the trip around them, and book — from the Royal Ballet to the Metropolitan Opera.',
  keywords: ['ballet', 'opera', 'performances', 'calendar', 'première'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'première',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const SITE_URL = 'https://worldballetoperacalender.vercel.app'
const SITE_NAME = 'première'

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
    },
    {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${manrope.variable} ${cormorant.variable} ${italiana.variable} ${fraunces.variable} ${playfair.variable}`}>
      <body className="bg-stage text-ivory font-sans antialiased">
        {/*
          Opening curtain animation — DISABLED (removed from the live site).
          It was freezing the page: the prime-script below locked scroll
          (`wboc-lock`) on first load and only <CurtainReveal /> could unlock it,
          so any hiccup left the site unscrollable until a reload. The component
          (src/components/loaders/CurtainReveal.tsx) and its CSS
          (`wboc-lock`/`wboc-curtain-done` in globals.css) are kept intact.

          To RE-ENABLE later, restore all three pieces:
            1. import CurtainReveal from '@/components/loaders/CurtainReveal'
            2. the prime <script> that adds wboc-lock / wboc-curtain-done
               (see git history of this file), placed before <CurtainReveal />
            3. <CurtainReveal /> just below, before <Navbar />
        */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Navbar />
        {children}
        <Footer />
        <NewsletterPopup />
      </body>
    </html>
  )
}
