import type { Metadata } from 'next'
import { Manrope, Cormorant_Garamond, Italiana, Fraunces, Playfair_Display } from 'next/font/google'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CurtainReveal from '@/components/loaders/CurtainReveal'
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
    default: 'première — every stage in the world',
  },
  description: 'première — discover ballet and opera performances around the world. Find upcoming shows from the Royal Ballet, Paris Opéra Ballet, Bolshoi, Metropolitan Opera, and more.',
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
        {/* Prime the curtain state before first paint so the curtain (not the
            page) is what appears on load, and returning visitors never see it. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var s=localStorage.getItem('wboc_curtain_seen');var r=window.matchMedia('(prefers-reduced-motion: reduce)').matches;var d=document.documentElement;if(s||r){d.classList.add('wboc-curtain-done')}else{d.classList.add('wboc-lock')}}catch(e){}})();",
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <CurtainReveal />
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  )
}
