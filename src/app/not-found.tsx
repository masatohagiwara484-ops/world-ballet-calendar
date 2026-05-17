import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-8"
      style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F0EA 100%)' }}
    >
      <div className="text-center">
        <p className="text-[#D4AF37] text-xs tracking-[0.3em] uppercase mb-6">404</p>
        <h1 className="font-serif text-5xl md:text-6xl font-light mb-6 text-[#1A1A1A]">
          Page not found
        </h1>
        <p className="text-[#1A1A1A]/40 text-base mb-12 max-w-sm mx-auto leading-relaxed">
          The performance has left the stage.
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-3 border border-[#D4AF37] text-[#D4AF37] text-xs tracking-widest uppercase hover:bg-[#D4AF37]/10 transition-all duration-300"
        >
          Return to Calendar
        </Link>
      </div>
    </div>
  )
}
