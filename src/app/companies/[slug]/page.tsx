export default function CompanyPage({
  params,
}: {
  params: { slug: string }
}) {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="font-serif text-5xl mb-4">Company</h1>
        <p className="text-gray-400 text-lg">{params.slug}</p>
        <p className="text-gray-600 text-sm mt-8">Detail page — coming Day 2</p>
      </div>
    </main>
  )
}
