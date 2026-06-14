'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import clsx from 'clsx'
import type { Suggestion } from '@/lib/search'

interface Props {
  size?: 'hero' | 'default'
  initialQuery?: string
}

const TYPE_ICON: Record<Suggestion['type'], string> = {
  work: '♩',
  person: '◎',
  company: '◈',
  city: '◉',
}

const TYPE_LABEL: Record<Suggestion['type'], string> = {
  work: 'Work',
  person: 'Artist',
  company: 'Company',
  city: 'City',
}

export default function SearchBox({ size = 'default', initialQuery = '' }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSuggestions([]); setOpen(false); return }
    try {
      const res = await fetch(`/api/suggest?q=${encodeURIComponent(q.trim())}`)
      if (!res.ok) return
      const data = await res.json() as { suggestions: Suggestion[] }
      setSuggestions(data.suggestions)
      setOpen(data.suggestions.length > 0)
      setActive(-1)
    } catch {
      // network failure — silently ignore
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { void fetchSuggestions(query) }, 250)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, fetchSuggestions])

  function navigate(params: Record<string, string>) {
    const qs = new URLSearchParams(params).toString()
    router.push(`/search?${qs}`)
    setOpen(false)
    setSuggestions([])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (active >= 0 && suggestions[active]) {
      navigate(suggestions[active].params)
      return
    }
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setOpen(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((prev) => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((prev) => Math.max(prev - 1, -1))
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActive(-1)
    }
  }

  function clear() {
    setQuery('')
    setSuggestions([])
    setOpen(false)
    setActive(-1)
    inputRef.current?.focus()
  }

  const isHero = size === 'hero'

  return (
    <div className="relative w-full">
      {/* ARIA combobox pattern: aria-expanded lives on the outer div, not the input */}
      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls="search-suggestions"
        aria-owns="search-suggestions"
      >
        <form role="search" onSubmit={handleSubmit} className="relative">
          <label htmlFor="search-input" className="sr-only">
            Search performances, works, artists, companies
          </label>

          {/* Search icon */}
          <Search
            size={isHero ? 20 : 17}
            aria-hidden
            className={clsx(
              'absolute top-1/2 -translate-y-1/2 text-ivory/40 pointer-events-none z-10',
              isHero ? 'left-6' : 'left-4'
            )}
          />

          <input
            ref={inputRef}
            id="search-input"
            type="search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (suggestions.length > 0) setOpen(true) }}
            onBlur={() => { setTimeout(() => setOpen(false), 150) }}
            placeholder={isHero ? 'Search Swan Lake, Bolshoi Ballet, Tokyo…' : 'Search performances, artists, works…'}
            aria-label="Search"
            aria-autocomplete="list"
            aria-controls={open ? 'search-suggestions' : undefined}
            aria-activedescendant={active >= 0 ? `suggestion-${active}` : undefined}
            className={clsx(
              'w-full glass-panel',
              'bg-white/[0.04] hover:bg-white/[0.07] focus:bg-white/[0.07]',
              'text-ivory placeholder:text-ivory/38',
              'border border-white/[0.12] focus:border-gold/50',
              'outline-none transition-all duration-300',
              'focus:shadow-[0_0_0_2px_rgba(212,175,55,0.35),0_16px_48px_rgba(0,0,0,0.45)]',
              isHero
                ? 'text-lg pl-14 pr-12 py-5 rounded-glass'
                : 'text-sm pl-11 pr-9 py-3.5 rounded-glass'
            )}
          />

          {/* Clear button */}
          {query.length > 0 && (
            <button
              type="button"
              onClick={clear}
              aria-label="Clear search"
              className={clsx(
                'absolute top-1/2 -translate-y-1/2 text-ivory/40 hover:text-ivory/70 transition-colors z-10',
                isHero ? 'right-5' : 'right-3'
              )}
            >
              <X size={isHero ? 18 : 15} />
            </button>
          )}
        </form>
      </div>

      {/* Suggestions dropdown */}
      {open && suggestions.length > 0 && (
        <ul
          ref={listRef}
          id="search-suggestions"
          role="listbox"
          aria-label="Suggestions"
          className="absolute top-full mt-2 left-0 right-0 z-50 glass-panel overflow-hidden animate-fade-in"
        >
          {suggestions.map((s, i) => (
            <li
              key={i}
              id={`suggestion-${i}`}
              role="option"
              aria-selected={i === active}
              className={clsx(
                'flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors duration-150',
                'border-b border-white/[0.06] last:border-0',
                i === active ? 'bg-gold/[0.12]' : 'hover:bg-white/[0.06]'
              )}
              onMouseDown={(e) => {
                e.preventDefault()
                navigate(s.params)
              }}
            >
              <span className="text-gold text-base w-5 text-center flex-shrink-0 select-none">
                {TYPE_ICON[s.type]}
              </span>
              <div className="min-w-0 flex-1">
                <span className="text-ivory text-sm">{s.label}</span>
                {s.sublabel && (
                  <span className="ml-2 text-ivory/40 text-xs">{s.sublabel}</span>
                )}
              </div>
              <span className="text-[10px] tracking-[0.22em] uppercase text-ivory/30 flex-shrink-0">
                {TYPE_LABEL[s.type]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
