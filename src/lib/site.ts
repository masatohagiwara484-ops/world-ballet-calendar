/**
 * The site's canonical origin — ONE place, so moving to a real domain is a
 * single environment-variable change.
 *
 * Set `NEXT_PUBLIC_SITE_URL` in Vercel (and `.env.local`) to the production
 * origin, with no trailing slash: https://example.com
 *
 * Everything that must agree on the origin reads from here: canonical/OG
 * metadata, the sitemap and robots.txt, JSON-LD, share-card artwork and the
 * newsletter emails. Before this existed, three of those had the Vercel
 * hostname hardcoded and would have kept pointing at the old address after a
 * domain switch — a silent split-brain across SEO and email.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://worldballetoperacalender.vercel.app'
).replace(/\/+$/, '')

/** Bare hostname, for the places that show the address as text (share cards). */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '')

export const SITE_NAME = 'première'
