import { useState } from 'react'
import { X, PenLine, Send } from 'lucide-react'
import { useStore } from '../lib/store'
import { EntryPhoto } from './EntryPhoto'
import { NewEntryModal } from './NewEntryModal'

function fmt(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function ShareToCircleModal({ circleId, circleName, onClose }: { circleId: string; circleName: string; onClose: () => void }) {
  const { entries, shareEntryToCircle } = useStore()
  const [step, setStep] = useState<'choose' | 'pick' | 'new'>('choose')

  if (step === 'new') {
    return (
      <NewEntryModal
        onClose={onClose}
        onSaved={(entry) => shareEntryToCircle(circleId, entry)}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
          <p className="text-[13px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">Share to {circleName}</p>
          <button onClick={onClose} className="text-[var(--ink-soft)] hover:text-[var(--ink)]">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-6">
          {step === 'choose' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => setStep('pick')}
                className="flex flex-col items-start gap-3 rounded-2xl border border-[var(--line)] p-5 text-left transition-colors hover:border-[var(--accent)]"
              >
                <Send size={22} />
                <div>
                  <p className="font-medium text-[var(--ink)]">Share an existing entry</p>
                  <p className="mt-1 text-[13px] text-[var(--ink-soft)]">Pick one of your past entries to share here.</p>
                </div>
              </button>
              <button
                onClick={() => setStep('new')}
                className="flex flex-col items-start gap-3 rounded-2xl border border-[var(--line)] p-5 text-left transition-colors hover:border-[var(--accent)]"
              >
                <PenLine size={22} />
                <div>
                  <p className="font-medium text-[var(--ink)]">Write a new entry</p>
                  <p className="mt-1 text-[13px] text-[var(--ink-soft)]">Write something just for this circle.</p>
                </div>
              </button>
            </div>
          )}

          {step === 'pick' && (
            <div className="flex flex-col gap-3">
              {entries.length === 0 && <p className="text-[13.5px] text-[var(--ink-soft)]">No entries yet.</p>}
              {entries.map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    shareEntryToCircle(circleId, e)
                    onClose()
                  }}
                  className="flex items-center gap-3 rounded-2xl border border-[var(--line)] p-3 text-left hover:border-[var(--accent)]"
                >
                  <EntryPhoto photo={e.photo} iconId={e.iconId} seed={e.id} size={44} radius="12px" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-[0.05em] text-[var(--ink-soft)]">{fmt(e.date)}</p>
                    <p
                      className="truncate text-[13.5px] text-[var(--ink)]"
                      style={{ fontFamily: 'var(--font-serif)', fontWeight: 300 }}
                    >
                      {e.summary}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
