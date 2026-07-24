import { useState } from 'react'
import { X, PenLine, ListChecks, ScanLine, Camera, CalendarDays, Sparkles, Globe2 } from 'lucide-react'
import { pickIcon } from '../lib/pickIcon'
import { useStore } from '../lib/store'
import type { Entry, EntryMode } from '../lib/types'

type Step = 'choose' | 'free' | 'guided' | 'scan' | 'summarize'

const MOCK_TRANSCRIPTION =
  "Today felt like one of those days where nothing and everything happened at once. I keep coming back to how grateful I am for the people who checked in on me without me having to ask. Trying to hold onto that feeling a little longer than usual."

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function DateField({ date, onDateChange }: { date: string; onDateChange: (d: string) => void }) {
  return (
    <label className="flex flex-1 items-center gap-2 rounded-xl border border-[var(--line)] px-3 py-2.5">
      <CalendarDays size={16} className="shrink-0 text-[var(--ink-soft)]" />
      <input
        type="date"
        value={date}
        max={todayStr()}
        onChange={(e) => onDateChange(e.target.value)}
        className="w-full bg-transparent text-[13.5px] text-[var(--ink)] outline-none"
      />
    </label>
  )
}

function DateAndPhotoHeader({
  date,
  onDateChange,
  photo,
  onPhotoFile,
}: {
  date: string
  onDateChange: (d: string) => void
  photo?: string
  onPhotoFile: (f: File) => void
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <DateField date={date} onDateChange={onDateChange} />
      <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[var(--line)] px-3 py-2.5 text-[13px] text-[var(--ink-soft)] hover:border-[var(--accent)]">
        {photo ? (
          <img src={photo} alt="" className="h-5 w-5 rounded object-cover" />
        ) : (
          <Camera size={16} />
        )}
        {photo ? 'Photo added' : 'Add photo'}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onPhotoFile(e.target.files[0])}
        />
      </label>
    </div>
  )
}

export function NewEntryModal({
  onClose,
  onSaved,
  initialStep,
  initialMode,
  initialSummary,
  initialDate,
}: {
  onClose: () => void
  onSaved?: (entry: Entry) => void
  initialStep?: Step
  initialMode?: EntryMode
  initialSummary?: string
  initialDate?: string
}) {
  const { addEntry, templateQuestions, profile } = useStore()
  const [step, setStep] = useState<Step>(initialStep ?? 'choose')
  const [mode, setMode] = useState<EntryMode>(initialMode ?? 'free')
  const [entryDate, setEntryDate] = useState(initialDate ?? todayStr())
  const [freeText, setFreeText] = useState(initialSummary ?? '')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [summary, setSummary] = useState(initialSummary ?? '')
  const [photo, setPhoto] = useState<string | undefined>(undefined)
  const [scanning, setScanning] = useState(false)
  const [isPublic, setIsPublic] = useState(profile.shareByDefault)

  const goSummarize = () => {
    if (mode === 'free') setSummary(freeText.split(/(?<=[.!?])\s/)[0] ?? freeText)
    setStep('summarize')
  }

  const onPhotoFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => setPhoto(reader.result as string)
    reader.readAsDataURL(file)
  }

  const onScanFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      setPhoto(reader.result as string)
      setScanning(true)
      setTimeout(() => {
        setFreeText(MOCK_TRANSCRIPTION)
        setMode('free')
        setScanning(false)
      }, 1400)
    }
    reader.readAsDataURL(file)
  }

  const save = () => {
    const entry: Entry = {
      id: `e-${Date.now()}`,
      date: entryDate,
      summary,
      iconId: pickIcon(summary),
      mode,
      photo,
      public: isPublic,
      freeText: mode === 'free' ? freeText : undefined,
      answers: mode === 'guided' ? answers : undefined,
    }
    addEntry(entry)
    onSaved?.(entry)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
          <p className="text-[13px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">
            {step === 'choose' && 'New entry'}
            {step === 'free' && 'Just write'}
            {step === 'guided' && 'Guided template'}
            {step === 'scan' && 'Scan handwriting'}
            {step === 'summarize' && 'Summarize your day'}
          </p>
          <button onClick={onClose} className="text-[var(--ink-soft)] hover:text-[var(--ink)]">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-6">
          {step === 'choose' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => {
                  setMode('free')
                  setStep('free')
                }}
                className="flex flex-col items-start gap-3 rounded-2xl border border-[var(--line)] p-5 text-left transition-colors hover:border-[var(--accent)]"
              >
                <PenLine size={22} />
                <div>
                  <p className="font-medium text-[var(--ink)]">Just write</p>
                  <p className="mt-1 text-[13px] text-[var(--ink-soft)]">A blank page, write whatever is on your mind.</p>
                </div>
              </button>
              <button
                onClick={() => {
                  setMode('guided')
                  setStep('guided')
                }}
                className="flex flex-col items-start gap-3 rounded-2xl border border-[var(--line)] p-5 text-left transition-colors hover:border-[var(--accent)]"
              >
                <ListChecks size={22} />
                <div>
                  <p className="font-medium text-[var(--ink)]">Guided template</p>
                  <p className="mt-1 text-[13px] text-[var(--ink-soft)]">Your reflection questions, one at a time.</p>
                </div>
              </button>
              <button
                onClick={() => {
                  setMode('free')
                  setStep('scan')
                }}
                className="flex flex-col items-start gap-3 rounded-2xl border border-[var(--line)] p-5 text-left transition-colors hover:border-[var(--accent)] sm:col-span-2"
              >
                <ScanLine size={22} />
                <div>
                  <p className="font-medium text-[var(--ink)]">Scan handwriting</p>
                  <p className="mt-1 text-[13px] text-[var(--ink-soft)]">
                    Snap a photo of a handwritten page and let AI transcribe it.
                  </p>
                </div>
              </button>
            </div>
          )}

          {step === 'free' && (
            <div className="flex flex-col gap-4">
              <DateAndPhotoHeader date={entryDate} onDateChange={setEntryDate} photo={photo} onPhotoFile={onPhotoFile} />
              <textarea
                autoFocus
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="Today..."
                rows={10}
                className="w-full resize-none rounded-xl border border-[var(--line)] p-4 text-[15px] leading-relaxed outline-none focus:border-[var(--accent)]"
              />
              <button
                disabled={!freeText.trim()}
                onClick={goSummarize}
                className="ml-auto rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm text-white disabled:opacity-30"
              >
                Continue
              </button>
            </div>
          )}

          {step === 'scan' && (
            <div className="flex flex-col gap-4">
              <DateField date={entryDate} onDateChange={setEntryDate} />

              {!photo && !scanning && (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--line)] px-4 py-10 text-center hover:border-[var(--accent)]">
                  <ScanLine size={28} className="text-[var(--ink-soft)]" />
                  <span className="text-[13.5px] text-[var(--ink)]">Take or upload a photo of your handwritten page</span>
                  <span className="text-[12px] text-[var(--ink-soft)]">AI will transcribe it into text you can edit</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && onScanFile(e.target.files[0])}
                  />
                </label>
              )}

              {photo && scanning && (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--line)] px-4 py-10 text-center">
                  <img src={photo} alt="" className="h-24 w-24 rounded-xl object-cover" />
                  <div className="flex items-center gap-2 text-[13.5px] text-[var(--ink-soft)]">
                    <Sparkles size={15} className="animate-pulse text-[var(--accent)]" />
                    Transcribing your handwriting...
                  </div>
                </div>
              )}

              {photo && !scanning && freeText && (
                <>
                  <p className="text-[12px] text-[var(--ink-soft)]">
                    Here's what AI read from your page, a mock preview for this demo. Edit anything that's off.
                  </p>
                  <textarea
                    autoFocus
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value)}
                    rows={8}
                    className="w-full resize-none rounded-xl border border-[var(--line)] p-4 text-[15px] leading-relaxed outline-none focus:border-[var(--accent)]"
                  />
                  <button
                    disabled={!freeText.trim()}
                    onClick={goSummarize}
                    className="ml-auto rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm text-white disabled:opacity-30"
                  >
                    Continue
                  </button>
                </>
              )}
            </div>
          )}

          {step === 'guided' && (
            <div className="flex flex-col gap-5">
              <DateAndPhotoHeader date={entryDate} onDateChange={setEntryDate} photo={photo} onPhotoFile={onPhotoFile} />
              {templateQuestions.map((q, i) => (
                <div key={q.id}>
                  <label
                    className="mb-1.5 block text-[14px] text-[var(--ink)]"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    <span className="text-[var(--ink-soft)]">{i + 1}.</span> {q.label}
                  </label>
                  <textarea
                    value={answers[q.id] ?? ''}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                    rows={2}
                    className="w-full resize-none rounded-lg border border-[var(--line)] p-3 text-[14.5px] outline-none focus:border-[var(--accent)]"
                    style={{ fontFamily: 'var(--font-serif)', fontWeight: 300 }}
                  />
                </div>
              ))}
              <button
                onClick={goSummarize}
                className="ml-auto rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm text-white"
              >
                Continue
              </button>
            </div>
          )}

          {step === 'summarize' && (
            <div className="flex flex-col gap-5">
              <p className="text-sm text-[var(--ink-soft)]">Summarize your day in one sentence.</p>
              <input
                autoFocus
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="One sentence about today..."
                className="w-full rounded-xl border border-[var(--line)] p-4 text-[15px] outline-none focus:border-[var(--accent)]"
                style={{ fontFamily: 'var(--font-serif)', fontWeight: 300 }}
              />

              <label className="flex items-center gap-3 rounded-xl border border-[var(--line)] p-3.5">
                <Globe2 size={17} className="shrink-0 text-[var(--ink-soft)]" />
                <span className="flex-1 text-[13px] text-[var(--ink)]">Share to the public feed</span>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
              </label>

              <button
                disabled={!summary.trim()}
                onClick={save}
                className="ml-auto rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm text-white disabled:opacity-30"
              >
                Save entry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
