import { useState } from 'react'
import { useStore } from '../lib/store'
import { YearCalendar } from '../components/YearCalendar'
import { FullEntryOverlay } from '../components/FullEntryOverlay'
import { toPostEntry } from '../lib/entryHelpers'
import type { Entry } from '../lib/types'
import type { PostEntry } from '../components/PostCard'

export function FullBloom() {
  const { entries, profile, templateQuestions } = useStore()
  const [openEntry, setOpenEntry] = useState<PostEntry | null>(null)

  const onOpen = (e: Entry) => setOpenEntry(toPostEntry(e, profile.name, 'persianRed', templateQuestions))

  return (
    <div className="mx-auto max-w-4xl px-6 pb-32 pt-10 text-center">
      <h1 className="text-[32px] leading-tight" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
        Your Year in Memories
      </h1>
      <p className="mt-2 text-[14.5px] text-[var(--ink-soft)]">
        You'd be surprised by how full your life is when you take the time to notice it.
      </p>
      <p className="mt-1 text-[14.5px] text-[var(--ink-soft)]">{entries.length} of 365 days captured.</p>

      <div className="mt-8 text-left">
        <YearCalendar entries={entries} onOpen={onOpen} />
      </div>

      {openEntry && <FullEntryOverlay entry={openEntry} onBack={() => setOpenEntry(null)} />}
    </div>
  )
}
