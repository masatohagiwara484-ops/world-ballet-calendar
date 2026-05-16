import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-8">
      <div className="text-center">
        <p className="text-[#C9A961] text-xs tracking-[0.3em] uppercase mb-6">404</p>
        <h1 className="font-serif text-5xl md:text-6xl font-light mb-6">
          Page not found
        </h1>
        <p className="text-white/30 text-base mb-12 max-w-sm mx-auto leading-relaxed">
          The performance has left the stage.
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-3 border border-[#C9A961] text-[#C9A961] text-xs tracking-widest uppercase hover:bg-[#C9A961]/10 transition-all duration-300"
        >
          Return to Calendar
        </Link>
      </div>
    </div>
  )
}
