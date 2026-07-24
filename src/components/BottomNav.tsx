import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Users, Compass, NotebookText, TrendingUp, CalendarDays, UserCircle, Plus } from 'lucide-react'
import { paletteHex } from '../lib/palette'
import { useStore } from '../lib/store'
import { NewEntryModal } from './NewEntryModal'

const BAR_BG = paletteHex('vanilla')
const ACCENT = paletteHex('oceanWhisper')
const INACTIVE = paletteHex('oliveShadow')

const LEFT_ITEMS = [
  { to: '/archive', label: 'prompts', Icon: NotebookText },
  { to: '/full-bloom', label: 'your year', Icon: CalendarDays },
  { to: '/lookback', label: 'growth', Icon: TrendingUp },
]

const RIGHT_ITEMS = [
  { to: '/circles', label: 'circles', Icon: Users },
  { to: '/social', label: 'social', Icon: Compass },
  { to: '/profile', label: 'profile', Icon: UserCircle },
]

const ALL_ITEMS = [...LEFT_ITEMS, ...RIGHT_ITEMS]

export function BottomNav() {
  const [open, setOpen] = useState(false)
  const { totalUnreadCount } = useStore()

  return (
    <>
      {/* mobile: fixed bottom bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-black/5 pb-[env(safe-area-inset-bottom)] lg:hidden"
        style={{ background: BAR_BG }}
      >
        <div className="mx-auto grid max-w-5xl grid-cols-7 items-center px-1 py-2">
          {LEFT_ITEMS.map((item) => (
            <TabLink key={item.to} {...item} />
          ))}

          <div className="flex justify-center">
            <button
              onClick={() => setOpen(true)}
              aria-label="New journal entry"
              className="flex h-11 w-11 items-center justify-center rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-transform hover:scale-105 active:scale-95"
              style={{ background: ACCENT }}
            >
              <Plus size={22} strokeWidth={2.2} color={BAR_BG} />
            </button>
          </div>

          {RIGHT_ITEMS.map((item) => (
            <TabLink key={item.to} {...item} badge={item.to === '/circles' ? totalUnreadCount : undefined} />
          ))}
        </div>
      </nav>

      {/* desktop: left sidebar below the header */}
      <nav
        className="fixed bottom-0 left-0 top-[140px] z-30 hidden w-60 flex-col overflow-y-auto border-r border-black/5 px-3 py-6 sm:top-[170px] lg:flex"
        style={{ background: BAR_BG }}
      >
        <button
          onClick={() => setOpen(true)}
          className="mb-6 flex items-center justify-center gap-2 rounded-full py-2.5 text-[13.5px] font-semibold text-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-transform hover:scale-[1.02]"
          style={{ background: ACCENT, fontFamily: 'var(--font-serif)' }}
        >
          <Plus size={16} strokeWidth={2.2} /> New entry
        </button>

        <div className="flex flex-col gap-1">
          {ALL_ITEMS.map((item) => (
            <SideTabLink key={item.to} {...item} badge={item.to === '/circles' ? totalUnreadCount : undefined} />
          ))}
        </div>
      </nav>

      {open && <NewEntryModal onClose={() => setOpen(false)} />}
    </>
  )
}

function TabLink({ to, label, Icon, badge }: { to: string; label: string; Icon: typeof Users; badge?: number }) {
  return (
    <NavLink to={to} className="flex flex-col items-center gap-1 py-1 text-center">
      {({ isActive }) => (
        <>
          <div className="relative">
            <Icon size={19} strokeWidth={2} color={isActive ? ACCENT : INACTIVE} opacity={isActive ? 1 : 0.65} />
            {!!badge && (
              <span
                className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[9px] font-bold leading-none text-black shadow-[0_0_0_1px_rgba(0,0,0,0.06)]"
              >
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </div>
          <span
            className="text-[10px] leading-none"
            style={{
              fontFamily: 'var(--font-serif)',
              fontWeight: 600,
              color: isActive ? ACCENT : INACTIVE,
              opacity: isActive ? 1 : 0.65,
            }}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}

function SideTabLink({ to, label, Icon, badge }: { to: string; label: string; Icon: typeof Users; badge?: number }) {
  return (
    <NavLink to={to} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
      {({ isActive }) => (
        <>
          <Icon size={19} strokeWidth={2} color={isActive ? ACCENT : INACTIVE} opacity={isActive ? 1 : 0.7} />
          <span
            className="flex-1 text-[13.5px] capitalize"
            style={{
              fontFamily: 'var(--font-serif)',
              fontWeight: 600,
              color: isActive ? ACCENT : INACTIVE,
              opacity: isActive ? 1 : 0.85,
            }}
          >
            {label}
          </span>
          {!!badge && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[10px] font-bold leading-none text-black shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}
