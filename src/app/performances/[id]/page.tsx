export default function PerformancePage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="font-serif text-5xl mb-4">Performance</h1>
        <p className="text-gray-400 text-lg">{params.id}</p>
        <p className="text-gray-600 text-sm mt-8">Detail page — coming Day 2</p>
      </div>
    </main>
  )
}
