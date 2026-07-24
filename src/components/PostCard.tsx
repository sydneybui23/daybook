import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Repeat2, Send } from 'lucide-react'
import { photoForIcon } from '../lib/localPhotos'
import { Avatar } from '../lib/avatars'
import type { IconId } from '../lib/types'

export interface PostEntry {
  id: string
  name: string
  color: string
  summary: string
  iconId: IconId
  photo?: string
  fullText?: string
  date: string
}

function fullDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
}

export function PostCard({ entry, onOpen }: { entry: PostEntry; onOpen: (entry: PostEntry) => void }) {
  const [liked, setLiked] = useState(false)

  return (
    <article className="mx-auto flex w-full max-w-[360px] flex-col">
      <button
        onClick={() => onOpen(entry)}
        className="relative aspect-square w-full overflow-hidden rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
      >
        <img src={entry.photo || photoForIcon(entry.iconId, entry.id)} alt="" className="absolute inset-0 h-full w-full object-cover" />
      </button>

      <Link to={`/people/${encodeURIComponent(entry.name)}`} className="flex items-center gap-2.5 px-1 pt-3">
        <Avatar name={entry.name} color={entry.color} size={30} />
        <div className="min-w-0">
          <p className="text-[13.5px] font-medium text-[var(--ink)] hover:underline">{entry.name}</p>
          <p className="text-[11px] text-[var(--ink-soft)]">{fullDate(entry.date)}</p>
        </div>
      </Link>

      <div className="flex items-center gap-4 px-1 pt-3 text-[var(--ink)]">
        <button onClick={() => setLiked((v) => !v)} aria-label="Like">
          <Heart size={21} strokeWidth={1.8} fill={liked ? 'var(--accent)' : 'none'} color={liked ? 'var(--accent)' : 'currentColor'} />
        </button>
        <button onClick={() => onOpen(entry)} aria-label="Comment">
          <MessageCircle size={21} strokeWidth={1.8} />
        </button>
        <button aria-label="Reshare">
          <Repeat2 size={22} strokeWidth={1.8} />
        </button>
        <button aria-label="Send">
          <Send size={19} strokeWidth={1.8} />
        </button>
      </div>

      <button onClick={() => onOpen(entry)} className="px-1 pt-3 text-left">
        <p className="text-[16px] leading-relaxed text-[var(--ink)]" style={{ fontFamily: 'var(--font-serif)', fontWeight: 300 }}>
          {entry.summary}
        </p>
      </button>
    </article>
  )
}
