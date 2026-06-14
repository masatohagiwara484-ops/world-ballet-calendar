'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  page: number
  pageSize: number
  total: number
}

export default function Pagination({ page, pageSize, total }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const totalPages = Math.ceil(total / pageSize)

  if (totalPages <= 1) return null

  function goTo(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    router.push(`/search?${params.toString()}`)
  }

  const hasPrev = page > 1
  const hasNext = page < totalPages

  return (
    <nav
      aria-label="Search result pages"
      className="flex items-center justify-center gap-3 py-8"
    >
      <button
        type="button"
        onClick={() => goTo(page - 1)}
        disabled={!hasPrev}
        aria-label="Previous page"
        className={clsx(
          'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-all duration-200',
          hasPrev
            ? 'glass-pill text-ivory/70 hover:text-ivory hover:border-white/[0.2] cursor-pointer'
            : 'text-ivory/20 border border-white/[0.06] cursor-not-allowed'
        )}
      >
        <ChevronLeft size={16} />
        Prev
      </button>

      <span className="text-ivory/40 text-sm px-3">
        Page <span className="text-ivory">{page}</span> of <span className="text-ivory">{totalPages}</span>
      </span>

      <button
        type="button"
        onClick={() => goTo(page + 1)}
        disabled={!hasNext}
        aria-label="Next page"
        className={clsx(
          'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-all duration-200',
          hasNext
            ? 'glass-pill text-ivory/70 hover:text-ivory hover:border-white/[0.2] cursor-pointer'
            : 'text-ivory/20 border border-white/[0.06] cursor-not-allowed'
        )}
      >
        Next
        <ChevronRight size={16} />
      </button>
    </nav>
  )
}
