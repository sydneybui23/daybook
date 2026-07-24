import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useStore } from '../lib/store'
import { EntryPhoto } from '../components/EntryPhoto'
import { FullEntryOverlay } from '../components/FullEntryOverlay'
import { toPostEntry } from '../lib/entryHelpers'
import type { EntryMode } from '../lib/types'
import type { PostEntry } from '../components/PostCard'

function fmt(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

type Filter = 'all' | EntryMode

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'free', label: 'Free writes' },
  { id: 'guided', label: 'Templates' },
]

export function Archive() {
  const { entries, profile, templateQuestions } = useStore()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [openEntry, setOpenEntry] = useState<PostEntry | null>(null)

  const counts = useMemo(
    () => ({
      all: entries.length,
      free: entries.filter((e) => e.mode === 'free').length,
      guided: entries.filter((e) => e.mode === 'guided').length,
    }),
    [entries],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const sorted = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1))
    const byMode = filter === 'all' ? sorted : sorted.filter((e) => e.mode === filter)
    if (!q) return byMode
    return byMode.filter((e) => e.summary.toLowerCase().includes(q))
  }, [entries, query, filter])

  return (
    <div className="mx-auto max-w-5xl px-6 pb-32 pt-10">
      <h1 className="text-[32px] leading-tight" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
        Past prompts
      </h1>
      <p className="mt-2 text-[14.5px] text-[var(--ink-soft)]">All of your journal entries in one place.</p>

      <div className="mt-6 flex flex-wrap items-center gap-2 rounded-full border border-[var(--line)] p-1 w-fit">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-4 py-1.5 text-[13px] transition-colors ${
              filter === f.id ? 'bg-[var(--ink)] text-white' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
            }`}
          >
            {f.label} <span className="opacity-60">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2.5">
        <Search size={16} className="text-[var(--ink-soft)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your entries..."
          className="w-full border-none bg-transparent text-sm outline-none placeholder:text-[var(--ink-soft)]"
        />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((e) => (
          <button
            key={e.id}
            onClick={() => setOpenEntry(toPostEntry(e, profile.name, 'persianRed', templateQuestions))}
            className="flex items-start gap-4 rounded-2xl border border-[var(--line)] p-4 text-left"
          >
            <EntryPhoto photo={e.photo} iconId={e.iconId} seed={e.id} size={48} radius="14px" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[11px] uppercase tracking-[0.06em] text-[var(--ink-soft)]">{fmt(e.date)}</p>
                <span className="rounded-full bg-[var(--line-soft)] px-2 py-0.5 text-[10px] uppercase tracking-[0.05em] text-[var(--ink-soft)]">
                  {e.mode === 'guided' ? 'Template' : 'Free write'}
                </span>
              </div>
              <p className="mt-1 text-[13.5px] leading-snug text-[var(--ink)]" style={{ fontFamily: 'var(--font-serif)', fontWeight: 300 }}>
                {e.summary}
              </p>
            </div>
          </button>
        ))}
        {filtered.length === 0 && <p className="text-[13.5px] text-[var(--ink-soft)]">No entries match "{query}".</p>}
      </div>

      {openEntry && <FullEntryOverlay entry={openEntry} onBack={() => setOpenEntry(null)} />}
    </div>
  )
}
