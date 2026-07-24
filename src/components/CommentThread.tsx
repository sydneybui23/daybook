import { useState } from 'react'
import { Send } from 'lucide-react'
import { useStore } from '../lib/store'
import { Avatar } from '../lib/avatars'
import { ReportButton } from './ReportButton'

const STICKERS = [
  { label: 'Proud of you', emoji: '🥹' },
  { label: 'Way to see your growth', emoji: '🌱' },
  { label: 'Here for you', emoji: '🫂' },
  { label: "You've got this", emoji: '💪' },
]

function timeAgo(ts: number) {
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60000))
  if (mins < 60) return `${mins}m`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.round(hours / 24)}d`
}

export function CommentThread({ entryId }: { entryId: string }) {
  const { profile, commentsFor, addComment } = useStore()
  const [text, setText] = useState('')
  const comments = commentsFor(entryId)

  const postSticker = (label: string) => {
    addComment(entryId, { author: profile.name, authorColor: 'persianRed', text: label, sticker: true })
  }

  const postComment = () => {
    if (!text.trim()) return
    addComment(entryId, { author: profile.name, authorColor: 'persianRed', text: text.trim(), sticker: false })
    setText('')
  }

  return (
    <div className="mt-8 border-t border-[var(--line)] pt-6">
      <p className="mb-3 text-[12px] uppercase tracking-[0.06em] text-[var(--ink-soft)]">Send a little encouragement</p>
      <div className="flex flex-wrap gap-2">
        {STICKERS.map((s) => (
          <button
            key={s.label}
            onClick={() => postSticker(s.label)}
            className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[12.5px] text-[var(--ink)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
          >
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && postComment()}
          placeholder="Leave a comment..."
          className="w-full rounded-full border border-[var(--line)] px-4 py-2.5 text-[13.5px] outline-none focus:border-[var(--accent)]"
        />
        <button
          onClick={postComment}
          aria-label="Send comment"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-white"
        >
          <Send size={15} />
        </button>
      </div>

      {comments.length > 0 && (
        <div className="mt-5 flex flex-col gap-4">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              <Avatar name={c.author} color={c.authorColor} size={26} />
              <div className="min-w-0">
                {c.sticker ? (
                  <span className="inline-flex items-center rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[12.5px] text-[var(--accent)]">
                    {c.text}
                  </span>
                ) : (
                  <p className="text-[13.5px] text-[var(--ink)]">
                    <span className="font-medium">{c.author}</span> {c.text}
                  </p>
                )}
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="text-[10.5px] text-[var(--ink-soft)]">{timeAgo(c.createdAt)} ago</p>
                  {c.moderationStatus === 'pending' ? (
                    <span className="text-[10.5px] text-[var(--accent)]">Under review</span>
                  ) : (
                    !c.sticker && <ReportButton entryId={entryId} commentId={c.id} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
