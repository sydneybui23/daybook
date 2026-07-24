import { useMemo, useState } from 'react'
import { EntryPhoto } from './EntryPhoto'
import type { Entry } from '../lib/types'

function fmt(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function YearWall({ entries, celebrateDate, cellSize }: { entries: Entry[]; celebrateDate?: string; cellSize?: number }) {
  const byDate = useMemo(() => new Map(entries.map((e) => [e.date, e])), [entries])
  const [hovered, setHovered] = useState<Entry | null>(null)

  const days = useMemo(() => {
    const arr: { date: string; entry?: Entry }[] = []
    const today = new Date()
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      arr.push({ date: key, entry: byDate.get(key) })
    }
    return arr
  }, [byDate])

  return (
    <div>
      <div
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: 'repeat(53, minmax(0, 1fr))', gridAutoFlow: 'column', gridTemplateRows: 'repeat(7, 1fr)' }}
      >
        {days.map((d) => (
          <div
            key={d.date}
            onMouseEnter={() => d.entry && setHovered(d.entry)}
            onMouseLeave={() => setHovered(null)}
            className={`flex aspect-square items-center justify-center overflow-hidden rounded-[3px] transition-all ${
              d.date === celebrateDate ? 'scale-125 ring-2 ring-[var(--accent)] ring-offset-1' : ''
            }`}
            style={{ border: d.entry ? 'none' : '1px solid var(--line)' }}
          >
            {d.entry && <EntryPhoto photo={d.entry.photo} iconId={d.entry.iconId} seed={d.entry.id} size={cellSize ?? 11} radius="3px" />}
          </div>
        ))}
      </div>
      <div className="mt-3 flex h-5 items-center gap-2 text-[12.5px] text-[var(--ink-soft)]">
        {hovered ? (
          <>
            <span className="font-medium text-[var(--ink)]">{fmt(hovered.date)}</span>
            <span>·</span>
            <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 300 }}>{hovered.summary}</span>
          </>
        ) : (
          <span>{entries.length} days captured this year. Hover a square to peek back</span>
        )}
      </div>
    </div>
  )
}
