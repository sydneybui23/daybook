import { useState } from 'react'
import { Flag } from 'lucide-react'
import { useStore } from '../lib/store'
import type { FlagReason } from '../lib/moderation'

const REASONS: { value: FlagReason; label: string }[] = [
  { value: 'bullying', label: 'Bullying' },
  { value: 'racism', label: 'Racism' },
  { value: 'hate', label: 'Hate speech' },
  { value: 'other', label: 'Other' },
]

export function ReportButton({ entryId, commentId }: { entryId: string; commentId: string }) {
  const { reportComment } = useStore()
  const [open, setOpen] = useState(false)
  const [reported, setReported] = useState(false)

  if (reported) {
    return <span className="text-[10.5px] text-[var(--ink-soft)]">Reported</span>
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Report comment"
        className="text-[var(--ink-soft)] hover:text-[var(--ink)]"
      >
        <Flag size={11} />
      </button>
      {open && (
        <div className="absolute left-0 top-5 z-20 w-40 overflow-hidden rounded-xl bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
          {REASONS.map((r) => (
            <button
              key={r.value}
              onClick={() => {
                reportComment(entryId, commentId, r.value)
                setOpen(false)
                setReported(true)
              }}
              className="block w-full px-3.5 py-2 text-left text-[12.5px] text-[var(--ink)] hover:bg-[var(--line-soft)]"
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
