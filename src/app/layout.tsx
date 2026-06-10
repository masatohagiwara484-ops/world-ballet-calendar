import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ProjectNameLoader from '@/components/loaders/ProjectNameLoader'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: ['400', '500', '700'],
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
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-[#FAFAF8] text-[#1A1A1A] font-sans">
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
