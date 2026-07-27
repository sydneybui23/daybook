import { useState } from 'react'
import { Check, ChevronLeft, ChevronRight, ListTodo, LayoutGrid, Pencil, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../lib/store'
import { DEFAULT_HABITS } from '../lib/data'
import type { HabitItem } from '../lib/types'

type View = 'list' | 'grid'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function fullDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

export function DailyHabits() {
  const { habits, updateHabits, habitLogs, toggleHabit } = useStore()
  const [view, setView] = useState<View>('list')
  const [editing, setEditing] = useState(false)
  const [draftHabits, setDraftHabits] = useState<HabitItem[]>(habits)

  const today = todayStr()
  const now = new Date()
  const [monthCursor, setMonthCursor] = useState({ year: now.getFullYear(), month: now.getMonth() })

  const todaysCompleted = habitLogs[today] ?? []

  const saveHabits = () => {
    updateHabits(draftHabits.filter((h) => h.label.trim().length > 0))
    setEditing(false)
  }

  const daysCount = daysInMonth(monthCursor.year, monthCursor.month)
  const days = Array.from({ length: daysCount }, (_, i) => i + 1)

  const dateForDay = (day: number) => {
    const m = String(monthCursor.month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${monthCursor.year}-${m}-${d}`
  }

  const monthLabel = new Date(monthCursor.year, monthCursor.month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  const goMonth = (delta: number) => {
    setMonthCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  return (
    <div className="mx-auto max-w-5xl px-6 pb-32 pt-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[32px] leading-tight" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
            Daily Habits
          </h1>
          <p className="mt-2 text-[14.5px] text-[var(--ink-soft)]">Small things, done daily, add up.</p>
        </div>
        <div className="mt-1 flex shrink-0 gap-1 rounded-full border border-[var(--line)] p-1">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] transition-colors ${
              view === 'list' ? 'bg-[var(--ink)] text-white' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
            }`}
          >
            <ListTodo size={14} /> List
          </button>
          <button
            onClick={() => setView('grid')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] transition-colors ${
              view === 'grid' ? 'bg-[var(--ink)] text-white' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
            }`}
          >
            <LayoutGrid size={14} /> Tracker grid
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="mt-8 rounded-2xl border border-[var(--line)] p-6">
          <p className="text-[13px] uppercase tracking-[0.06em] text-[var(--ink-soft)]">{fullDate(today)}</p>

          {editing ? (
            <div className="mt-5 flex flex-col gap-2.5">
              {draftHabits.map((h, i) => (
                <div key={h.id} className="flex items-center gap-2">
                  <input
                    value={h.label}
                    onChange={(e) =>
                      setDraftHabits((prev) => prev.map((p, idx) => (idx === i ? { ...p, label: e.target.value } : p)))
                    }
                    placeholder="Name a habit..."
                    className="min-w-0 flex-1 rounded-lg border border-[var(--line)] p-2.5 text-[13.5px] outline-none focus:border-[var(--accent)]"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  />
                  <button
                    onClick={() => setDraftHabits((prev) => prev.filter((_, idx) => idx !== i))}
                    aria-label="Delete habit"
                    className="shrink-0 text-[var(--ink-soft)] hover:text-[var(--accent)]"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}

              <button
                onClick={() => setDraftHabits((prev) => [...prev, { id: `h-${Date.now()}`, label: '' }])}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--line)] py-2 text-[12.5px] text-[var(--ink-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <Plus size={14} /> Add habit
              </button>

              <div className="mt-1 flex items-center justify-between">
                <button
                  onClick={() => setDraftHabits(DEFAULT_HABITS)}
                  className="text-[12.5px] text-[var(--ink-soft)] hover:text-[var(--accent)]"
                >
                  Reset to default
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setDraftHabits(habits)
                      setEditing(false)
                    }}
                    className="rounded-full px-4 py-1.5 text-[13px] text-[var(--ink-soft)]"
                  >
                    Cancel
                  </button>
                  <button onClick={saveHabits} className="rounded-full bg-[var(--ink)] px-4 py-1.5 text-[13px] text-white">
                    Save
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-5 flex flex-col gap-2">
                {habits.map((h) => {
                  const done = todaysCompleted.includes(h.id)
                  return (
                    <button
                      key={h.id}
                      onClick={() => toggleHabit(today, h.id)}
                      className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                        done ? 'border-[var(--accent)]/30 bg-[var(--accent-soft)]' : 'border-[var(--line)] hover:border-[var(--accent)]'
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          done ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : 'border-[var(--line)]'
                        }`}
                      >
                        {done && <Check size={12} strokeWidth={3} />}
                      </span>
                      <span
                        className={`text-[14.5px] ${done ? 'text-[var(--ink-soft)] line-through' : 'text-[var(--ink)]'}`}
                        style={{ fontFamily: 'var(--font-serif)', fontWeight: 300 }}
                      >
                        {h.label}
                      </span>
                    </button>
                  )
                })}
                {habits.length === 0 && (
                  <p className="text-[13.5px] text-[var(--ink-soft)]">No habits yet — add your first one below.</p>
                )}
              </div>

              {habits.length > 0 && (
                <p className="mt-4 text-[12.5px] text-[var(--ink-soft)]">
                  {todaysCompleted.length} of {habits.length} done today
                </p>
              )}

              <button
                onClick={() => {
                  setDraftHabits(habits)
                  setEditing(true)
                }}
                className="mt-4 flex items-center gap-1.5 rounded-full border border-[var(--line)] px-4 py-1.5 text-[13px] text-[var(--ink-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <Pencil size={13} /> Edit habits
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-[var(--line)] p-6">
          <div className="mb-5 flex items-center justify-between">
            <button onClick={() => goMonth(-1)} aria-label="Previous month" className="text-[var(--ink-soft)] hover:text-[var(--ink)]">
              <ChevronLeft size={18} />
            </button>
            <p className="text-[14px] text-[var(--ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
              {monthLabel}
            </p>
            <button onClick={() => goMonth(1)} aria-label="Next month" className="text-[var(--ink-soft)] hover:text-[var(--ink)]">
              <ChevronRight size={18} />
            </button>
          </div>

          {habits.length === 0 ? (
            <p className="text-[13.5px] text-[var(--ink-soft)]">Add some habits in the list view to start tracking.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="border-collapse text-center">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-[var(--paper)] px-2 pb-2 text-left text-[11px] uppercase tracking-[0.05em] text-[var(--ink-soft)]">
                      Habit
                    </th>
                    {days.map((d) => (
                      <th key={d} className="w-7 pb-2 text-[10px] font-normal text-[var(--ink-soft)]">
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {habits.map((h) => (
                    <tr key={h.id}>
                      <td
                        className="sticky left-0 z-10 whitespace-nowrap bg-[var(--paper)] pr-3 text-left text-[12.5px] text-[var(--ink)]"
                        style={{ fontFamily: 'var(--font-serif)' }}
                      >
                        {h.label}
                      </td>
                      {days.map((d) => {
                        const date = dateForDay(d)
                        const done = (habitLogs[date] ?? []).includes(h.id)
                        const future = date > today
                        return (
                          <td key={d} className="p-0.5">
                            <button
                              disabled={future}
                              onClick={() => toggleHabit(date, h.id)}
                              aria-label={`${h.label} on ${date}`}
                              className="h-6 w-6 rounded disabled:cursor-not-allowed disabled:opacity-30"
                              style={{ background: done ? 'var(--accent)' : 'var(--line-soft)' }}
                            />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="sticky left-0 z-10 bg-[var(--paper)] pr-3 pt-2 text-left text-[11px] uppercase tracking-[0.05em] text-[var(--ink-soft)]">
                      Completed
                    </td>
                    {days.map((d) => {
                      const date = dateForDay(d)
                      const count = (habitLogs[date] ?? []).length
                      return (
                        <td key={d} className="pt-2 text-[10px] text-[var(--ink-soft)]">
                          {count > 0 ? count : ''}
                        </td>
                      )
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
