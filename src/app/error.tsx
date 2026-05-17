'use client'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F0EA 100%)' }}>
      <div className="text-center">
        <h1 className="font-serif text-4xl md:text-5xl font-light text-[#1A1A1A] mb-4">
          Something went wrong
        </h1>
        <p className="text-[#1A1A1A]/60 mb-8 max-w-md mx-auto">
          We encountered an error while processing your request. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="px-8 py-3 bg-[#D4AF37] text-white text-sm tracking-widest uppercase font-medium rounded hover:bg-[#C9A961] transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
