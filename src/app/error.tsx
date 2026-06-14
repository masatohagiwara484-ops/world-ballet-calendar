'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error('Error caught by error boundary:', error)
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-stage">
      <div className="glass-panel specular text-center px-10 py-14 max-w-md mx-auto">
        <p
          className="mb-5"
          style={{
            color: '#A8842A',
            fontSize: '11px',
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
          }}
        >
          Something went wrong
        </p>
        <h1 className="font-serif text-4xl md:text-5xl text-ivory mb-4">
          An unexpected error occurred
        </h1>
        <p className="text-ivory/70 mb-8 max-w-md mx-auto leading-relaxed text-sm">
          We encountered an error while processing your request. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="px-8 py-3 rounded-full text-sm tracking-widest uppercase font-medium transition-all duration-300 hover:shadow-glow-gold"
          style={{
            background: 'linear-gradient(135deg, #E8C96A 0%, #D4AF37 50%, #B8912E 100%)',
            color: '#FAFAF8',
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
