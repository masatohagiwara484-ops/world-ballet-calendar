import type { Metadata } from 'next'
import LoginForm from './LoginForm'

export const metadata: Metadata = {
  // The root layout's title template appends " — première".
  title: 'Sign in',
  robots: { index: false, follow: false },
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string }
}) {
  const next = searchParams.next && searchParams.next.startsWith('/') ? searchParams.next : '/my/companies'

  return (
    <main className="min-h-screen flex items-center justify-center px-8 bg-stage">
      <div className="text-center max-w-md w-full">
        <p className="text-gold-deep text-xs tracking-[0.3em] uppercase mb-6">première</p>
        <h1 className="font-serif text-4xl md:text-5xl mb-6 text-gradient-gold">Sign in</h1>
        <p className="text-ivory/70 text-base mb-12 leading-relaxed">
          Enter your email and we&rsquo;ll send you a link to sign in — no password to remember.
        </p>
        <LoginForm next={next} />
      </div>
    </main>
  )
}
