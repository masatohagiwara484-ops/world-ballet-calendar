export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-1 h-1 bg-[#C9A961] rounded-full animate-ping" />
        <p className="text-white/20 text-xs tracking-[0.3em] uppercase">Loading</p>
      </div>
    </div>
  )
}
