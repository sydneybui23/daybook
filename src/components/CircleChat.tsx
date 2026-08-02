import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Send, Reply, X, Heart, MessageCircle, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useStore, type Comment } from '../lib/store'
import { useAuth } from '../lib/auth'
import { Avatar } from '../lib/avatars'
import { paletteColorForSeed } from '../lib/palette'
import { FullEntryOverlay } from './FullEntryOverlay'
import { ReportButton } from './ReportButton'
import { RichText } from '../lib/richText'
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

function isToday(ts: number) {
  const d = new Date(ts)
  const t = new Date()
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
}

type TimelineItem =
  | { kind: 'entry'; ts: number; entry: CircleEntry }
  | { kind: 'message'; ts: number; message: Comment }

function DeleteMessageButton({ onDelete, light, label = 'Delete message' }: { onDelete: () => void; light?: boolean; label?: string }) {
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
      aria-label={label}
      className={light ? 'text-white/70 hover:text-white' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'}
    >
      {confirming ? <span className="text-[10px]" style={{ color: light ? '#fff' : '#bb4e3f' }}>Confirm delete?</span> : <Trash2 size={11} />}
    </button>
  )
}

function MemberAvatar({ name, color, photo, size }: { name: string; color: string; photo?: string; size: number }) {
  if (photo) {
    return <img src={photo} alt="" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  }
  return <Avatar name={name} color={color} size={size} />
}

export function CircleChat({ circle }: { circle: Circle }) {
  const { profile, commentsFor, addComment, deleteComment, deleteCircleEntry } = useStore()
  const { user } = useAuth()
  const [replyTo, setReplyTo] = useState<CircleEntry | null>(null)
  const [text, setText] = useState('')
  const [openEntry, setOpenEntry] = useState<PostEntry | null>(null)
  const [showPrevious, setShowPrevious] = useState(false)

  const groupMessages = commentsFor(circle.id)

  const photoFor = (name: string, isMe: boolean) =>
    isMe ? profile.photo : circle.members.find((m) => m.name === name)?.photo

  const resolveAuthor = (e: CircleEntry) => {
    const isMe = e.memberId === user?.uid
    const member = circle.members.find((m) => m.id === e.memberId)
    return {
      name: isMe ? profile.name : member?.name ?? 'Member',
      color: isMe ? 'persianRed' : member?.color ?? 'oliveShadow',
      photo: isMe ? profile.photo : member?.photo,
      isMe,
    }
  }

  // newest first, so a new message appears at the top instead of requiring a scroll down
  const timeline = useMemo<TimelineItem[]>(() => {
    const entryItems: TimelineItem[] = circle.entries.map((e) => ({
      kind: 'entry',
      ts: new Date(e.date + 'T12:00:00').getTime(),
      entry: e,
    }))
    const messageItems: TimelineItem[] = groupMessages.map((m) => ({ kind: 'message', ts: m.createdAt, message: m }))
    return [...entryItems, ...messageItems].sort((a, b) => b.ts - a.ts)
  }, [circle.entries, groupMessages])

  const todayItems = useMemo(() => timeline.filter((item) => isToday(item.ts)), [timeline])
  const previousItems = useMemo(() => timeline.filter((item) => !isToday(item.ts)), [timeline])

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

  const renderItem = (item: TimelineItem) => {
    if (item.kind === 'message') {
      const m = item.message
      const isMe = m.author === profile.name
      const photo = photoFor(m.author, isMe)
      return (
        <div key={m.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
          {isMe ? (
            <MemberAvatar name={m.author} color={m.authorColor} photo={photo} size={34} />
          ) : (
            <Link to={`/people/${encodeURIComponent(m.author)}`}>
              <MemberAvatar name={m.author} color={m.authorColor} photo={photo} size={34} />
            </Link>
          )}
          <div className={`flex min-w-0 flex-1 flex-col ${isMe ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[380px] rounded-2xl border p-3.5 ${
                isMe ? 'rounded-tr-sm border-transparent bg-[var(--ink)]' : 'rounded-tl-sm border-[var(--line)] bg-white'
              }`}
            >
              {m.sticker ? (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] ${
                    isMe ? 'bg-white/15 text-white' : 'bg-[var(--line-soft)] text-[var(--ink)]'
                  }`}
                >
                  <Heart size={11} /> {m.text}
                </span>
              ) : (
                <p className={`text-[13.5px] leading-relaxed ${isMe ? 'text-white' : 'text-[var(--ink)]'}`}>{m.text}</p>
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
          <MemberAvatar name={author.name} color={author.color} photo={author.photo} size={34} />
        ) : (
          <Link to={`/people/${encodeURIComponent(author.name)}`}>
            <MemberAvatar name={author.name} color={author.color} photo={author.photo} size={34} />
          </Link>
        )}
        <div className={`flex min-w-0 flex-1 flex-col ${author.isMe ? 'items-end' : 'items-start'}`}>
          <div
            className={`max-w-[380px] rounded-2xl border p-4 ${
              author.isMe ? 'rounded-tr-sm border-transparent bg-[var(--ink)]' : 'rounded-tl-sm border-[var(--line)] bg-white'
            }`}
          >
            <div className={`mb-1.5 flex items-baseline gap-2 ${author.isMe ? 'flex-row-reverse' : ''}`}>
              {author.isMe ? (
                <p className="text-[13.5px] font-medium text-white">You</p>
              ) : (
                <Link
                  to={`/people/${encodeURIComponent(author.name)}`}
                  className="text-[13.5px] font-medium text-[var(--ink)] hover:text-[var(--accent)] hover:underline"
                >
                  {author.name}
                </Link>
              )}
              <p className={`text-[11px] ${author.isMe ? 'text-white/60' : 'text-[var(--ink-soft)]'}`}>{timeLabel(e.date)}</p>
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={() => openFull(e)}
              onKeyDown={(ev) => ev.key === 'Enter' && openFull(e)}
              className="block w-full cursor-pointer text-left"
            >
              {e.photo ? (
                <img src={e.photo} alt="" className="mb-2.5 aspect-[4/3] w-full rounded-xl object-cover" />
              ) : (
                <div
                  className="mb-2.5 aspect-[4/3] w-full rounded-xl"
                  style={{ background: paletteColorForSeed(e.id) }}
                />
              )}
              <RichText
                text={e.fullText ?? e.summary}
                className={`text-[14.5px] leading-relaxed ${author.isMe ? 'text-white' : 'text-[var(--ink)]'}`}
                style={{ fontFamily: 'var(--font-serif)', fontWeight: 300 }}
              />
            </div>

            <div
              className={`mt-2.5 flex items-center gap-4 border-t pt-2.5 ${
                author.isMe ? 'flex-row-reverse border-white/20' : 'border-[var(--line)]'
              }`}
            >
              <button
                onClick={() => setReplyTo(e)}
                className={`flex items-center gap-1 text-[12px] ${
                  author.isMe ? 'text-white/70 hover:text-white' : 'text-[var(--ink-soft)] hover:text-[var(--accent)]'
                }`}
              >
                <Reply size={13} /> Reply to this entry
              </button>
              <button
                onClick={() => openFull(e)}
                className={`flex items-center gap-1 text-[12px] ${
                  author.isMe ? 'text-white/70 hover:text-white' : 'text-[var(--ink-soft)] hover:text-[var(--accent)]'
                }`}
              >
                <MessageCircle size={13} /> {replies.length > 0 ? `${replies.length} comment${replies.length > 1 ? 's' : ''}` : 'Comment'}
              </button>
              {author.isMe && (
                <DeleteMessageButton light label="Remove from circle" onDelete={() => deleteCircleEntry(circle.id, e.id)} />
              )}
            </div>
          </div>

          {replies.length > 0 && (
            <div className="mt-2 flex max-w-[380px] flex-col gap-2 border-l border-[var(--line)] pl-4">
              {replies.map((c) => {
                const isMyReply = c.author === profile.name
                const replyPhoto = photoFor(c.author, isMyReply)
                return (
                  <div key={c.id} className="flex items-start gap-2">
                    {isMyReply ? (
                      <MemberAvatar name={c.author} color={c.authorColor} photo={replyPhoto} size={22} />
                    ) : (
                      <Link to={`/people/${encodeURIComponent(c.author)}`}>
                        <MemberAvatar name={c.author} color={c.authorColor} photo={replyPhoto} size={22} />
                      </Link>
                    )}
                    <div className="min-w-0">
                      {c.sticker ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--line-soft)] px-2.5 py-1 text-[11.5px] text-[var(--ink)]">
                          <Heart size={11} /> {c.text}
                        </span>
                      ) : (
                        <p className="text-[13px] text-[var(--ink)]">
                          {isMyReply ? (
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
                        {isMyReply ? (
                          <DeleteMessageButton onDelete={() => deleteComment(e.id, c.id)} />
                        ) : c.moderationStatus === 'pending' ? (
                          <span className="text-[10px] text-[var(--accent)]">Under review</span>
                        ) : (
                          !c.sticker && <ReportButton entryId={e.id} commentId={c.id} />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="rounded-2xl border border-[var(--line)] bg-white p-3 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
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

      {timeline.length === 0 ? (
        <p className="mt-6 text-[13.5px] text-[var(--ink-soft)]">No messages yet. Say hello!</p>
      ) : (
        <div className="mt-6 flex flex-col gap-5">
          {todayItems.length > 0 ? (
            todayItems.map(renderItem)
          ) : (
            <p className="text-[13.5px] text-[var(--ink-soft)]">Nothing today yet — say hello!</p>
          )}

          {previousItems.length > 0 && (
            <div className="flex flex-col gap-5">
              <button
                onClick={() => setShowPrevious((v) => !v)}
                className="flex items-center gap-1.5 self-center rounded-full border border-[var(--line)] px-4 py-1.5 text-[12.5px] text-[var(--ink-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                {showPrevious ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {showPrevious ? 'Hide previous messages' : `See previous messages (${previousItems.length})`}
              </button>
              {showPrevious && previousItems.map(renderItem)}
            </div>
          )}
        </div>
      )}

      {openEntry && <FullEntryOverlay entry={openEntry} onBack={() => setOpenEntry(null)} />}
    </div>
  )
}
