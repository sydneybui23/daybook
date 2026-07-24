import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { paletteColorForSeed } from '../lib/palette'
import type { Entry } from '../lib/types'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function YearCalendar({ entries, onOpen }: { entries: Entry[]; onOpen: (entry: Entry) => void }) {
  const [year, setYear] = useState(() => new Date().getFullYear())
  const byDate = useMemo(() => new Map(entries.map((e) => [e.date, e])), [entries])

  return (
    <div>
      <div className="mb-8 flex items-center justify-center gap-6">
        <button onClick={() => setYear((y) => y - 1)} aria-label="Previous year" className="text-[var(--ink-soft)] hover:text-[var(--ink)]">
          <ChevronLeft size={20} />
        </button>
        <p className="text-[20px]" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
          {year}
        </p>
        <button onClick={() => setYear((y) => y + 1)} aria-label="Next year" className="text-[var(--ink-soft)] hover:text-[var(--ink)]">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="flex flex-col gap-8">
        {MONTH_NAMES.map((monthName, mIdx) => {
          const daysInMonth = new Date(year, mIdx + 1, 0).getDate()
          const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

          return (
            <div key={monthName}>
              <p className="mb-2.5 text-[16px] text-black" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
                {monthName}
              </p>
              <div className="grid grid-cols-7 gap-2">
                {days.map((day) => {
                  const dateStr = `${year}-${pad(mIdx + 1)}-${pad(day)}`
                  const entry = byDate.get(dateStr)
                  return (
                    <button
                      key={day}
                      onClick={() => entry && onOpen(entry)}
                      disabled={!entry}
                      className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-[var(--line)] disabled:cursor-default"
                    >
                      {entry &&
                        (entry.photo ? (
                          <img src={entry.photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
                        ) : (
                          <div className="absolute inset-0" style={{ background: paletteColorForSeed(entry.id) }} />
                        ))}
                      <span
                        className="relative z-10 text-[13px] font-bold"
                        style={{
                          fontFamily: 'var(--font-sans)',
                          color: entry ? '#fff' : 'var(--ink-soft)',
                          opacity: entry ? 1 : 0.5,
                          textShadow: entry ? '0 1px 4px rgba(0,0,0,0.55)' : 'none',
                        }}
                      >
                        {day}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
