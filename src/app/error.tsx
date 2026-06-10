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
        <h1 className="font-serif text-4xl md:text-5xl text-ivory mb-4">
          Something went wrong
        </h1>
        <p className="text-ivory/62 mb-8 max-w-md mx-auto leading-relaxed">
          We encountered an error while processing your request. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="px-8 py-3 bg-gold text-stage text-sm tracking-widest uppercase font-medium rounded-full hover:shadow-glow-gold transition-all duration-300"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
