import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { useStore } from '../lib/store'
import { useAuth } from '../lib/auth'
import { Avatar } from '../lib/avatars'
import { PostCard, type PostEntry } from '../components/PostCard'
import { FullEntryOverlay } from '../components/FullEntryOverlay'
import { toPostEntry } from '../lib/entryHelpers'
import { EXPLORE_SEED } from '../lib/exploreSeed'

type Tab = 'explore' | 'following' | 'mine'

export function Social() {
  const { circles, profile, entries, templateQuestions, explorePublicPosts } = useStore()
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('explore')
  const [openEntry, setOpenEntry] = useState<PostEntry | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  const allPeople = useMemo(() => {
    const map = new Map<string, { name: string; color: string; photo?: string }>()
    map.set(profile.name, { name: profile.name, color: 'persianRed', photo: profile.photo })
    for (const c of circles) {
      for (const m of c.members) {
        if (!map.has(m.name)) map.set(m.name, { name: m.name, color: m.color, photo: m.photo })
      }
    }
    for (const p of explorePublicPosts) {
      const n = p.authorName ?? 'Someone'
      if (!map.has(n)) map.set(n, { name: n, color: p.authorColor ?? 'oliveShadow', photo: p.authorPhoto })
    }
    for (const p of EXPLORE_SEED) {
      if (!map.has(p.name)) map.set(p.name, { name: p.name, color: p.color })
    }
    return [...map.values()]
  }, [profile.name, profile.photo, circles, explorePublicPosts])

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return allPeople.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 20)
  }, [allPeople, query])

  const following: PostEntry[] = useMemo(
    () =>
      circles.flatMap((c) =>
        c.entries.map((e) => {
          const isMe = e.memberId === user?.uid
          const member = c.members.find((m) => m.id === e.memberId)
          return {
            id: e.id,
            name: isMe ? profile.name : (member?.name ?? 'Member'),
            color: isMe ? 'persianRed' : (member?.color ?? 'oliveShadow'),
            summary: e.summary,
            iconId: e.iconId,
            photo: e.photo,
            photos: e.photos,
            fullText: e.fullText,
            date: e.date,
          }
        }),
      ),
    [circles, profile.name, user?.uid],
  )

  const explorePosts: PostEntry[] = useMemo(
    () =>
      explorePublicPosts.map((p) => ({
        id: p.id,
        name: p.authorName ?? 'Someone',
        color: p.authorColor ?? 'oliveShadow',
        summary: p.summary,
        iconId: p.iconId,
        photo: p.photo,
        photos: p.photos,
        fullText: p.freeText,
        date: p.date,
      })),
    [explorePublicPosts],
  )

  const explore: PostEntry[] = useMemo(
    () => [...following, ...explorePosts, ...EXPLORE_SEED].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [following, explorePosts],
  )

  const mine: PostEntry[] = useMemo(
    () =>
      entries
        .filter((e) => e.public)
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .map((e) => toPostEntry(e, profile.name, 'persianRed', templateQuestions)),
    [entries, profile.name, templateQuestions],
  )

  const active = tab === 'explore' ? explore : tab === 'following' ? following : mine

  return (
    <div className="mx-auto max-w-5xl px-6 pb-6 pt-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[32px] leading-tight" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
            Social
          </h1>
          <p className="mt-2 text-[14.5px] text-[var(--ink-soft)]">A safe space to be yourself and to share it with others.</p>
        </div>
        <button
          onClick={() => {
            setSearchOpen((v) => !v)
            if (searchOpen) setQuery('')
          }}
          aria-label="Search people"
          className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${
            searchOpen ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-[var(--line)] text-[var(--ink-soft)] hover:text-[var(--ink)]'
          }`}
        >
          {searchOpen ? <X size={17} /> : <Search size={17} />}
        </button>
      </div>

      {searchOpen && (
        <div className="mt-4 rounded-2xl border border-[var(--line)] p-3">
          <div className="flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2">
            <Search size={15} className="text-[var(--ink-soft)]" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people by name..."
              className="w-full text-[13.5px] outline-none"
            />
          </div>
          {query.trim() && (
            <div className="mt-2 flex flex-col gap-1">
              {searchResults.length > 0 ? (
                searchResults.map((p) => (
                  <Link
                    key={p.name}
                    to={`/people/${encodeURIComponent(p.name)}`}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-[var(--line-soft)]"
                  >
                    {p.photo ? (
                      <img src={p.photo} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <Avatar name={p.name} color={p.color} size={36} />
                    )}
                    <span className="text-[13.5px] text-[var(--ink)]">{p.name}</span>
                  </Link>
                ))
              ) : (
                <p className="px-2 py-2 text-[13px] text-[var(--ink-soft)]">No one found by that name.</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex justify-center gap-6 border-b border-[var(--line)]">
        {(['explore', 'following', 'mine'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 pb-3 text-[13px] uppercase tracking-[0.06em] ${
              tab === t ? 'border-[var(--ink)] text-[var(--ink)]' : 'border-transparent text-[var(--ink-soft)]'
            }`}
          >
            {t === 'explore' ? 'Explore' : t === 'following' ? 'Following' : 'My Public Posts'}
          </button>
        ))}
      </div>

      <div className="mt-4 h-[calc(100svh-300px)] min-h-[420px] snap-y snap-mandatory overflow-y-auto rounded-2xl pb-6" style={{ marginBottom: 88 }}>
        {active.map((entry) => (
          <div key={entry.id} className="flex min-h-full snap-start items-center justify-center py-4">
            <PostCard entry={entry} onOpen={setOpenEntry} />
          </div>
        ))}
        {active.length === 0 && (
          <p className="pt-10 text-center text-[13.5px] text-[var(--ink-soft)]">
            {tab === 'following'
              ? 'Join a circle to see friends’ entries here.'
              : tab === 'mine'
                ? "You haven't shared any entries publicly yet."
                : 'Nothing to explore yet. Share an entry publicly and it will show up here for everyone.'}
          </p>
        )}
      </div>

      {openEntry && <FullEntryOverlay entry={openEntry} onBack={() => setOpenEntry(null)} />}
    </div>
  )
}
