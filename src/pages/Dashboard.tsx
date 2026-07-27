import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Camera, ChevronLeft, ChevronRight, Flame, ListChecks, Music, PenLine, PlayCircle, Sparkles } from 'lucide-react'
import { NewEntryModal } from '../components/NewEntryModal'
import { useStore } from '../lib/store'
import { useAuth } from '../lib/auth'
import { EntryPhoto } from '../components/EntryPhoto'
import { Avatar } from '../lib/avatars'
import { YearWall } from '../components/YearWall'
import { DailyEnvelope } from '../components/DailyEnvelope'
import { FullEntryOverlay } from '../components/FullEntryOverlay'
import { toPostEntry } from '../lib/entryHelpers'
import { useDailyInspiration } from '../lib/useDailyInspiration'
import { pickIcon } from '../lib/pickIcon'
import { getTodayEnvelope } from '../lib/envelopeContent'
import { paletteHex, paletteColorForSeed } from '../lib/palette'
import { fileToCompressedDataUrl } from '../lib/imageUtils'
import type { Entry, EntryMode } from '../lib/types'
import type { PostEntry } from '../components/PostCard'

function fmt(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function computeStreak(entries: Entry[]): number {
  const dates = new Set(entries.map((e) => e.date))
  const cursor = new Date()
  if (!dates.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function computeThisWeek(entries: Entry[]): number {
  const now = Date.now()
  const weekMs = 6 * 24 * 60 * 60 * 1000
  return entries.filter((e) => {
    const t = new Date(e.date + 'T00:00:00').getTime()
    return t <= now && t >= now - weekMs
  }).length
}

function fullDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
}

function TodayCTA({
  onAdded,
  onOpen,
  onEdit,
}: {
  onAdded: () => void
  onOpen: (e: Entry) => void
  onEdit: (e: Entry) => void
}) {
  const { entries, addEntry } = useStore()
  const [summary, setSummary] = useState('')
  const [photo, setPhoto] = useState<string | undefined>(undefined)
  const [expand, setExpand] = useState<EntryMode | null>(null)
  const already = entries.some((e) => e.date === todayStr())

  const onFile = async (file: File) => {
    try {
      setPhoto(await fileToCompressedDataUrl(file))
    } catch {
      alert("Couldn't read that photo — try a JPEG, PNG, or screenshot.")
    }
  }

  const submit = () => {
    if (!summary.trim()) return
    addEntry({
      id: `e-${Date.now()}`,
      date: todayStr(),
      summary: summary.trim(),
      iconId: pickIcon(summary),
      mode: 'free',
      photo,
      freeText: summary.trim(),
    })
    setSummary('')
    setPhoto(undefined)
    document.getElementById('year-in-summary')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    onAdded()
  }

  if (already) {
    const todays = entries.find((e) => e.date === todayStr())!
    return (
      <div className="flex w-full items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--line-soft)]/40 p-5">
        <button onClick={() => onOpen(todays)} className="flex flex-1 items-center gap-4 text-left">
          <EntryPhoto photo={todays.photo} iconId={todays.iconId} seed={todays.id} size={52} radius="14px" />
          <div>
            <p className="text-[12px] uppercase tracking-[0.06em] text-[var(--ink-soft)]">Today, captured</p>
            <p className="mt-1 text-[14.5px] text-[var(--ink)]" style={{ fontFamily: 'var(--font-serif)', fontWeight: 300 }}>
              {todays.summary}
            </p>
          </div>
        </button>
        <button
          onClick={() => onEdit(todays)}
          className="shrink-0 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-[13px] text-[var(--ink)] hover:bg-[var(--line-soft)]"
        >
          Edit
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[var(--line)] p-5">
      <p className="text-[13px] uppercase tracking-[0.08em] text-[var(--accent)]">Today's prompt</p>
      <p className="mt-2 text-[22px] leading-tight" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
        Summarize your day in one sentence.
      </p>
      <p className="mt-1 text-[13.5px] text-[var(--ink-soft)]">Add it below and watch it land in Your Year in Summary.</p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="One sentence about today..."
          className="w-full rounded-xl border border-[var(--line)] p-3.5 text-[14.5px] outline-none focus:border-[var(--accent)]"
          style={{ fontFamily: 'var(--font-serif)', fontWeight: 300 }}
        />
        <label className="flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--line)] px-4 py-3.5 text-[13px] text-[var(--ink-soft)] hover:border-[var(--accent)]">
          {photo ? <img src={photo} alt="" className="h-6 w-6 rounded object-cover" /> : <Camera size={18} />}
          {photo ? 'Photo added' : 'Add photo'}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </label>
        <button
          disabled={!summary.trim()}
          onClick={submit}
          className="shrink-0 rounded-xl bg-[var(--ink)] px-6 py-3.5 text-[14px] text-white disabled:opacity-30"
        >
          Add to today
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[12px] text-[var(--ink-soft)]">Want to add more?</span>
        <button
          disabled={!summary.trim()}
          onClick={() => setExpand('free')}
          className="flex items-center gap-1.5 rounded-full border border-[var(--line)] px-3.5 py-1.5 text-[12.5px] text-[var(--ink)] hover:border-[var(--accent)] disabled:opacity-30"
        >
          <PenLine size={13} /> Continue with free-write
        </button>
        <button
          disabled={!summary.trim()}
          onClick={() => setExpand('guided')}
          className="flex items-center gap-1.5 rounded-full border border-[var(--line)] px-3.5 py-1.5 text-[12.5px] text-[var(--ink)] hover:border-[var(--accent)] disabled:opacity-30"
        >
          <ListChecks size={13} /> Continue with guided template
        </button>
      </div>

      {expand && (
        <NewEntryModal
          initialStep={expand}
          initialMode={expand}
          initialSummary={summary}
          initialDate={todayStr()}
          onClose={() => setExpand(null)}
          onSaved={() => {
            setExpand(null)
            setSummary('')
            setPhoto(undefined)
            onAdded()
          }}
        />
      )}
    </div>
  )
}

export function Dashboard() {
  const { entries, circles, profile, readCircleEntryIds, templateQuestions } = useStore()
  const { user } = useAuth()
  const [celebrateDate, setCelebrateDate] = useState<string | undefined>(undefined)
  const [openEntry, setOpenEntry] = useState<PostEntry | null>(null)
  const [editOnOpen, setEditOnOpen] = useState(false)
  const [circleFeedIndex, setCircleFeedIndex] = useState(0)

  const openPersonalEntry = (e: Entry, edit = false) => {
    setOpenEntry(toPostEntry(e, profile.name, 'persianRed', templateQuestions))
    setEditOnOpen(edit)
  }

  const streak = useMemo(() => computeStreak(entries), [entries])
  const thisWeek = useMemo(() => computeThisWeek(entries), [entries])

  const circleFeed = useMemo(() => {
    const all = circles.flatMap((c) =>
      c.entries
        .filter((e) => e.memberId !== user?.uid)
        .map((e) => {
          const member = c.members.find((m) => m.id === e.memberId)
          return { entry: e, circleId: c.id, circleName: c.name, memberName: member?.name ?? 'Member', memberColor: member?.color ?? 'oliveShadow' }
        }),
    )
    const unread = all.filter((a) => !readCircleEntryIds.has(a.entry.id))
    const pool = unread.length > 0 ? unread : all
    return [...pool].sort((a, b) => (a.entry.date < b.entry.date ? 1 : -1))
  }, [circles, readCircleEntryIds, user?.uid])

  const circleFeedIdx = circleFeed.length > 0 ? circleFeedIndex % circleFeed.length : 0
  const highlight = circleFeed[circleFeedIdx] ?? null

  const recent = entries.slice(0, 6)
  const envelope = useMemo(() => getTodayEnvelope(entries), [entries])
  const inspiration = useDailyInspiration()

  return (
    <div className="mx-auto max-w-5xl px-6 pb-32 pt-8">
      <div className="text-center">
        <h1 className="text-[34px] leading-tight text-black" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
          Welcome back, {profile.name}.
        </h1>
        <p className="mt-1.5 text-[14.5px] text-[var(--ink-soft)]" style={{ fontFamily: 'var(--font-serif)' }}>
          You are the greatest project you will ever work on.
        </p>
      </div>

      <DailyEnvelope content={envelope} />

      <div className="mt-2 grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
            <Flame size={20} />
          </div>
          <div>
            <p className="text-[20px] leading-none text-[var(--ink)]">{streak}</p>
            <p className="mt-1 text-[12px] text-[var(--ink-soft)]">day journal streak</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--line-soft)] text-[var(--ink)]">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-[20px] leading-none text-[var(--ink)]">{thisWeek}</p>
            <p className="mt-1 text-[12px] text-[var(--ink-soft)]">entries this week</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <TodayCTA
          onAdded={() => {
            setCelebrateDate(todayStr())
            setTimeout(() => setCelebrateDate(undefined), 2500)
          }}
          onOpen={openPersonalEntry}
          onEdit={(e) => openPersonalEntry(e, true)}
        />
      </div>

      <section className="mt-12" id="year-in-summary">
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="text-lg" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
            Your year in summary
          </h2>
          <Link to="/full-bloom" className="flex items-center gap-1 text-[13px] text-[var(--ink-soft)] hover:text-[var(--ink)]">
            See your year <ArrowRight size={13} />
          </Link>
        </div>
        <p className="mb-5 text-[13.5px] text-[var(--ink-soft)]">365 days, one photo at a time.</p>
        <YearWall entries={entries} celebrateDate={celebrateDate} />
      </section>

      <section className="mt-14">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
            Recent days
          </h2>
          <Link to="/archive" className="flex items-center gap-1 text-[13px] text-[var(--ink-soft)] hover:text-[var(--ink)]">
            All past prompts <ArrowRight size={13} />
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {recent.map((e) => (
            <button
              key={e.id}
              onClick={() => openPersonalEntry(e)}
              className="flex w-40 shrink-0 flex-col items-start rounded-2xl border border-[var(--line)] p-5 text-left"
            >
              <EntryPhoto photo={e.photo} iconId={e.iconId} seed={e.id} size={64} radius="16px" />
              <p className="mt-3 text-[11px] uppercase tracking-[0.06em] text-[var(--ink-soft)]">{fmt(e.date)}</p>
              <p
                className="mt-1 line-clamp-3 text-[12.5px] leading-snug text-[var(--ink)]"
                style={{ fontFamily: 'var(--font-serif)', fontWeight: 300 }}
              >
                {e.summary}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section
        className="mt-14 rounded-3xl p-6"
        style={{ background: `color-mix(in srgb, ${paletteHex('ivoryClay')} 30%, white)` }}
      >
        <div className="mb-5 flex items-center gap-2">
          <Sparkles size={16} className="text-[var(--accent)]" />
          <h2 className="text-lg" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
            Daily dose of inspiration
          </h2>
          {inspiration.fromNotion && (
            <span className="ml-1 rounded-full bg-white px-2 py-0.5 text-[10px] uppercase tracking-[0.05em] text-[var(--ink-soft)]">
              Synced from Notion
            </span>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <a
            href={inspiration.scripture.url}
            target="_blank"
            rel="noreferrer"
            className={`rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ${inspiration.scripture.url ? 'hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)]' : 'pointer-events-none'}`}
          >
            <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">Scripture</p>
            <p className="mt-2 text-[13.5px] italic leading-relaxed text-[var(--ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
              "{inspiration.scripture.verse}"
            </p>
            <p className="mt-2 text-[12px] text-[var(--ink-soft)]">{inspiration.scripture.reference}</p>
          </a>
          <a
            href={inspiration.article.url}
            target="_blank"
            rel="noreferrer"
            className={`rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ${inspiration.article.url ? 'hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)]' : 'pointer-events-none'}`}
          >
            <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">Article</p>
            <div className="mt-2 flex items-start gap-2">
              <BookOpen size={16} className="mt-0.5 shrink-0 text-[var(--ink-soft)]" />
              <div>
                <p className="text-[14px] text-[var(--ink)]">{inspiration.article.title}</p>
                <p className="text-[12px] text-[var(--ink-soft)]">{inspiration.article.source}</p>
              </div>
            </div>
            <p className="mt-2 text-[12.5px] text-[var(--ink-soft)]">{inspiration.article.blurb}</p>
          </a>
          {inspiration.featuredEntry && (
            <button
              onClick={() =>
                setOpenEntry({
                  id: 'featured-today',
                  name: inspiration.featuredEntry!.author,
                  color: 'cabernet',
                  summary: inspiration.featuredEntry!.summary,
                  iconId: inspiration.featuredEntry!.iconId,
                  date: todayStr(),
                })
              }
              className="rounded-2xl bg-white p-5 text-left shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
            >
              <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">Featured entry</p>
              <div className="mt-2 flex items-center gap-3">
                <EntryPhoto iconId={inspiration.featuredEntry.iconId} size={40} radius="12px" />
                <div>
                  <p className="text-[13.5px] text-[var(--ink)]" style={{ fontFamily: 'var(--font-serif)', fontWeight: 300 }}>
                    {inspiration.featuredEntry.summary}
                  </p>
                  <p className="text-[12px] text-[var(--ink-soft)]">— {inspiration.featuredEntry.author}</p>
                </div>
              </div>
            </button>
          )}
          <a
            href={inspiration.music.url}
            target="_blank"
            rel="noreferrer"
            className={`rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ${inspiration.music.url ? 'hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)]' : 'pointer-events-none'}`}
          >
            <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">Music</p>
            <div className="mt-2 flex items-center gap-2">
              <Music size={16} className="text-[var(--ink-soft)]" />
              <div>
                <p className="text-[14px] text-[var(--ink)]">{inspiration.music.title}</p>
                <p className="text-[12px] text-[var(--ink-soft)]">{inspiration.music.artist}</p>
              </div>
            </div>
          </a>
          <a
            href={inspiration.media.url}
            target="_blank"
            rel="noreferrer"
            className={`rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ${inspiration.media.url ? 'hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)]' : 'pointer-events-none'}`}
          >
            <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">Media</p>
            <div className="mt-2 flex items-center gap-2">
              <PlayCircle size={16} className="text-[var(--ink-soft)]" />
              <div>
                <p className="text-[14px] text-[var(--ink)]">{inspiration.media.title}</p>
                <p className="text-[12px] text-[var(--ink-soft)]">{inspiration.media.kind}</p>
              </div>
            </div>
          </a>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="mb-1 text-lg" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
          Find out how your people are doing too
        </h2>
        {highlight ? (
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={() => setCircleFeedIndex((i) => (i - 1 + circleFeed.length) % circleFeed.length)}
              disabled={circleFeed.length < 2}
              aria-label="Previous update"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-white disabled:opacity-20"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="w-full max-w-[360px] rounded-2xl border border-[var(--line)] p-5">
              <button
                onClick={() =>
                  setOpenEntry({
                    id: highlight.entry.id,
                    name: highlight.memberName,
                    color: highlight.memberColor,
                    summary: highlight.entry.summary,
                    iconId: highlight.entry.iconId,
                    photo: highlight.entry.photo,
                    photos: highlight.entry.photos,
                    fullText: highlight.entry.fullText,
                    date: highlight.entry.date,
                  })
                }
                className="block w-full"
              >
                {highlight.entry.photo ? (
                  <img src={highlight.entry.photo} alt="" className="aspect-square w-full rounded-2xl object-cover" />
                ) : (
                  <div
                    className="aspect-square w-full rounded-2xl"
                    style={{ background: paletteColorForSeed(highlight.entry.id) }}
                  />
                )}
              </button>
              <div className="mt-3 flex items-center gap-2.5">
                <Avatar name={highlight.memberName} color={highlight.memberColor} size={30} />
                <div>
                  <p className="text-[13.5px] font-medium text-[var(--ink)]">{highlight.memberName}</p>
                  <p className="text-[11px] text-[var(--ink-soft)]">{fullDate(highlight.entry.date)}</p>
                </div>
              </div>
              <p
                className="mt-3 text-[15px] leading-relaxed text-[var(--ink)]"
                style={{ fontFamily: 'var(--font-serif)', fontWeight: 300 }}
              >
                {highlight.entry.summary}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <Link
                  to={`/circles/${highlight.circleId}`}
                  className="flex items-center gap-1 text-[13px] text-[var(--accent)] hover:underline"
                >
                  Go to your {highlight.circleName} circle <ArrowRight size={13} />
                </Link>
                {circleFeed.length > 1 && (
                  <p className="text-[11px] text-[var(--ink-soft)]">
                    {circleFeedIdx + 1} of {circleFeed.length}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setCircleFeedIndex((i) => (i + 1) % circleFeed.length)}
              disabled={circleFeed.length < 2}
              aria-label="Next update"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-white disabled:opacity-20"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        ) : (
          <p className="mt-3 text-[13.5px] text-[var(--ink-soft)]">Join a circle to see how your people are doing.</p>
        )}
      </section>

      {openEntry && (
        <FullEntryOverlay
          entry={openEntry}
          startInEdit={editOnOpen}
          onBack={() => {
            setOpenEntry(null)
            setEditOnOpen(false)
          }}
        />
      )}
    </div>
  )
}
