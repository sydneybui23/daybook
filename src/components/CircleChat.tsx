import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Send, Reply, X, Heart, MessageCircle, Trash2 } from 'lucide-react'
import { useStore, type Comment } from '../lib/store'
import { useAuth } from '../lib/auth'
import { Avatar } from '../lib/avatars'
import { paletteColorForSeed } from '../lib/palette'
import { FullEntryOverlay } from './FullEntryOverlay'
import { ReportButton } from './ReportButton'
import type { PostEntry } from './PostCard'
import type { Circle, CircleEntry } from '../lib/types'

function timeLabel(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function timeAgo(ts: number) {
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60000))
  if (mins < 60) return `${mins}m`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.round(hours / 24)}d`
}

type TimelineItem =
  | { kind: 'entry'; ts: number; entry: CircleEntry }
  | { kind: 'message'; ts: number; message: Comment }

function DeleteMessageButton({ onDelete }: { onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false)
  return (
    <button
      onClick={() => {
        if (!confirming) {
          setConfirming(true)
          return
        }
        onDelete()
      }}
      onBlur={() => setConfirming(false)}
      aria-label="Delete message"
      className="text-[var(--ink-soft)] hover:text-[var(--accent)]"
    >
      {confirming ? <span className="text-[10px]" style={{ color: '#bb4e3f' }}>Confirm delete?</span> : <Trash2 size={11} />}
    </button>
  )
}

export function CircleChat({ circle }: { circle: Circle }) {
  const { profile, commentsFor, addComment, deleteComment } = useStore()
  const { user } = useAuth()
  const [replyTo, setReplyTo] = useState<CircleEntry | null>(null)
  const [text, setText] = useState('')
  const [openEntry, setOpenEntry] = useState<PostEntry | null>(null)

  const groupMessages = commentsFor(circle.id)

  const resolveAuthor = (e: CircleEntry) => {
    const isMe = e.memberId === user?.uid
    const member = circle.members.find((m) => m.id === e.memberId)
    return { name: isMe ? profile.name : member?.name ?? 'Member', color: isMe ? 'persianRed' : member?.color ?? 'oliveShadow', isMe }
  }

  const timeline = useMemo<TimelineItem[]>(() => {
    const entryItems: TimelineItem[] = circle.entries.map((e) => ({
      kind: 'entry',
      ts: new Date(e.date + 'T12:00:00').getTime(),
      entry: e,
    }))
    const messageItems: TimelineItem[] = groupMessages.map((m) => ({ kind: 'message', ts: m.createdAt, message: m }))
    return [...entryItems, ...messageItems].sort((a, b) => a.ts - b.ts)
  }, [circle.entries, groupMessages])

  const openFull = (e: CircleEntry) => {
    const author = resolveAuthor(e)
    setOpenEntry({
      id: e.id,
      name: author.name,
      color: author.color,
      summary: e.summary,
      iconId: e.iconId,
      photo: e.photo,
      photos: e.photos,
      fullText: e.fullText,
      date: e.date,
    })
  }

  const send = () => {
    if (!text.trim()) return
    if (replyTo) {
      addComment(replyTo.id, { author: profile.name, authorColor: 'persianRed', text: text.trim(), sticker: false })
    } else {
      addComment(circle.id, { author: profile.name, authorColor: 'persianRed', text: text.trim(), sticker: false })
    }
    setText('')
    setReplyTo(null)
  }

  if (timeline.length === 0) {
    return <p className="text-[13.5px] text-[var(--ink-soft)]">No messages yet. Say hello!</p>
  }

  return (
    <div>
      <div className="flex flex-col gap-5">
        {timeline.map((item) => {
          if (item.kind === 'message') {
            const m = item.message
            const isMe = m.author === profile.name
            return (
              <div key={m.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                {isMe ? (
                  <Avatar name={m.author} color={m.authorColor} size={34} />
                ) : (
                  <Link to={`/people/${encodeURIComponent(m.author)}`}>
                    <Avatar name={m.author} color={m.authorColor} size={34} />
                  </Link>
                )}
                <div className={`flex min-w-0 flex-1 flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[380px] rounded-2xl border p-3.5 ${
                      isMe
                        ? 'rounded-tr-sm border-[var(--accent)]/25 bg-[var(--accent-soft)]'
                        : 'rounded-tl-sm border-[var(--line)] bg-white'
                    }`}
                  >
                    {m.sticker ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[12px] text-[var(--accent)]">
                        <Heart size={11} /> {m.text}
                      </span>
                    ) : (
                      <p className="text-[13.5px] leading-relaxed text-[var(--ink)]">{m.text}</p>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-[10.5px] text-[var(--ink-soft)]">
                      {isMe ? (
                        'You'
                      ) : (
                        <Link to={`/people/${encodeURIComponent(m.author)}`} className="hover:text-[var(--accent)] hover:underline">
                          {m.author}
                        </Link>
                      )}{' '}
                      · {timeAgo(m.createdAt)} ago
                    </p>
                    {isMe ? (
                      <DeleteMessageButton onDelete={() => deleteComment(circle.id, m.id)} />
                    ) : m.moderationStatus === 'pending' ? (
                      <span className="text-[10.5px] text-[var(--accent)]">Under review</span>
                    ) : (
                      !m.sticker && <ReportButton entryId={circle.id} commentId={m.id} />
                    )}
                  </div>
                </div>
              </div>
            )
          }

          const e = item.entry
          const author = resolveAuthor(e)
          const replies = commentsFor(e.id)
          return (
            <div key={e.id} className={`flex gap-3 ${author.isMe ? 'flex-row-reverse' : ''}`}>
              {author.isMe ? (
                <Avatar name={author.name} color={author.color} size={34} />
              ) : (
                <Link to={`/people/${encodeURIComponent(author.name)}`}>
                  <Avatar name={author.name} color={author.color} size={34} />
                </Link>
              )}
              <div className={`flex min-w-0 flex-1 flex-col ${author.isMe ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[380px] rounded-2xl border p-4 ${
                    author.isMe
                      ? 'rounded-tr-sm border-[var(--accent)]/25 bg-[var(--accent-soft)]'
                      : 'rounded-tl-sm border-[var(--line)] bg-white'
                  }`}
                >
                  <div className={`mb-1.5 flex items-baseline gap-2 ${author.isMe ? 'flex-row-reverse' : ''}`}>
                    {author.isMe ? (
                      <p className="text-[13.5px] font-medium text-[var(--ink)]">You</p>
                    ) : (
                      <Link
                        to={`/people/${encodeURIComponent(author.name)}`}
                        className="text-[13.5px] font-medium text-[var(--ink)] hover:text-[var(--accent)] hover:underline"
                      >
                        {author.name}
                      </Link>
                    )}
                    <p className="text-[11px] text-[var(--ink-soft)]">{timeLabel(e.date)}</p>
                  </div>
                  <button onClick={() => openFull(e)} className="block w-full text-left">
                    {e.photo ? (
                      <img src={e.photo} alt="" className="mb-2.5 aspect-[4/3] w-full rounded-xl object-cover" />
                    ) : (
                      <div
                        className="mb-2.5 aspect-[4/3] w-full rounded-xl"
                        style={{ background: paletteColorForSeed(e.id) }}
                      />
                    )}
                    <p
                      className="text-[14.5px] leading-relaxed text-[var(--ink)]"
                      style={{ fontFamily: 'var(--font-serif)', fontWeight: 300 }}
                    >
                      {e.fullText ?? e.summary}
                    </p>
                  </button>

                  <div
                    className={`mt-2.5 flex items-center gap-4 border-t pt-2.5 ${
                      author.isMe ? 'flex-row-reverse border-[var(--accent)]/20' : 'border-[var(--line)]'
                    }`}
                  >
                    <button
                      onClick={() => setReplyTo(e)}
                      className="flex items-center gap-1 text-[12px] text-[var(--ink-soft)] hover:text-[var(--accent)]"
                    >
                      <Reply size={13} /> Reply to this entry
                    </button>
                    <button
                      onClick={() => openFull(e)}
                      className="flex items-center gap-1 text-[12px] text-[var(--ink-soft)] hover:text-[var(--accent)]"
                    >
                      <MessageCircle size={13} /> {replies.length > 0 ? `${replies.length} comment${replies.length > 1 ? 's' : ''}` : 'Comment'}
                    </button>
                  </div>
                </div>

                {replies.length > 0 && (
                  <div className="mt-2 flex max-w-[380px] flex-col gap-2 border-l border-[var(--line)] pl-4">
                    {replies.map((c) => (
                      <div key={c.id} className="flex items-start gap-2">
                        {c.author === profile.name ? (
                          <Avatar name={c.author} color={c.authorColor} size={22} />
                        ) : (
                          <Link to={`/people/${encodeURIComponent(c.author)}`}>
                            <Avatar name={c.author} color={c.authorColor} size={22} />
                          </Link>
                        )}
                        <div className="min-w-0">
                          {c.sticker ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[11.5px] text-[var(--accent)]">
                              <Heart size={11} /> {c.text}
                            </span>
                          ) : (
                            <p className="text-[13px] text-[var(--ink)]">
                              {c.author === profile.name ? (
                                <span className="font-medium">{c.author}</span>
                              ) : (
                                <Link to={`/people/${encodeURIComponent(c.author)}`} className="font-medium hover:text-[var(--accent)] hover:underline">
                                  {c.author}
                                </Link>
                              )}{' '}
                              {c.text}
                            </p>
                          )}
                          <div className="mt-0.5 flex items-center gap-2">
                            <p className="text-[10px] text-[var(--ink-soft)]">{timeAgo(c.createdAt)} ago</p>
                            {c.author === profile.name ? (
                              <DeleteMessageButton onDelete={() => deleteComment(e.id, c.id)} />
                            ) : c.moderationStatus === 'pending' ? (
                              <span className="text-[10px] text-[var(--accent)]">Under review</span>
                            ) : (
                              !c.sticker && <ReportButton entryId={e.id} commentId={c.id} />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="sticky bottom-4 mt-6 rounded-2xl border border-[var(--line)] bg-white p-3 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        {replyTo && (
          <div className="mb-2 flex items-center justify-between rounded-lg bg-[var(--line-soft)] px-3 py-1.5">
            <p className="truncate text-[12px] text-[var(--ink-soft)]">
              Replying to {resolveAuthor(replyTo).name}'s entry: "{replyTo.summary}"
            </p>
            <button onClick={() => setReplyTo(null)} className="shrink-0 text-[var(--ink-soft)] hover:text-[var(--ink)]">
              <X size={14} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={replyTo ? `Reply to ${resolveAuthor(replyTo).name}'s entry...` : 'Send a message to the group...'}
            className="w-full rounded-full border border-[var(--line)] px-4 py-2.5 text-[13.5px] outline-none focus:border-[var(--accent)]"
          />
          <button
            onClick={send}
            aria-label="Send"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-white"
          >
            <Send size={15} />
          </button>
        </div>
      </div>

      {openEntry && <FullEntryOverlay entry={openEntry} onBack={() => setOpenEntry(null)} />}
    </div>
  )
}
