import { useState } from 'react'
import { MoreVertical } from 'lucide-react'
import type { Circle } from '../lib/types'
import { paletteGradient } from '../lib/palette'

function isPhoto(cover: string) {
  return cover.startsWith('data:') || cover.startsWith('blob:') || cover.startsWith('http') || cover.startsWith('/')
}

export function CircleCard({
  circle,
  onClick,
  onEdit,
  unreadCount,
  height = 220,
}: {
  circle: Circle
  onClick?: () => void
  onEdit?: () => void
  unreadCount?: number
  height?: number
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const background = isPhoto(circle.cover)
    ? { backgroundImage: `url(${circle.cover})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: paletteGradient(circle.cover) }

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      className="group relative block w-full overflow-hidden rounded-2xl text-left shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-transform duration-500 hover:scale-[1.02]"
      style={{ height, cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" style={background} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

      {!!unreadCount && (
        <span className="absolute left-3 top-3 z-10 flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-[12px] font-bold leading-none text-black shadow-[0_2px_6px_rgba(0,0,0,0.25)]">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}

      {onEdit && (
        <div className="absolute right-3 top-3 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((v) => !v)
            }}
            aria-label="Circle options"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/45"
          >
            <MoreVertical size={17} />
          </button>
          {menuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-10 w-44 overflow-hidden rounded-xl bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
            >
              <button
                onClick={() => {
                  setMenuOpen(false)
                  onEdit()
                }}
                className="block w-full px-4 py-2.5 text-left text-[13.5px] text-[var(--ink)] hover:bg-[var(--line-soft)]"
              >
                Edit circle
              </button>
            </div>
          )}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-6">
        <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-sans)' }}>
          {circle.name}
        </h3>
        <p className="mt-1 text-sm text-white/80">{circle.description}</p>
        <p className="mt-2 text-[11px] uppercase tracking-[0.08em] text-white/60">
          {circle.members.length} members · private circle
        </p>
      </div>
    </div>
  )
}
