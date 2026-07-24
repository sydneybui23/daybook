import { useState } from 'react'
import { useStore } from '../lib/store'
import { EntryPhoto } from '../components/EntryPhoto'
import { FullEntryOverlay } from '../components/FullEntryOverlay'
import { toPostEntry } from '../lib/entryHelpers'
import { LOOKBACK_OFFSETS } from '../lib/data'
import { InsightsSection } from '../components/InsightsSection'
import type { PostEntry } from '../components/PostCard'

function offsetLabel(offset: number) {
  return offset === 365 ? '1 year ago' : `${offset} days ago`
}

export function LookBack() {
  const { entries, profile, templateQuestions } = useStore()
  const [openEntry, setOpenEntry] = useState<PostEntry | null>(null)
  const byDate = new Map(entries.map((e) => [e.date, e]))

  const cards = LOOKBACK_OFFSETS.map((offset) => {
    const d = new Date()
    d.setDate(d.getDate() - offset)
    const key = d.toISOString().slice(0, 10)
    return { offset, date: key, entry: byDate.get(key) }
  })

  return (
    <div className="mx-auto max-w-5xl px-6 pb-32 pt-10">
      <h1 className="text-[32px] leading-tight" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
        Growth
      </h1>
      <p className="mt-2 text-[14.5px] text-[var(--ink-soft)]">
        See who you were and how far you've come, 30 days to a year ago.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ offset, date, entry }) => (
          <div key={offset} className="rounded-2xl border border-[var(--line)] p-5">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">{offsetLabel(offset)}</p>
            <p className="mt-0.5 text-[11px] text-[var(--ink-soft)]/70">
              {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
            {entry ? (
              <button
                onClick={() => setOpenEntry(toPostEntry(entry, profile.name, 'persianRed', templateQuestions))}
                className="block w-full text-left"
              >
                <EntryPhoto photo={entry.photo} iconId={entry.iconId} seed={entry.id} size={72} radius="16px" className="my-4" />
                <p className="text-[14px] leading-snug text-[var(--ink)]" style={{ fontFamily: 'var(--font-serif)', fontWeight: 300 }}>
                  {entry.summary}
                </p>
              </button>
            ) : (
              <p className="mt-8 text-[13px] text-[var(--ink-soft)]">No entry from this day yet.</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-10">
        <InsightsSection />
      </div>

      {openEntry && <FullEntryOverlay entry={openEntry} onBack={() => setOpenEntry(null)} />}
    </div>
  )
}
