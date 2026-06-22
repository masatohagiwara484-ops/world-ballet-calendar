'use client'

/**
 * AddToCalendar — a small "Add to Calendar" control for a performance run.
 *
 * Opens a menu with two routes that cover essentially every calendar app:
 *   • Apple / Outlook / other — downloads an .ics file (built client-side)
 *   • Google Calendar — opens a prefilled "create event" tab
 *
 * Styled as an outline button so it sits correctly on the dark gradient hero
 * next to "Book tickets"; the menu itself is a white card so its items read on
 * any background.
 */
import { useEffect, useRef, useState } from 'react'
import { CalendarPlus, Check } from 'lucide-react'
import {
  icsContent,
  googleCalendarUrl,
  icsFilename,
  type CalendarEvent,
} from '@/lib/calendar'

export default function AddToCalendar({ event }: { event: CalendarEvent }) {
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function downloadIcs() {
    const blob = new Blob([icsContent(event)], { type: 'text/calendar;charset=utf-8' })
    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href
    a.download = icsFilename(event)
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(href)
    setSaved(true)
    setOpen(false)
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-2 px-7 py-4 rounded-full border border-white/35 text-white text-xs tracking-[0.22em] uppercase font-semibold hover:border-gold hover:text-gold transition-colors"
      >
        {saved ? <Check size={14} /> : <CalendarPlus size={14} />}
        {saved ? 'Added' : 'Add to calendar'}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-2 z-50 w-60 rounded-2xl bg-white border border-black/[0.08] shadow-xl overflow-hidden"
        >
          <a
            role="menuitem"
            href={googleCalendarUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="block px-5 py-3.5 text-sm text-ivory hover:bg-black/[0.04] transition-colors"
          >
            Google Calendar
          </a>
          <button
            role="menuitem"
            type="button"
            onClick={downloadIcs}
            className="block w-full text-left px-5 py-3.5 text-sm text-ivory hover:bg-black/[0.04] transition-colors border-t border-black/[0.06]"
          >
            Apple / Outlook
            <span className="block text-ivory/45 text-[11px] mt-0.5">Download .ics file</span>
          </button>
        </div>
      )}
    </div>
  )
}
