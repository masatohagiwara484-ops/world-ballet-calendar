'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import clsx from 'clsx'
import type { SearchSort } from '@/lib/types'

const OPTIONS: { value: SearchSort; label: string }[] = [
  { value: 'date', label: 'Date' },
  { value: 'relevance', label: 'Relevance' },
  { value: 'price', label: 'Price' },
]

interface Props {
  current?: SearchSort
}

export default function SortControl({ current = 'date' }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function setSort(sort: SearchSort) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', sort)
    params.delete('page')
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Sort results by">
      <span className="text-[11px] tracking-[0.22em] uppercase text-ivory/38 mr-2">Sort</span>
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setSort(opt.value)}
          aria-pressed={current === opt.value}
          className={clsx(
            'px-3.5 py-1.5 text-[11px] tracking-[0.18em] uppercase rounded-full transition-all duration-200',
            current === opt.value
              ? 'bg-gold/[0.15] border border-gold/40 text-gold-deep'
              : 'text-ivory/60 hover:text-ivory border border-black/[0.10] hover:border-black/[0.20]'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
