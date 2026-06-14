import type { Metadata } from 'next'
import { Manrope, Cormorant_Garamond } from 'next/font/google'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ProjectNameLoader from '@/components/loaders/ProjectNameLoader'
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

export const metadata: Metadata = {
  title: {
    template: '%s — World Ballet & Opera Calendar',
    default: 'World Ballet & Opera Calendar',
  },
  description: 'Discover ballet and opera performances around the world. Find upcoming shows from the Royal Ballet, Paris Opéra Ballet, Bolshoi, Metropolitan Opera, and more.',
  keywords: ['ballet', 'opera', 'performances', 'calendar', 'world ballet'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'World Ballet & Opera Calendar',
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
const SITE_NAME = 'World Ballet & Opera Calendar'

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
    <html lang="en" className={`${manrope.variable} ${cormorant.variable}`}>
      <body className="bg-stage text-ivory font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ProjectNameLoader />
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  )
}
