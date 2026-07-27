import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Repeat2, Send } from 'lucide-react'
import { paletteColorForSeed } from '../lib/palette'
import { Avatar } from '../lib/avatars'
import type { IconId } from '../lib/types'

export interface PostEntry {
  id: string
  name: string
  color: string
  summary: string
  iconId: IconId
  photo?: string
  photos?: string[]
  fullText?: string
  date: string
}

function fullDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
}

export function PostCard({ entry, onOpen }: { entry: PostEntry; onOpen: (entry: PostEntry) => void }) {
  const [liked, setLiked] = useState(false)

  return (
    <article className="mx-auto flex w-full max-w-[260px] flex-col">
      <button
        onClick={() => onOpen(entry)}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
      >
        {entry.photo ? (
          <img src={entry.photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: paletteColorForSeed(entry.id) }} />
        )}
        {(entry.photos?.length ?? 0) > 1 && (
          <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white backdrop-blur-sm">
            +{entry.photos!.length - 1}
          </span>
        )}
      </button>

      <Link to={`/people/${encodeURIComponent(entry.name)}`} className="flex items-center gap-2 px-1 pt-2">
        <Avatar name={entry.name} color={entry.color} size={24} />
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-[var(--ink)] hover:underline">{entry.name}</p>
          <p className="text-[10px] text-[var(--ink-soft)]">{fullDate(entry.date)}</p>
        </div>
      </Link>

      <div className="flex items-center gap-3 px-1 pt-2 text-[var(--ink)]">
        <button onClick={() => setLiked((v) => !v)} aria-label="Like">
          <Heart size={17} strokeWidth={1.8} fill={liked ? 'var(--accent)' : 'none'} color={liked ? 'var(--accent)' : 'currentColor'} />
        </button>
        <button onClick={() => onOpen(entry)} aria-label="Comment">
          <MessageCircle size={17} strokeWidth={1.8} />
        </button>
        <button aria-label="Reshare">
          <Repeat2 size={18} strokeWidth={1.8} />
        </button>
        <button aria-label="Send">
          <Send size={15} strokeWidth={1.8} />
        </button>
      </div>

      <button onClick={() => onOpen(entry)} className="px-1 pt-2 text-left">
        <p
          className="line-clamp-2 text-[13px] leading-snug text-[var(--ink)]"
          style={{ fontFamily: 'var(--font-serif)', fontWeight: 300 }}
        >
          {entry.summary}
        </p>
      </button>
    </article>
  )
}
