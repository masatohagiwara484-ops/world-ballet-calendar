import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-8 bg-stage">
      <div className="text-center">
        <p className="text-gold text-xs tracking-[0.3em] uppercase mb-6">404</p>
        <h1 className="font-serif text-5xl md:text-6xl mb-6 text-gradient-gold">
          Page not found
        </h1>
        <p className="text-ivory/62 text-base mb-12 max-w-sm mx-auto leading-relaxed">
          The performance has left the stage.
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-3 rounded-full border border-gold/60 text-gold text-xs tracking-widest uppercase hover:bg-gold/10 hover:shadow-glow-gold transition-all duration-300"
        >
          Return to Calendar
        </Link>
      </div>
    </div>
  )
}
