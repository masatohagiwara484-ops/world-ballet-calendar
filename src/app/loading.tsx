export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stage">
      <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
        <div className="w-1.5 h-1.5 bg-gold rounded-full animate-ping" />
        <p className="text-ivory/60 text-xs tracking-[0.3em] uppercase">Loading</p>
      </div>
    </div>
  )
}
