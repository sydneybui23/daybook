import { Check, ShieldAlert, X } from 'lucide-react'
import { useStore } from '../lib/store'
import { Avatar } from '../lib/avatars'

const REASON_LABEL: Record<string, string> = {
  bullying: 'Bullying',
  racism: 'Racism',
  hate: 'Hate speech',
  other: 'Other',
}

function timeAgo(ts: number) {
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60000))
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export function Moderation() {
  const { pendingModerationItems, resolveModeration } = useStore()
  const items = pendingModerationItems()

  return (
    <div className="mx-auto max-w-3xl px-6 pb-32 pt-10">
      <div className="flex items-center gap-2">
        <ShieldAlert size={20} className="text-[var(--accent)]" />
        <h1 className="text-[28px] leading-tight" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
          Trust & safety review
        </h1>
      </div>
      <p className="mt-2 text-[14.5px] text-[var(--ink-soft)]">
        Comments flagged by AI or reported by the community land here for a human review before any action is taken. This
        is a demo of that flow — in this app, you're standing in as the reviewer.
      </p>

      {items.length === 0 ? (
        <p className="mt-10 text-center text-[13.5px] text-[var(--ink-soft)]">Nothing pending review right now.</p>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {items.map(({ entryId, comment }) => (
            <div key={comment.id} className="rounded-2xl border border-[var(--line)] p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={comment.author} color={comment.authorColor} size={30} />
                  <div>
                    <p className="text-[13.5px] font-medium text-[var(--ink)]">{comment.author}</p>
                    <p className="text-[11px] text-[var(--ink-soft)]">{timeAgo(comment.createdAt)}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] text-[var(--accent)]">
                  {comment.flagSource === 'ai' ? 'Flagged by AI' : 'Reported by a member'} ·{' '}
                  {REASON_LABEL[comment.flagReason ?? 'other']}
                </span>
              </div>
              <p className="mt-3 rounded-xl bg-[var(--line-soft)] p-3.5 text-[13.5px] text-[var(--ink)]">{comment.text}</p>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={() => resolveModeration(entryId, comment.id, 'rejected')}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--line)] px-4 py-2 text-[13px] text-[var(--ink)] hover:bg-[var(--line-soft)]"
                >
                  <X size={14} /> Dismiss
                </button>
                <button
                  onClick={() => resolveModeration(entryId, comment.id, 'approved')}
                  className="flex items-center gap-1.5 rounded-full bg-[var(--ink)] px-4 py-2 text-[13px] text-white"
                >
                  <Check size={14} /> Confirm violation
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
