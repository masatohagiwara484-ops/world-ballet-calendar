export default function Loading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F0EA 100%)' }}
    >
      <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
        <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-ping" />
        <p className="text-[#1A1A1A]/40 text-xs tracking-[0.3em] uppercase">Loading</p>
      </div>
    </div>
  )
}
